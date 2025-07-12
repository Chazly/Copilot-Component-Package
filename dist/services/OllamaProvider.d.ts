import { BaseProvider, ProviderConfig, ProviderCapabilities, ChatMessage, ChatResponse, StreamChunk } from './BaseProvider';
export interface OllamaModel {
    name: string;
    size: number;
    digest: string;
    modified_at: string;
}
export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}
export declare class OllamaProvider extends BaseProvider {
    private availableModels;
    private currentModel;
    constructor(config: ProviderConfig);
    get name(): string;
    get capabilities(): ProviderCapabilities;
    authenticate(): Promise<boolean>;
    validateConfig(): boolean;
    checkHealth(): Promise<boolean>;
    loadAvailableModels(): Promise<OllamaModel[]>;
    pullModel(modelName: string): Promise<boolean>;
    sendMessage(messages: ChatMessage[], systemPrompt?: string): Promise<ChatResponse>;
    sendMessageStream(messages: ChatMessage[], onChunk: (chunk: StreamChunk) => void, systemPrompt?: string): Promise<void>;
    private formatMessagesForOllama;
    switchModel(modelName: string): Promise<boolean>;
    getAvailableModels(): OllamaModel[];
    getCurrentModel(): string;
}
export default OllamaProvider;
