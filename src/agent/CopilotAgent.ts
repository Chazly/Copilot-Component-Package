import type { BaseProvider, ChatMessage, StreamChunk } from '../services/BaseProvider'
import type { NormalizedCopilotConfig, Message, RuntimeTool } from '../types'
import type { AgentConfig, SystemPrompt, ContextObject } from './types'
import { ConsoleLogger } from './logger'
import { emitEvent } from '../lib/observability'
import { resultToText } from '../lib/result'

type AgentEvents = {
  message: (msg: Message) => void
  loading: (isLoading: boolean) => void
  stream: (delta: string) => void
  error: (err: Error) => void
}

export class CopilotAgent {
  protected provider: BaseProvider
  protected cfg: NormalizedCopilotConfig
  protected agentCfg: AgentConfig
  protected listeners: Partial<AgentEvents> = {}
  protected history: Message[] = []
  protected log = ConsoleLogger('agent')

  constructor(provider: BaseProvider, normalizedConfig: NormalizedCopilotConfig, agentConfig: AgentConfig) {
    this.provider = provider
    this.cfg = normalizedConfig
    this.agentCfg = agentConfig
    this.log = (agentConfig.logger || ConsoleLogger('agent')).withScope(agentConfig.name || normalizedConfig.name)

    this.push({ id: crypto.randomUUID(), content: normalizedConfig.firstMessage, sender: 'assistant', timestamp: new Date() })
  }

  get name() { return this.agentCfg.name || this.cfg.name }
  get description() { return this.agentCfg.description || this.cfg.description }
  get avatarUrl() { return this.agentCfg.logo_or_avatar || this.cfg.persona.avatarUrl }
  get uiKey() { return this.agentCfg.ui_to_use || 'default' }
  get tools(): RuntimeTool[] { return this.agentCfg.tools || [] }

  on<T extends keyof AgentEvents>(event: T, cb: AgentEvents[T]) { (this.listeners as any)[event] = cb }
  getMessages() { return [...this.history] }

  async send(text: string, opts?: { toolChoice?: 'auto' | { name: string } }) {
    const content = String(text || '').trim()
    if (!content) return
    const user: Message = { id: crypto.randomUUID(), content, sender: 'user', timestamp: new Date() }
    this.push(user)
    this.emit('loading', true)
    const t0 = Date.now()
    const correlationId = crypto.randomUUID()

    try {
      this.log.info('send', { len: content.length })
      const resolvedToolChoice = this.resolveToolChoice(content, this.history)
      try { emitEvent('model_request', this.agentCfg, { correlationId, toolChoice: resolvedToolChoice }) } catch {}
      const resp = await (this.provider as any).sendMessage(
        this.toProviderMessages(user),
        await this.resolveSystemPrompt(),
        this.tools,
        this.toToolChoice(opts?.toolChoice || resolvedToolChoice),
        !!this.agentCfg.debug
      )
      const hadTools = Array.isArray(resp?.metadata?.toolCalls) && resp.metadata.toolCalls.length > 0
      await this.handleToolCalls(resp?.metadata?.toolCalls, correlationId)
      if (!hadTools) {
        const c = String(resp?.content || '').trim()
        if (c) this.push({ id: crypto.randomUUID(), content: c, sender: 'assistant', timestamp: new Date() })
      }
      this.log.debug('send:ok', { ms: Date.now() - t0 })
    } catch (e: any) {
      this.log.error('send:fail', e)
      try { emitEvent('model_error', this.agentCfg, { correlationId, error: e instanceof Error ? e.message : String(e) }) } catch {}
      this.emit('error', e)
      this.push({ id: crypto.randomUUID(), content: this.cfg.fallbackMessage, sender: 'assistant', timestamp: new Date() })
    } finally {
      this.emit('loading', false)
    }
  }

