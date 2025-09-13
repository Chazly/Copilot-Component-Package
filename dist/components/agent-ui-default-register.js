import { AgentUIRegistry } from './agent-ui-registry';
import { AgentCopilotChat } from './AgentCopilotChat';
// Register the default UI key to the agent-driven CopilotChat lookalike
try {
    AgentUIRegistry.register('default', AgentCopilotChat);
}
catch (_a) { }
