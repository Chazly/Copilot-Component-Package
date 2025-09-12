export interface ProviderCapabilities {
    supportsStreaming: boolean;
    maxContextLength: number;
    supportsFunctions: boolean;
    supportsEmbeddings: boolean;
    supportsBatching: boolean;
}
export interface ProviderConfig {
    modelProvider: string;
    model?: string;
    apiKey?: string;
    baseURL?: string;
    localConfig?: {
        endpoint?: string;
        port?: number;
        protocol?: 'http' | 'https';
        authentication?: {
            type: 'none' | 'bearer' | 'apikey' | 'oauth' | 'mtls';
            credentials?: any;
        };
        timeout?: number;
        retryAttempts?: number;
        healthCheck?: {
            enabled: boolean;
            interval: number;
            endpoint?: string;
        };
    };
    enterpriseConfig?: {
        loadBalancing?: 'round-robin' | 'least-connections' | 'health-based';
        failover?: {
            enabled: boolean;
            fallbackProviders: string[];
        };
        monitoring?: {
            metricsEndpoint?: string;
            alertingWebhook?: string;
        };
    };
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}
export interface ChatResponse {
    content: string;
    finishReason?: 'stop' | 'length' | 'error';
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata?: Record<string, any>;
}
export interface StreamChunk {
    content: string;
    isComplete: boolean;
    usage?: ChatResponse['usage'];
    raw?: any;
}
export declare abstract class BaseProvider {
    protected config: ProviderConfig;
    protected isAuthenticated: boolean;
    constructor(config: ProviderConfig);
    abstract get name(): string;
    abstract get capabilities(): ProviderCapabilities;
    abstract authenticate(): Promise<boolean>;
    abstract sendMessage(messages: ChatMessage[], systemPrompt?: string, tools?: any[]): Promise<ChatResponse>;
    abstract sendMessageStream(messages: ChatMessage[], onChunk: (chunk: StreamChunk) => void, systemPrompt?: string, tools?: any[]): Promise<void>;
    abstract validateConfig(): boolean;
    abstract checkHealth(): Promise<boolean>;
    protected makeRequest(endpoint: string, options: RequestInit): Promise<Response>;
    protected delay(ms: number): Promise<void>;
    protected buildEndpoint(path: string): string;
    protected getAuthHeaders(): Record<string, string>;
    private lastHealthCheck;
    private healthCheckInterval;
    private isHealthy;
    performHealthCheck(): Promise<boolean>;
    protected metrics: {
        requestCount: number;
        errorCount: number;
        totalLatency: number;
        averageLatency: number;
    };
    protected recordMetrics(latency: number, isError?: boolean): void;
    getMetrics(): {
        requestCount: number;
        errorCount: number;
        totalLatency: number;
        averageLatency: number;
    };
}
export interface ProviderRegistration {
    name: string;
    factory: (config: ProviderConfig) => BaseProvider;
    isAvailable: () => Promise<boolean>;
    defaultConfig?: Partial<ProviderConfig>;
}
export declare class ProviderRegistry {
    private static providers;
    static register(registration: ProviderRegistration): void;
    static getProvider(name: string): ProviderRegistration | undefined;
    static getAllProviders(): ProviderRegistration[];
    static discoverAvailableProviders(): Promise<string[]>;
}
export default BaseProvider;
