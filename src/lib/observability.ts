import type { AgentConfig } from '../agent/types'

type EventName = 'delegate_start' | 'delegate_end' | 'tool_invoke' | 'tool_result' | 'model_request' | 'model_error'

export function emitEvent(event: EventName, cfg: AgentConfig, payload: any) {
  try {
    const redactor = cfg.observability?.redact
    const data = redactor ? redactor(payload) : payload
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


