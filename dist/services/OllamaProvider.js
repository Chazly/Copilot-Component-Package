import { BaseProvider, ProviderRegistry } from './BaseProvider';
export class OllamaProvider extends BaseProvider {
    constructor(config) {
        var _a;
        super(config);
        this.availableModels = [];
        this.currentModel = config.model || 'llama2';
        // Set default Ollama configuration
        if (!((_a = config.localConfig) === null || _a === void 0 ? void 0 : _a.endpoint)) {
            config.localConfig = Object.assign(Object.assign({}, config.localConfig), { endpoint: 'localhost', port: 11434, protocol: 'http' });
        }
    }
    get name() {
        return 'ollama';
    }
    get capabilities() {
        return {
            supportsStreaming: true,
            maxContextLength: 4096, // Varies by model
            supportsFunctions: false,
            supportsEmbeddings: true,
            supportsBatching: false
        };
    }
    async authenticate() {
        try {
            const isHealthy = await this.checkHealth();
            if (isHealthy) {
                await this.loadAvailableModels();
                this.isAuthenticated = true;
            }
            return isHealthy;
        }
        catch (error) {
            this.isAuthenticated = false;
            return false;
        }
    }
    validateConfig() {
        var _a;
        return !!(((_a = this.config.localConfig) === null || _a === void 0 ? void 0 : _a.endpoint) || this.config.baseURL);
    }
    async checkHealth() {
        try {
            const endpoint = this.buildEndpoint('/api/tags');
            const response = await this.makeRequest(endpoint, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    async loadAvailableModels() {
        try {
            const endpoint = this.buildEndpoint('/api/tags');
            const response = await this.makeRequest(endpoint, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            this.availableModels = data.models || [];
            return this.availableModels;
        }
        catch (error) {
            console.error('Failed to load Ollama models:', error);
            return [];
        }
    }
    async pullModel(modelName) {
        try {
            const endpoint = this.buildEndpoint('/api/pull');
            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ name: modelName })
            });
            return response.ok;
        }
        catch (error) {
            console.error('Failed to pull model:', error);
            return false;
        }
    }
    async sendMessage(messages, systemPrompt, tools) {
        const startTime = Date.now();
        try {
            const endpoint = this.buildEndpoint('/api/generate');
            // Convert messages to Ollama format
            const prompt = this.formatMessagesForOllama(messages, systemPrompt);
            const requestBody = {
                model: this.currentModel,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7
                }
            };
            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            const latency = Date.now() - startTime;
            this.recordMetrics(latency, false);
            return {
                content: data.response,
                finishReason: data.done ? 'stop' : 'length',
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                },
                metadata: {
                    model: data.model,
                    totalDuration: data.total_duration,
                    loadDuration: data.load_duration
                }
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordMetrics(latency, true);
            throw new Error(`Ollama request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async sendMessageStream(messages, onChunk, systemPrompt, tools) {
        const startTime = Date.now();
        try {
            const endpoint = this.buildEndpoint('/api/generate');
            const prompt = this.formatMessagesForOllama(messages, systemPrompt);
            const requestBody = {
                model: this.currentModel,
                prompt: prompt,
                stream: true,
                options: {
                    temperature: 0.7
                }
            };
            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(requestBody)
            });
            if (!response.body) {
                throw new Error('No response body for streaming');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            onChunk({
                                content: data.response,
                                isComplete: data.done,
                                usage: data.done ? {
                                    promptTokens: data.prompt_eval_count || 0,
                                    completionTokens: data.eval_count || 0,
                                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                                } : undefined
                            });
                            if (data.done) {
                                const latency = Date.now() - startTime;
                                this.recordMetrics(latency, false);
                                return;
                            }
                        }
                        catch (parseError) {
                            // Skip invalid JSON lines
                            continue;
                        }
                    }
                }
            }
            finally {
                reader.releaseLock();
            }
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordMetrics(latency, true);
            throw new Error(`Ollama streaming failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    formatMessagesForOllama(messages, systemPrompt) {
        let prompt = '';
        if (systemPrompt) {
            prompt += `System: ${systemPrompt}\n\n`;
        }
        for (const message of messages) {
            if (message.role === 'user') {
                prompt += `Human: ${message.content}\n\n`;
            }
            else if (message.role === 'assistant') {
                prompt += `Assistant: ${message.content}\n\n`;
            }
        }
        prompt += 'Assistant: ';
        return prompt;
    }
    // Ollama-specific methods
    async switchModel(modelName) {
        if (!this.availableModels.some(m => m.name === modelName)) {
            // Try to pull the model if it's not available
            const pulled = await this.pullModel(modelName);
            if (!pulled) {
                return false;
            }
            await this.loadAvailableModels();
        }
        this.currentModel = modelName;
        return true;
    }
    getAvailableModels() {
        return this.availableModels;
    }
    getCurrentModel() {
        return this.currentModel;
    }
}
// Register Ollama provider
ProviderRegistry.register({
    name: 'ollama',
    factory: (config) => new OllamaProvider(config),
    isAvailable: async () => {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        }
        catch (_a) {
            return false;
        }
    },
    defaultConfig: {
        localConfig: {
            endpoint: 'localhost',
            port: 11434,
            protocol: 'http',
            timeout: 60000, // Ollama can be slow for large models
            retryAttempts: 2
        }
    }
});
export default OllamaProvider;
