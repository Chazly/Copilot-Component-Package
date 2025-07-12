import { Message, NormalizedCopilotConfig } from '../types';
export declare function useCopilotChat(config: NormalizedCopilotConfig, onSendMessage?: (message: string) => Promise<string> | string): {
    messages: Message[];
    input: string;
    setInput: import("react").Dispatch<import("react").SetStateAction<string>>;
    sendMsg: () => Promise<void>;
    sendMsgStream: () => Promise<void>;
    isLoading: boolean;
    providerStatus: {
        isReady: boolean;
        currentProvider: string | undefined;
        availableProviders: string[];
        error: string | null;
        metrics: {
            requestCount: number;
            errorCount: number;
            totalLatency: number;
            averageLatency: number;
        } | undefined;
    } | null;
    switchProvider: ((providerName: string) => Promise<boolean>) | undefined;
    refreshProvider: (() => Promise<void>) | undefined;
};
export declare function useLegacyCopilotChat(initialMessage: string, onSendMessage?: (message: string) => Promise<string> | string): {
    messages: Message[];
    input: string;
    setInput: import("react").Dispatch<import("react").SetStateAction<string>>;
    sendMsg: () => Promise<void>;
    isLoading: boolean;
};
export default useCopilotChat;
