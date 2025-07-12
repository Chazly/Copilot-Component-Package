import { CustomProvider } from '../services/CustomProvider';
import { ProviderRegistry } from '../services/BaseProvider';
// OpenAI model configurations
export const OPENAI_MODELS = {
    'gpt-4o-latest': { name: 'gpt-4o-latest', contextWindow: 128000, description: 'Latest GPT-4 Omni model' },
    'gpt-4o-mini': { name: 'gpt-4o-mini', contextWindow: 128000, description: 'Lightweight GPT-4 Omni model' },
    'gpt-4-turbo': { name: 'gpt-4-turbo', contextWindow: 128000, description: 'GPT-4 Turbo model' },
    'gpt-4': { name: 'gpt-4', contextWindow: 8192, description: 'GPT-4 base model' },
    'gpt-3.5-turbo': { name: 'gpt-3.5-turbo', contextWindow: 16384, description: 'GPT-3.5 Turbo model' },
    'o1-preview': { name: 'o1-preview', contextWindow: 128000, description: 'O1 reasoning model preview' },
    'o1-mini': { name: 'o1-mini', contextWindow: 128000, description: 'O1 mini reasoning model' }
};
// Helper function to create OpenAI configurations
export const createOpenAIConfig = (options = {}) => {
    const getEnvVar = (key) => {
        var _a, _b, _c, _d, _e, _f;
        if (typeof window !== 'undefined') {
            // Browser environment - try both Vite and Next.js patterns
            const viteKey = `VITE_${key}`;
            const nextKey = `NEXT_PUBLIC_${key}`;
            return ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a[viteKey]) ||
                ((_c = (_b = window.process) === null || _b === void 0 ? void 0 : _b.env) === null || _c === void 0 ? void 0 : _c[nextKey]) ||
                ((_e = (_d = window.process) === null || _d === void 0 ? void 0 : _d.env) === null || _e === void 0 ? void 0 : _e[key]) ||
                ((_f = import.meta.env) === null || _f === void 0 ? void 0 : _f[key]);
        }
        return process.env[key];
    };
    return {
        modelProvider: 'openai',
        model: options.model || getEnvVar('OPENAI_DEFAULT_MODEL') || getEnvVar('VITE_OPENAI_DEFAULT_MODEL') || 'gpt-4o-latest',
        apiKey: options.apiKey || getEnvVar('OPENAI_API_KEY') || getEnvVar('VITE_OPENAI_API_KEY'),
        baseURL: options.baseURL || 'https://api.openai.com',
        customConfig: {
            pathTemplate: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            requestTransformer: (messages, systemPrompt, stream = false) => {
                const systemMessage = systemPrompt ? [{ role: 'system', content: systemPrompt }] : [];
                return {
                    model: options.model || getEnvVar('OPENAI_DEFAULT_MODEL') || getEnvVar('VITE_OPENAI_DEFAULT_MODEL') || 'gpt-4o-latest',
                    messages: [...systemMessage, ...messages],
                    stream,
                    temperature: options.temperature || 0.7,
                    max_tokens: options.maxTokens || 2000
                };
            },
            responseTransformer: (response) => {
                var _a, _b, _c;
                if ((_c = (_b = (_a = response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) {
                    return {
                        content: response.choices[0].message.content,
                        finishReason: response.choices[0].finish_reason,
                        usage: response.usage
                    };
                }
                throw new Error('Invalid OpenAI response format');
            },
            streamTransformer: (data) => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                if ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.delta) === null || _c === void 0 ? void 0 : _c.content) {
                    return {
                        content: data.choices[0].delta.content,
                        isComplete: data.choices[0].finish_reason !== null && data.choices[0].finish_reason !== undefined
                    };
                }
                if ((_f = (_e = (_d = data.choices) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.content) {
                    return {
                        content: data.choices[0].message.content,
                        isComplete: true
                    };
                }
                if ((_h = (_g = data.choices) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.finish_reason) {
                    return {
                        content: '',
                        isComplete: true
                    };
                }
                return null;
            }
        }
    };
};
// Register OpenAI provider
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
    const getEnvVar = (key) => {
        var _a, _b, _c, _d, _e, _f;
        if (typeof window !== 'undefined') {
            // Browser environment - try both Vite and Next.js patterns
            const viteKey = `VITE_${key}`;
            const nextKey = `NEXT_PUBLIC_${key}`;
            return ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a[viteKey]) ||
                ((_c = (_b = window.process) === null || _b === void 0 ? void 0 : _b.env) === null || _c === void 0 ? void 0 : _c[nextKey]) ||
                ((_e = (_d = window.process) === null || _d === void 0 ? void 0 : _d.env) === null || _e === void 0 ? void 0 : _e[key]) ||
                ((_f = import.meta.env) === null || _f === void 0 ? void 0 : _f[key]);
        }
        return process.env[key];
    };
    ProviderRegistry.register({
        name: 'openai',
        factory: (config) => {
            return new CustomProvider(Object.assign(Object.assign({}, config), { customConfig: {
                    pathTemplate: '/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    requestTransformer: (messages, systemPrompt, stream = false) => {
                        const systemMessage = systemPrompt ? [{ role: 'system', content: systemPrompt }] : [];
                        return {
                            model: config.model || getEnvVar('OPENAI_DEFAULT_MODEL') || getEnvVar('VITE_OPENAI_DEFAULT_MODEL') || 'gpt-4o-latest',
                            messages: [...systemMessage, ...messages],
                            stream,
                            temperature: 0.7,
                            max_tokens: 2000
                        };
                    },
                    responseTransformer: (response) => {
                        var _a, _b, _c;
                        if ((_c = (_b = (_a = response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) {
                            return {
                                content: response.choices[0].message.content,
                                finishReason: response.choices[0].finish_reason,
                                usage: response.usage
                            };
                        }
                        throw new Error('Invalid OpenAI response format');
                    },
                    streamTransformer: (data) => {
                        var _a, _b, _c, _d, _e, _f, _g, _h;
                        // Handle streaming format (delta) - this is correct for streaming
                        if ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.delta) === null || _c === void 0 ? void 0 : _c.content) {
                            const result = {
                                content: data.choices[0].delta.content,
                                isComplete: data.choices[0].finish_reason !== null && data.choices[0].finish_reason !== undefined
                            };
                            return result;
                        }
                        // Handle complete response format (message) - fallback for non-streaming
                        if ((_f = (_e = (_d = data.choices) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.content) {
                            const result = {
                                content: data.choices[0].message.content,
                                isComplete: true
                            };
                            return result;
                        }
                        // Handle completion signals  
                        if ((_h = (_g = data.choices) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.finish_reason) {
                            const result = {
                                content: '',
                                isComplete: true
                            };
                            return result;
                        }
                        return null;
                    }
                } }));
        },
        isAvailable: async () => {
            return !!(getEnvVar('OPENAI_API_KEY') || getEnvVar('VITE_OPENAI_API_KEY'));
        },
        defaultConfig: {
            baseURL: 'https://api.openai.com',
            apiKey: getEnvVar('OPENAI_API_KEY') || getEnvVar('VITE_OPENAI_API_KEY'),
            model: getEnvVar('OPENAI_DEFAULT_MODEL') || getEnvVar('VITE_OPENAI_DEFAULT_MODEL') || 'gpt-4o-latest'
        }
    });
}
