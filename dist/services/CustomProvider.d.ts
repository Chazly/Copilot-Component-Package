import { BaseProvider, ProviderConfig, ProviderCapabilities, ChatMessage, ChatResponse, StreamChunk } from './BaseProvider';
export interface CustomProviderConfig extends ProviderConfig {
    customConfig?: {
        requestTransformer?: (messages: ChatMessage[], systemPrompt?: string, stream?: boolean) => any;
        responseTransformer?: (response: any) => ChatResponse;
        streamTransformer?: (chunk: any) => StreamChunk | null;
        headers?: Record<string, string>;
        pathTemplate?: string;
        method?: 'POST' | 'GET' | 'PUT';
        authHeaderName?: string;
        proxy?: {
            host: string;
            port: number;
            auth?: {
                username: string;
                password: string;
            };
        };
    };
}
export declare class CustomProvider extends BaseProvider {
    private customConfig;
    constructor(config: CustomProviderConfig);
    get name(): string;
    get capabilities(): ProviderCapabilities;
    authenticate(): Promise<boolean>;
    validateConfig(): boolean;
    checkHealth(): Promise<boolean>;
    sendMessage(messages: ChatMessage[], systemPrompt?: string): Promise<ChatResponse>;
    sendMessageStream(messages: ChatMessage[], onChunk: (chunk: StreamChunk) => void, systemPrompt?: string): Promise<void>;
    private buildHeaders;
    private defaultRequestTransform;
    private defaultResponseTransform;
    private defaultStreamTransform;
    setRequestTransformer(transformer: (messages: ChatMessage[], systemPrompt?: string) => any): void;
    setResponseTransformer(transformer: (response: any) => ChatResponse): void;
    setStreamTransformer(transformer: (chunk: any) => StreamChunk | null): void;
    addCustomHeader(name: string, value: string): void;
}
export declare function createCustomProvider(name: string, config: CustomProviderConfig): void;
export default CustomProvider;
