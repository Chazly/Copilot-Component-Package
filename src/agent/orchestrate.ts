import type { CopilotAgent } from './CopilotAgent'
import type { AgentConfig } from './types'
import type { DelegationContext, PreDelegateHook } from './types'
import { emitEvent, sanitizeToolName, resultToText } from '../lib'
import type { RuntimeTool } from '../types'

const sanitize = sanitizeToolName

export function asTool(name: string, agent: CopilotAgent, schema: any = { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] }) {
  const id = sanitize(name)
  const tool: RuntimeTool = {
    id,
    name: id,
    description: `${name} delegated agent`,
    inputSchema: schema,
    route: '__local__',
    transport: 'http'
  }
  const runner = async (args: any) => {
    const input = typeof args?.input === 'string' ? args.input : JSON.stringify(args)
    await agent.send(input)
    const assistantMessages = agent.getMessages().filter(m => m.sender === 'assistant')
    const last = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : undefined
    return resultToText(last?.content || '')
  }
  return { tool, runnerKey: id, runner }
}

export function createOrchestratorConfig(
  base: AgentConfig,
  children: Array<{ name: string; agent: CopilotAgent; schema?: any }>,
  opts?: {
    preDelegate?: PreDelegateHook
    seedPersistentChild?: boolean
    merge?: 'base-wins' | 'children-win'
  }
): AgentConfig {
  const accTools: RuntimeTool[] = [...(base.tools || [])]
  const runners: Record<string, (args: any) => Promise<any>> = { ...(base.toolRunners || {}) }
  for (const c of children) {
    const { tool, runnerKey, runner } = asDelegatingTool(base, c.name, c.agent, opts, c.schema)
    accTools.push(tool)
    runners[runnerKey] = runner
  }
  // Merge precedence: routingPolicy, observability, briefFormatter, preDelegate
  const merged: AgentConfig = { ...base, tools: accTools, toolRunners: runners }
  // Documented precedence: base->opts overrides nothing here, but slots exist for clarity
  merged.routingPolicy = base.routingPolicy
  merged.observability = base.observability
  merged.briefFormatter = base.briefFormatter
  // children do not override base unless explicitly requested
  if (opts?.merge === 'children-win') {
    // nothing specific per-child to merge at this level yet
  }
  return merged
}

export function asDelegatingTool(masterCfg: AgentConfig, name: string, child: CopilotAgent, opts?: { preDelegate?: PreDelegateHook; seedPersistentChild?: boolean }, schema: any = { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] }) {
  const id = sanitize(name)
  const tool: RuntimeTool = {
    id,
    name: id,
    description: `${name} delegated agent`,
    inputSchema: schema,
    route: '__local__',
    transport: 'http'
  }
  const runner = async (args: any) => {
    const correlationId = crypto.randomUUID()
    const input = typeof args?.input === 'string' ? args.input : JSON.stringify(args)
    const parentMessages = [] as any[]
    try {
      emitEvent('delegate_start', masterCfg, { correlationId, child: name, args: args || {} })
    } catch {}
    try {
      // Build delegation context for brief
      const parent = (masterCfg as any)
      const ctx: DelegationContext = {
        parentMessages,
        lastUserMessage: typeof input === 'string' ? input : JSON.stringify(input),
        chosenChildName: name,
        businessId: (parent?.businessId || undefined),
        sessionId: (parent?.sessionId || undefined),
        userId: (parent?.userId || undefined),
        constraints: (parent?.constraints || undefined),
        childTools: child.tools
      }

      let brief = ''
      if (opts?.preDelegate) brief = await opts.preDelegate(ctx)
      if (!brief && masterCfg.briefFormatter) brief = masterCfg.briefFormatter(ctx)
      if (!brief) {
        // Strict default brief to prevent null assistant start
        brief = `You are the ${name} delegate. Task: ${ctx.lastUserMessage}. Provide a concise response.`
      }
      brief = String(brief || '').trim()

      // Guarantee: seed child's first assistant message with brief
      child.seedFirstAssistant(brief, { reset: !!opts?.seedPersistentChild })

      // Single-turn child invoke
      await child.send(input)
      const assistantMessages = child.getMessages().filter(m => m.sender === 'assistant')
      const last = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : undefined
      let rawText = String(last?.content || '').trim()
      if (!rawText) rawText = 'Operation completed with no additional details.'
      let result = resultToText(rawText, { onFallback: () => { try { emitEvent('fallback_json_used', masterCfg, { child: name }) } catch {} } })
      if (masterCfg.postDelegate) {
        const post = await masterCfg.postDelegate({ childName: name, text: result, context: ctx })
        result = resultToText(post || result)
      }
      emitEvent('delegate_end', masterCfg, { correlationId, child: name, ok: true })
      return result
    } catch (e) {
      emitEvent('delegate_end', masterCfg, { correlationId, child: name, ok: false, error: e instanceof Error ? e.message : String(e) })
      throw e
    }
  }
  return { tool, runnerKey: id, runner }
}


