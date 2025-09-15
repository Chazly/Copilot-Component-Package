import { useEffect } from 'react'
import type { AgentConfig } from '../agent/types'

export function useCopilotDevtools(enabled: boolean, info: { agent?: string; correlationId?: string; includeBriefInDebugLogs?: boolean } = {}) {
  useEffect(() => {
    if (!enabled) return
    try {
      console.log('[CopilotDevtools] enabled', { ...info })
    } catch {}
  }, [enabled, info?.agent, info?.correlationId, info?.includeBriefInDebugLogs])
}

export default useCopilotDevtools


