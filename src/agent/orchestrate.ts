import type { CopilotAgent } from './CopilotAgent'
import type { AgentConfig } from './types'
import type { RuntimeTool } from '../types'

const sanitize = (s: string) => String(s).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_')

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

export function createOrchestratorConfig(base: AgentConfig, children: Array<{ name: string; agent: CopilotAgent; schema?: any }>): AgentConfig {
  const accTools: RuntimeTool[] = [...(base.tools || [])]
  const runners: Record<string, (args: any) => Promise<any>> = { ...(base.toolRunners || {}) }
  for (const c of children) {
    const { tool, runnerKey, runner } = asTool(c.name, c.agent, c.schema)
    accTools.push(tool)
    runners[runnerKey] = runner
  }
  return { ...base, tools: accTools, toolRunners: runners }
}


