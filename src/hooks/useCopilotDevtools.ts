import { useEffect } from 'react'
import type { AgentConfig } from '../agent/types'

export function useCopilotDevtools(enabled: boolean, info: { agent?: string; correlationId?: string; includeBriefInDebugLogs?: boolean } = {}) {
  useEffect(() => {
    if (!enabled) return
    try {
      console.log('[CopilotDevtools] enabled', { ...info })

      // Lightweight console tap to surface routing + continuation decisions
      const originalDebug = console.debug?.bind(console)
      const originalError = console.error?.bind(console)

      console.debug = (...args: any[]) => {
        try {
          const arg0 = args?.[0]
          const isObs = typeof arg0 === 'string' && arg0.startsWith('[obs]')
          const payload = args?.[1]
          if (isObs && payload?.event) {
            if (payload.event === 'continuation_start' || payload.event === 'continuation_end') {
              originalDebug?.('[CopilotDevtools][continuation]', { event: payload.event, key: payload.key, correlationId: payload.correlationId })
            }
          }
          // Routing rule/selection surfaced by agent logger
          const isRouting = typeof arg0 === 'string' && (arg0.includes('routing_rule') || arg0.includes('routing_selected'))
          if (isRouting) {
            originalDebug?.('[CopilotDevtools][routing]', ...args.slice(1))
          }
        } catch {}
        return originalDebug?.(...args)
      }

      console.error = (...args: any[]) => {
        try {
          const arg0 = args?.[0]
          const isObs = typeof arg0 === 'string' && arg0.startsWith('[obs]')
          const payload = args?.[1]
          if (isObs && payload?.event) {
            originalError?.('[CopilotDevtools][error]', payload)
          }
        } catch {}
        return originalError?.(...args)
      }

      return () => {
        if (originalDebug) console.debug = originalDebug
        if (originalError) console.error = originalError
      }
    } catch {}
  }, [enabled, info?.agent, info?.correlationId, info?.includeBriefInDebugLogs])
}

export default useCopilotDevtools


