import type { RoutingPolicy } from '../agent/types'

export type CrudAction = 'create' | 'read' | 'update' | 'delete'

export type RoutingRuleSpec = {
  crud?: CrudAction | CrudAction[]
  resource?: string | RegExp
  forceTool: { name: string; hard?: boolean }
}

export function buildRoutingPolicy(specs: RoutingRuleSpec[], opts?: { allowParallelChildren?: boolean; dryRun?: boolean }): RoutingPolicy {
  const rules = specs.map(s => ({
    match: (input: { text: string; history: Array<{ role: 'user' | 'assistant'; content: string }> }) => {
      const text = (input.text || '').toLowerCase()
      const matchesCrud = (() => {
        if (!s.crud) return true
        const actions = Array.isArray(s.crud) ? s.crud : [s.crud]
        // naive heuristics
        const map: Record<CrudAction, RegExp> = {
          create: /\b(create|add|new|provision|open)\b/i,
          read: /\b(list|show|get|fetch|view|status)\b/i,
          update: /\b(update|edit|modify|change|set)\b/i,
          delete: /\b(delete|remove|cancel|close|drop)\b/i
        }
        return actions.some(a => map[a].test(text))
      })()
      const matchesResource = (() => {
        if (!s.resource) return true
        if (s.resource instanceof RegExp) return s.resource.test(text)
        return text.includes(String(s.resource).toLowerCase())
      })()
      return matchesCrud && matchesResource
    },
    forceTool: s.forceTool
  }))
  return { allowParallelChildren: !!opts?.allowParallelChildren, rules, dryRun: !!opts?.dryRun }
}


