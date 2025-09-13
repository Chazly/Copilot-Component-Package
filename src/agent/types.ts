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

  ui_to_use?: string
  logger?: AgentLogger
  debug?: boolean
}


