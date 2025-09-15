import type { AgentConfig } from '../agent/types'

type EventName =
  | 'delegate_start'
  | 'delegate_end'
  | 'tool_invoke'
  | 'tool_result'
  | 'model_request'
  | 'model_error'
  | 'continuation_start'
  | 'continuation_end'
  | 'fallback_json_used'

export function emitEvent(event: EventName, cfg: AgentConfig, payload: any) {
  try {
    const redactor = cfg.observability?.redact
    const includeBrief = !!cfg.observability?.includeBriefInDebugLogs
    const base = includeBrief ? payload : (() => {
      const p = { ...payload }
      if ('brief' in p) delete (p as any).brief
      return p
    })()
    const data = redactor ? redactor(base) : base
    const id = cfg.observability?.correlationId || undefined
    const safe = { event, correlationId: id, ...data }
    const logger = (cfg.logger || console) as any
    if (event.endsWith('error')) {
      logger.error?.('[obs]', safe)
    } else {
      logger.debug?.('[obs]', safe)
    }
  } catch {}
}


