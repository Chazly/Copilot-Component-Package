import React from 'react'
import type { CopilotAgent } from '../agent/CopilotAgent'

export type AgentUIComponent = React.ComponentType<{ agent: CopilotAgent }>

class AgentUIRegistryClass {
  private map = new Map<string, AgentUIComponent>()
  register(key: string, comp: AgentUIComponent) { this.map.set(key, comp) }
  get(key: string): AgentUIComponent | undefined { return this.map.get(key) }
}

export const AgentUIRegistry = new AgentUIRegistryClass()


