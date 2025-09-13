import React from 'react';
import type { CopilotAgent } from '../agent/CopilotAgent';
export type AgentUIComponent = React.ComponentType<{
    agent: CopilotAgent;
}>;
declare class AgentUIRegistryClass {
    private map;
    register(key: string, comp: AgentUIComponent): void;
    get(key: string): AgentUIComponent | undefined;
}
export declare const AgentUIRegistry: AgentUIRegistryClass;
export {};