  async sendStream(text: string, opts?: { toolChoice?: 'auto' | { name: string } }) {
    const content = String(text || '').trim()
    if (!content) return
    const user: Message = { id: crypto.randomUUID(), content, sender: 'user', timestamp: new Date() }
    this.push(user)
    this.emit('loading', true)
    const placeholderId = crypto.randomUUID()
    this.push({ id: placeholderId, content: '', sender: 'assistant', timestamp: new Date() })
    const t0 = Date.now()

    try {
      this.log.info('stream', { len: content.length })
      await (this.provider as any).sendMessageStream(
        this.toProviderMessages(user),
        (chunk: StreamChunk) => {
          const delta = chunk.content || ''
          if (delta) { this.append(placeholderId, delta); this.emit('stream', delta) }
          if (chunk.isComplete) this.emit('loading', false)
        },
        await this.resolveSystemPrompt(),
        this.tools,
        this.toToolChoice(opts?.toolChoice),
        !!this.agentCfg.debug
      )
      this.log.debug('stream:ok', { ms: Date.now() - t0 })
    } catch (e: any) {
      this.log.error('stream:fail', e)
      this.emit('error', e)
      this.replace(placeholderId, this.cfg.fallbackMessage)
    } finally {
      this.emit('loading', false)
    }
  }

  protected async handleToolCalls(toolCalls?: Array<{ id?: string; name?: string; arguments?: any }>, correlationId?: string) {
    if (!toolCalls || !toolCalls.length) return
    this.log.info('tool_calls', toolCalls.map(t => t.name))
    // Resolve runner context once per batch
    const toolCtx = this.agentCfg.toolContextProvider ? await this.agentCfg.toolContextProvider() : undefined
    if (!toolCtx?.businessId) {
      const msg = 'Select a business to continue'
      this.push({ id: crypto.randomUUID(), content: msg, sender: 'assistant', timestamp: new Date() })
      return
    }
    for (const call of toolCalls) {
      const key = String(call.name || '').slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_')
      const runner = this.agentCfg.toolRunners?.[key]
      if (!runner) { this.log.warn('tool_missing', key); continue }
      try {
        const args = typeof call.arguments === 'object' ? call.arguments : (() => { try { return JSON.parse(call.arguments || '{}') } catch { return {} } })()
        this.log.debug('tool_invoke', { key, args })
        try { emitEvent('tool_invoke', this.agentCfg, { correlationId, key, args }) } catch {}
        // Inject minimal context into args if not present
        const result = await runner({ ...args, __context: { businessId: toolCtx.businessId, sessionId: toolCtx.sessionId, userId: toolCtx.userId } })
        const normalized = resultToText(result, { onFallback: () => { try { emitEvent('fallback_json_used', this.agentCfg, { key }) } catch {} } })
        // Inject tool result as assistant content for model context
        this.push({ id: crypto.randomUUID(), content: normalized, sender: 'assistant', timestamp: new Date() })
        try { emitEvent('tool_result', this.agentCfg, { correlationId, key, ok: true }) } catch {}

        // Post-tool single continuation: force tool_choice none, no streaming
        try { emitEvent('continuation_start', this.agentCfg, { correlationId, key }) } catch {}
        const cont = await (this.provider as any).sendMessage(
          this.toProviderMessages(),
          await this.resolveSystemPrompt(),
          this.tools,
          { type: 'none' },
          !!this.agentCfg.debug
        )
        // If continuation still returns tool_calls, fall back to normalized tool result
        const contHasToolCalls = !!cont?.metadata?.toolCalls?.length
        const finalText = contHasToolCalls ? normalized : (cont?.content || normalized)
        this.push({ id: crypto.randomUUID(), content: finalText || 'Operation completed with no additional details.', sender: 'assistant', timestamp: new Date() })
        try { emitEvent('continuation_end', this.agentCfg, { correlationId, key, contHasToolCalls }) } catch {}
      } catch (e) {
        this.log.error('tool_error', e as any)
        try { emitEvent('tool_result', this.agentCfg, { correlationId, key, ok: false, error: e instanceof Error ? e.message : String(e) }) } catch {}
        this.push({ id: crypto.randomUUID(), content: `Tool '${key}' failed.`, sender: 'assistant', timestamp: new Date() })
      }
    }
  }

  protected async resolveSystemPrompt(): Promise<string | undefined> {
    const ctx = await this.resolveContext()
    const prompt = this.pickPrompt(this.agentCfg.system_prompts, ctx) || this.cfg.systemPrompt
    if (!ctx) return prompt
    const prefix = '[SESSION_CONTEXT]\n'
    return prompt ? `${prefix}${ctx}\n${prompt}` : `${prefix}${ctx}`
  }

