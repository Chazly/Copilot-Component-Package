import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useCopilotConfig } from '../hooks/useCopilotConfig';
import { ProviderRegistry } from '../services/BaseProvider';
import { CopilotAgent } from '../agent/CopilotAgent';
import { AgentUIRegistry } from './agent-ui-registry';
import { AgentChatUI } from './AgentChatUI';
export function AgentEnabledCopilot({ baseConfig, showUI = true }) {
    const { config } = useCopilotConfig(baseConfig);
    const provider = React.useMemo(() => {
        const reg = ProviderRegistry.getProvider(config.modelProvider);
        if (!reg)
            throw new Error(`Unknown provider: ${config.modelProvider}`);
        return reg.factory({
            modelProvider: config.modelProvider,
            model: config.model,
            baseURL: 'https://api.openai.com'
        });
    }, [config.modelProvider, config.model]);
    const agent = React.useMemo(() => {
        var _a;
        return new CopilotAgent(provider, config, {
            name: config.name,
            description: config.description,
            logo_or_avatar: (_a = config.persona) === null || _a === void 0 ? void 0 : _a.avatarUrl,
            system_prompts: [config.systemPrompt],
            tools: [],
            toolRunners: {},
            ui_to_use: 'default',
            debug: false
        });
    }, [provider, config]);
    if (!showUI)
        return null;
    const UI = AgentUIRegistry.get(agent.uiKey) || AgentChatUI;
    return _jsx(UI, { agent: agent });
}
export default AgentEnabledCopilot;
