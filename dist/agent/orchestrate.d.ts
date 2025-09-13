import type { CopilotAgent } from './CopilotAgent';
import type { AgentConfig } from './types';
import type { RuntimeTool } from '../types';
export declare function asTool(name: string, agent: CopilotAgent, schema?: any): {
    tool: RuntimeTool;
    runnerKey: string;
    runner: (args: any) => Promise<string>;
};
export declare function createOrchestratorConfig(base: AgentConfig, children: Array<{
    name: string;
    agent: CopilotAgent;
    schema?: any;
}>): AgentConfig;
