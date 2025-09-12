export declare const OPENAI_MODELS: {
    readonly 'gpt-4o-latest': {
        readonly name: "gpt-4o-latest";
        readonly contextWindow: 128000;
        readonly description: "Latest GPT-4 Omni model";
    };
    readonly 'gpt-4o-mini': {
        readonly name: "gpt-4o-mini";
        readonly contextWindow: 128000;
        readonly description: "Lightweight GPT-4 Omni model";
    };
    readonly 'gpt-4-turbo': {
        readonly name: "gpt-4-turbo";
        readonly contextWindow: 128000;
        readonly description: "GPT-4 Turbo model";
    };
    readonly 'gpt-4': {
        readonly name: "gpt-4";
        readonly contextWindow: 8192;
        readonly description: "GPT-4 base model";
    };
    readonly 'gpt-3.5-turbo': {
        readonly name: "gpt-3.5-turbo";
        readonly contextWindow: 16384;
        readonly description: "GPT-3.5 Turbo model";
    };
    readonly 'o1-preview': {
        readonly name: "o1-preview";
        readonly contextWindow: 128000;
        readonly description: "O1 reasoning model preview";
    };
    readonly 'o1-mini': {
        readonly name: "o1-mini";
        readonly contextWindow: 128000;
        readonly description: "O1 mini reasoning model";
    };
};
export declare const createOpenAIConfig: (options?: {
    model?: string;
    apiKey?: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
}) => {
    modelProvider: string;
    model: string;
    apiKey: string | undefined;
    baseURL: string;
    customConfig: {
        pathTemplate: string;
        method: string;
        headers: {
            'Content-Type': string;
        };
        requestTransformer: (messages: any[], systemPrompt?: string, stream?: boolean, tools?: any[], toolChoice?: any, _debug?: boolean) => any;
        responseTransformer: (response: any) => {
            content: any;
            finishReason: any;
            usage: any;
            metadata: {
                toolCalls: any;
            } | undefined;
        };
        streamTransformer: (data: any) => {
            content: any;
            isComplete: boolean;
            raw?: undefined;
        } | {
            content: string;
            isComplete: boolean;
            raw: any;
        } | null;
    };
};
