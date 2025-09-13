import { BaseProvider, ChatMessage, ChatResponse, StreamChunk } from '../services/BaseProvider';
import { NormalizedCopilotConfig } from '../types';
import '../services/OllamaProvider';
import '../services/CustomProvider';
import '../providers/openai';
export interface ProviderStatus {
    name: string;
    isAvailable: boolean;
    isHealthy: boolean;
    lastChecked: Date;
    error?: string;
    metrics?: {
        requestCount: number;
        errorCount: number;
        averageLatency: number;
    };
}
export interface ProviderFactoryState {
    currentProvider: BaseProvider | null;
    availableProviders: string[];
    providerStatuses: Record<string, ProviderStatus>;
    isLoading: boolean;
    error: string | null;
}
export declare function useModelProvider(config: NormalizedCopilotConfig): {
    initializeProviders: () => Promise<void>;
    switchProvider: (providerName: string) => Promise<boolean>;
    refreshProviderHealth: () => Promise<void>;
    sendMessage: (messages: ChatMessage[], systemPrompt?: string, tools?: any[], toolChoice?: any, debug?: boolean) => Promise<ChatResponse>;
    sendMessageStream: (messages: ChatMessage[], onChunk: (chunk: StreamChunk) => void, systemPrompt?: string, tools?: any[], toolChoice?: any, debug?: boolean) => Promise<void>;
    isReady: boolean;
    capabilities: import("../services/BaseProvider").ProviderCapabilities | undefined;
    metrics: {
        requestCount: number;
        errorCount: number;
        totalLatency: number;
        averageLatency: number;
    } | undefined;
    currentProvider: BaseProvider | null;
    availableProviders: string[];
    providerStatuses: Record<string, ProviderStatus>;
    isLoading: boolean;
    error: string | null;
};
export default useModelProvider;