  protected async resolveContext(): Promise<string | undefined> {
    const c = this.agentCfg.context
    if (!c) return undefined
    const v = typeof c === 'function' ? await (c as any)() : c
    if (typeof v === 'string') return v
    try {
      const obj = v as ContextObject
      if (this.agentCfg.contextFormatter) return this.agentCfg.contextFormatter(obj)
      return this.serializeContext(obj)
    } catch {
      return String(v)
    }
  }

  protected serializeContext(obj: Record<string, any>): string {
    const stable = (o: any): any => {
      if (Array.isArray(o)) return o.map(stable)
      if (o && typeof o === 'object') {
        return Object.keys(o).sort().reduce((acc, k) => { acc[k] = stable(o[k]); return acc }, {} as any)
      }
      return o
    }
    const body = JSON.stringify(stable(obj), null, 2)
    return `CONTEXT_JSON:\n\`\`\`json\n${body}\n\`\`\``
  }

  protected pickPrompt(prompts: SystemPrompt[] = [], ctx?: string): string | undefined {
    for (const p of prompts) {
      if (typeof p === 'string') return p
      if (!p.when || p.when(ctx)) return p.text
    }
    return undefined
  }

  protected toProviderMessages(latest?: Message): ChatMessage[] {
    const base: ChatMessage[] = this.history.map(m => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
      timestamp: m.timestamp
    }))
    if (latest) base.push({ role: 'user', content: latest.content, timestamp: latest.timestamp })
    return base
  }

  protected toToolChoice(choice?: 'auto' | { name: string }) {
    if (!choice || choice === 'auto') return 'auto'
    return { type: 'function', function: { name: String(choice.name).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_') } }
  }

  // Seed or reset the first assistant message for delegation briefs
  public seedFirstAssistant(brief: string, opts?: { reset?: boolean }) {
    const nonEmptyBrief = String(brief || '').trim()
    if (!nonEmptyBrief) return
    const reset = !!opts?.reset
    const first = this.history.find(m => m.sender === 'assistant')
    if (reset) {
      const seeded = { id: crypto.randomUUID(), content: nonEmptyBrief, sender: 'assistant' as const, timestamp: new Date() }
      const userTail = this.history.filter(m => m.sender === 'user')
      this.history = [seeded, ...userTail]
      this.emit('message', seeded)
      return
    }
    if (!first || !String(first.content || '').trim()) {
      const seeded = { id: crypto.randomUUID(), content: nonEmptyBrief, sender: 'assistant' as const, timestamp: new Date() }
      this.push(seeded)
      return
    }
  }

  // Apply routing policy to compute tool choice if confidence is high
  protected resolveToolChoice(latestUserText: string, history: Message[]): 'auto' | { name: string } {
    const policy = this.agentCfg.routingPolicy
    if (!policy || !policy.rules || policy.rules.length === 0) return 'auto'
    try {
      const input: { text: string; history: Array<{ role: 'user' | 'assistant'; content: string }> } = {
        text: latestUserText,
        history: history.map(m => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.content }))
      }
      for (let idx = 0; idx < policy.rules.length; idx++) {
        const r = policy.rules[idx]
        const matched = !!r.match(input)
        if (policy.dryRun) this.log.debug('routing_rule', { idx, matched, forceTool: r.forceTool?.name })
        if (matched && r.forceTool?.name) {
          if (policy.dryRun) this.log.debug('routing_selected', { tool: r.forceTool.name })
          return { name: r.forceTool.name }
        }
      }
    } catch {}
    return 'auto'
  }

  protected push(msg: Message) { this.history = [...this.history, msg]; this.emit('message', msg) }
  protected append(id: string, delta: string) {
    this.history = this.history.map(m => m.id === id ? { ...m, content: m.content + delta } : m)
    const updated = this.history.find(m => m.id === id); if (updated) this.emit('message', updated)
  }
  protected replace(id: string, content: string) {
    this.history = this.history.map(m => m.id === id ? { ...m, content } : m)
    const updated = this.history.find(m => m.id === id); if (updated) this.emit('message', updated)
  }
  protected emit<T extends keyof AgentEvents>(event: T, payload: Parameters<AgentEvents[T]>[0]) {
    const cb = this.listeners[event]; if (cb) (cb as any)(payload)
  }
}

export default CopilotAgent


