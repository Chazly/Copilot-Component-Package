import type { BaseProvider, ChatMessage } from '../services/BaseProvider';
import type { NormalizedCopilotConfig, Message, RuntimeTool } from '../types';
import type { AgentConfig, SystemPrompt } from './types';
type AgentEvents = {
    message: (msg: Message) => void;
    loading: (isLoading: boolean) => void;
    stream: (delta: string) => void;
    error: (err: Error) => void;
};
export declare class CopilotAgent {
    protected provider: BaseProvider;
    protected cfg: NormalizedCopilotConfig;
    protected agentCfg: AgentConfig;
    protected listeners: Partial<AgentEvents>;
    protected history: Message[];
    protected log: import("./types").AgentLogger;
    constructor(provider: BaseProvider, normalizedConfig: NormalizedCopilotConfig, agentConfig: AgentConfig);
    get name(): string;
    get description(): string;
    get avatarUrl(): string;
    get uiKey(): string;
    get tools(): RuntimeTool[];
    on<T extends keyof AgentEvents>(event: T, cb: AgentEvents[T]): void;
    getMessages(): Message[];
    send(text: string, opts?: {
        toolChoice?: 'auto' | {
            name: string;
        };
    }): Promise<void>;
    sendStream(text: string, opts?: {
        toolChoice?: 'auto' | {
            name: string;
        };
    }): Promise<void>;
    protected handleToolCalls(toolCalls?: Array<{
        id?: string;
        name?: string;
        arguments?: any;
    }>): Promise<void>;
    protected resolveSystemPrompt(): Promise<string | undefined>;
    protected resolveContext(): Promise<string | undefined>;
    protected serializeContext(obj: Record<string, any>): string;
    protected pickPrompt(prompts?: SystemPrompt[], ctx?: string): string | undefined;
    protected toProviderMessages(latest?: Message): ChatMessage[];
    protected toToolChoice(choice?: 'auto' | {
        name: string;
    }): "auto" | {
        type: string;
        function: {
            name: string;
        };
    };
    seedFirstAssistant(brief: string, opts?: {
        reset?: boolean;
    }): void;
    protected resolveToolChoice(latestUserText: string, history: Message[]): 'auto' | {
        name: string;
    };
    protected push(msg: Message): void;
    protected append(id: string, delta: string): void;
    protected replace(id: string, content: string): void;
    protected emit<T extends keyof AgentEvents>(event: T, payload: Parameters<AgentEvents[T]>[0]): void;
}
export default CopilotAgent;
