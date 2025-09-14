import type { RuntimeTool } from '../types'

export type SystemPrompt = string | { id: string; text: string; when?: (context?: any) => boolean }

export interface AgentLogger {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  withScope: (scope: string) => AgentLogger
}

export type ContextObject = Record<string, any>
export type ContextSource =
  | string
  | ContextObject
  | (() => Promise<string | ContextObject> | string | ContextObject)

export interface AgentConfig {
  name?: string
  description?: string
  logo_or_avatar?: string

  system_prompts: SystemPrompt[]
  tools?: RuntimeTool[]
  toolRunners?: Record<string, (args: any) => Promise<any>>

  context?: ContextSource
  contextFormatter?: (ctx: ContextObject) => string
  briefFormatter?: (ctx: DelegationContext) => string

  ui_to_use?: string
  logger?: AgentLogger
  debug?: boolean

  // Optional routing policy applied when deciding tool_choice
  routingPolicy?: RoutingPolicy

  // Observability options
  observability?: ObservabilityOptions
}

export type DelegationContext = {
  parentMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: Date }>
  lastUserMessage?: string
  chosenChildName: string
  businessId?: string
  sessionId?: string
  userId?: string
  constraints?: 'read' | 'crud'
  childTools?: RuntimeTool[]
}

export type PreDelegateHook = (ctx: DelegationContext) => string | Promise<string>

export type RoutingPolicy = {
  allowParallelChildren?: boolean
  rules: Array<{
    match: (input: { text: string; history: Array<{ role: 'user' | 'assistant'; content: string }> }) => boolean
    forceTool?: { name: string; hard?: boolean }
  }>
}

export type ObservabilityOptions = {
  correlationId?: string
  redact?: (data: any) => any
  includeBriefInDebugLogs?: boolean
}


