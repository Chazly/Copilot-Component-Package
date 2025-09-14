import type { CopilotAgent } from './CopilotAgent'
import type { AgentConfig } from './types'
import type { DelegationContext, PreDelegateHook } from './types'
import { emitEvent } from '../lib/observability'
import { sanitizeToolName } from '../lib/tools'
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
    return last?.content || ''
  }
  return { tool, runnerKey: id, runner }
}

export function createOrchestratorConfig(
  base: AgentConfig,
  children: Array<{ name: string; agent: CopilotAgent; schema?: any }>,
  opts?: {
    preDelegate?: PreDelegateHook
    seedPersistentChild?: boolean
  }
): AgentConfig {
  const accTools: RuntimeTool[] = [...(base.tools || [])]
  const runners: Record<string, (args: any) => Promise<any>> = { ...(base.toolRunners || {}) }
  for (const c of children) {
    const { tool, runnerKey, runner } = asDelegatingTool(base, c.name, c.agent, opts, c.schema)
    accTools.push(tool)
    runners[runnerKey] = runner
  }
  return { ...base, tools: accTools, toolRunners: runners }
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
      brief = String(brief || '').trim()

      // Guarantee: seed child's first assistant message with brief if missing
      if (brief) child.seedFirstAssistant(brief, { reset: !!opts?.seedPersistentChild })

      // Single-turn child invoke
      await child.send(input)
      const assistantMessages = child.getMessages().filter(m => m.sender === 'assistant')
      const last = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : undefined
      const result = last?.content || ''
      emitEvent('delegate_end', masterCfg, { correlationId, child: name, ok: true })
      return result
    } catch (e) {
      emitEvent('delegate_end', masterCfg, { correlationId, child: name, ok: false, error: e instanceof Error ? e.message : String(e) })
      throw e
    }
  }
  return { tool, runnerKey: id, runner }
}


