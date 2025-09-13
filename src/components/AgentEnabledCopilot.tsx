import React from 'react'
import { useCopilotConfig } from '../hooks/useCopilotConfig'
import { ProviderRegistry } from '../services/BaseProvider'
import { CopilotAgent } from '../agent/CopilotAgent'
import { AgentUIRegistry } from './agent-ui-registry'
import { AgentChatUI } from './AgentChatUI'

export function AgentEnabledCopilot({ baseConfig, showUI = true }: { baseConfig: any; showUI?: boolean }) {
  const { config } = useCopilotConfig(baseConfig)
  const provider = React.useMemo(() => {
    const reg = ProviderRegistry.getProvider(config.modelProvider)
    if (!reg) throw new Error(`Unknown provider: ${config.modelProvider}`)
    return reg.factory({
      modelProvider: config.modelProvider,
      model: config.model,
      baseURL: 'https://api.openai.com'
    } as any)
  }, [config.modelProvider, config.model])

  const agent = React.useMemo(() => new CopilotAgent(provider as any, config, {
    name: config.name,
    description: config.description,
    logo_or_avatar: config.persona?.avatarUrl,
    system_prompts: [config.systemPrompt],
    tools: [],
    toolRunners: {},
    ui_to_use: 'default',
    debug: false
  }), [provider, config])

  if (!showUI) return null
  const UI = AgentUIRegistry.get(agent.uiKey) || AgentChatUI
  return <UI agent={agent} />
}

export default AgentEnabledCopilot


