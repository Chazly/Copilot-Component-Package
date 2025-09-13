import type { AgentLogger } from './types'

export const ConsoleLogger = (scope = 'agent'): AgentLogger => ({
  debug: (...a: any[]) => { try { console.debug(`[${scope}]`, ...a) } catch {} },
  info: (...a: any[]) => { try { console.info(`[${scope}]`, ...a) } catch {} },
  warn: (...a: any[]) => { try { console.warn(`[${scope}]`, ...a) } catch {} },
  error: (...a: any[]) => { try { console.error(`[${scope}]`, ...a) } catch {} },
  withScope(s: string) { return ConsoleLogger(`${scope}:${s}`) }
})


