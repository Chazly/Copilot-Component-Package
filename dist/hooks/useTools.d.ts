import { AICopilotConfig } from '../types';
interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: Date;
    duration: number;
}
interface Tool {
    name: string;
    description: string;
    parameters?: Record<string, any>;
    execute: (params: any, context?: any) => Promise<any> | any;
    category?: 'data' | 'action' | 'integration' | 'utility';
    requiresAuth?: boolean;
    cacheable?: boolean;
    cacheTTL?: number;
}
interface ContextSource {
    name: string;
    type: 'notion' | 'supabase' | 'github' | 'custom';
    config: {
        apiEndpoint: string;
        authMethod: 'bearer' | 'apikey' | 'oauth';
        apiKey?: string;
        refreshInterval?: number;
    };
    transformer?: (data: any) => any;
}
export declare function useTools(config: AICopilotConfig): {
    tools: Tool[];
    contextSources: ContextSource[];
    executionHistory: ToolResult[];
    isExecuting: boolean;
    lastError: string | null;
    cacheSize: number;
    registerTool: (tool: Tool) => void;
    unregisterTool: (toolName: string) => void;
    executeTool: (toolName: string, parameters?: any, context?: any) => Promise<ToolResult>;
    fetchFromContextSource: (sourceName: string, query?: string) => Promise<any>;
    clearCache: () => void;
    abortExecution: () => void;
    hasTool: (name: string) => boolean;
    hasContextSource: (name: string) => boolean;
};
export {};
