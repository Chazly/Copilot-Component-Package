import { BaseProvider, ProviderRegistry } from './BaseProvider';
import { ProviderHttpError } from './errors';
export class CustomProvider extends BaseProvider {
    constructor(config) {
        super(config);
        // Set default custom configuration
        this.customConfig = Object.assign({ pathTemplate: '/v1/chat/completions', method: 'POST', authHeaderName: 'Authorization', headers: {} }, config.customConfig);
    }
    get name() {
        return `custom:${this.config.modelProvider.replace('custom:', '')}`;
    }
    get capabilities() {
        return {
            supportsStreaming: true, // Assume streaming unless configured otherwise
            maxContextLength: 8192, // Default, should be configured per provider
            supportsFunctions: false,
            supportsEmbeddings: false,
            supportsBatching: false
        };
    }
    async authenticate() {
        try {
            // For custom providers, authentication is validated by making a test request
            const isHealthy = await this.checkHealth();
            this.isAuthenticated = isHealthy;
            return isHealthy;
        }
        catch (error) {
            this.isAuthenticated = false;
            return false;
        }
    }
    validateConfig() {
        var _a;
        const hasEndpoint = !!(this.config.baseURL || ((_a = this.config.localConfig) === null || _a === void 0 ? void 0 : _a.endpoint));
        const hasPath = !!this.customConfig.pathTemplate;
        return hasEndpoint && hasPath;
    }
    async checkHealth() {
        var _a, _b, _c;
        try {
            // Skip health check for OpenAI (api.openai.com doesn't have /health endpoint)
            if ((_a = this.config.baseURL) === null || _a === void 0 ? void 0 : _a.includes('api.openai.com')) {
                return true; // Assume healthy if we can reach this point
            }
            // Use custom health check endpoint if provided
            const healthPath = ((_c = (_b = this.config.localConfig) === null || _b === void 0 ? void 0 : _b.healthCheck) === null || _c === void 0 ? void 0 : _c.endpoint) || '/health';
            const endpoint = this.buildEndpoint(healthPath);
            const response = await this.makeRequest(endpoint, {
                method: 'GET',
                headers: this.buildHeaders()
            });
            return response.status >= 200 && response.status < 300;
        }
        catch (error) {
            // If health endpoint fails, try the main endpoint with minimal request
            try {
                const mainEndpoint = this.buildEndpoint(this.customConfig.pathTemplate);
                const response = await this.makeRequest(mainEndpoint, {
                    method: 'OPTIONS', // Non-intrusive method
                    headers: this.buildHeaders()
                });
                return response.status !== 404; // If it's not 404, the endpoint exists
            }
            catch (_d) {
                return false;
            }
        }
    }
    async sendMessage(messages, systemPrompt, tools, toolChoice, debug) {
        var _a, _b, _c, _d, _e, _f;
        const startTime = Date.now();
        try {
            const endpoint = this.buildEndpoint(this.customConfig.pathTemplate);
            try {
                (_b = (_a = console).debug) === null || _b === void 0 ? void 0 : _b.call(_a, '[obs]', { event: 'model_request', endpoint, model: this.config.model, path: this.customConfig.pathTemplate });
            }
            catch (_g) { }
            // Transform the request using custom transformer or default
            const requestBody = this.customConfig.requestTransformer
                ? this.customConfig.requestTransformer(messages, systemPrompt, false, tools, toolChoice, debug)
                : this.defaultRequestTransform(messages, systemPrompt, false, tools, toolChoice);
            const response = await this.makeRequest(endpoint, {
                method: this.customConfig.method || 'POST',
                headers: this.buildHeaders(),
                body: JSON.stringify(requestBody)
            });
            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            }
            catch (_h) {
                data = text;
            }
            if (!response.ok && response.status >= 400 && response.status < 500) {
                try {
                    (_d = (_c = console).error) === null || _d === void 0 ? void 0 : _d.call(_c, '[obs]', { event: 'model_error', status: response.status, endpoint, model: this.config.model });
                }
                catch (_j) { }
                throw new ProviderHttpError(`Upstream 4xx from provider`, { status: response.status, endpoint, model: this.config.model, body: data, pathType: ((_e = this.customConfig.pathTemplate) === null || _e === void 0 ? void 0 : _e.includes('responses')) ? 'responses' : (((_f = this.customConfig.pathTemplate) === null || _f === void 0 ? void 0 : _f.includes('chat')) ? 'chat' : 'other') });
            }
            // Transform the response using custom transformer or default
            const chatResponse = this.customConfig.responseTransformer
                ? this.customConfig.responseTransformer(data)
                : this.defaultResponseTransform(data);
            const latency = Date.now() - startTime;
            this.recordMetrics(latency, false);
            return chatResponse;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordMetrics(latency, true);
            throw error instanceof Error ? error : new Error(`Custom provider request failed: ${String(error)}`);
        }
    }
    async sendMessageStream(messages, onChunk, systemPrompt, tools, toolChoice, debug) {
        var _a, _b;
        const startTime = Date.now();
        try {
            const endpoint = this.buildEndpoint(this.customConfig.pathTemplate);
            try {
                (_b = (_a = console).debug) === null || _b === void 0 ? void 0 : _b.call(_a, '[obs]', { event: 'model_request', endpoint, model: this.config.model, path: this.customConfig.pathTemplate, stream: true });
            }
            catch (_c) { }
            const requestBody = this.customConfig.requestTransformer
                ? this.customConfig.requestTransformer(messages, systemPrompt, true, tools, toolChoice, debug)
                : this.defaultRequestTransform(messages, systemPrompt, true, tools, toolChoice);
            const response = await this.makeRequest(endpoint, {
                method: this.customConfig.method || 'POST',
                headers: this.buildHeaders(),
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
                            // Handle Server-Sent Events format
                            const dataLine = line.startsWith('data: ') ? line.slice(6) : line;
                            if (dataLine.trim() === '[DONE]') {
                                const latency = Date.now() - startTime;
                                this.recordMetrics(latency, false);
                                return;
                            }
                            const data = JSON.parse(dataLine);
                            // Transform chunk using custom transformer or default
                            const streamChunk = this.customConfig.streamTransformer
                                ? this.customConfig.streamTransformer(data)
                                : this.defaultStreamTransform(data);
                            if (streamChunk) {
                                onChunk(streamChunk);
                                if (streamChunk.isComplete) {
                                    const latency = Date.now() - startTime;
                                    this.recordMetrics(latency, false);
                                    return;
                                }
                            }
                        }
                        catch (parseError) {
                            // Continue processing other lines if one fails to parse
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
            throw error instanceof Error ? error : new Error(`Custom provider streaming failed: ${String(error)}`);
        }
    }
    buildHeaders() {
        const headers = Object.assign(Object.assign({ 'Content-Type': 'application/json' }, this.getAuthHeaders()), this.customConfig.headers);
        // Handle custom authentication header name
        if (this.customConfig.authHeaderName && this.config.apiKey) {
            delete headers['Authorization'];
            // Properly format the Bearer token
            const authValue = this.config.apiKey.startsWith('Bearer ')
                ? this.config.apiKey
                : `Bearer ${this.config.apiKey}`;
            headers[this.customConfig.authHeaderName] = authValue;
        }
        return headers;
    }
    // Default transformers for common API formats
    defaultRequestTransform(messages, systemPrompt, stream = false, tools, toolChoice) {
        const requestMessages = [];
        if (systemPrompt) {
            requestMessages.push({
                role: 'system',
                content: systemPrompt
            });
        }
        requestMessages.push(...messages.map(msg => ({
            role: msg.role,
            content: msg.content
        })));
        const payload = {
            model: this.config.model || 'default',
            messages: requestMessages,
            stream: stream,
            temperature: 0.7,
            max_tokens: 2048,
            tools: tools && tools.length ? tools : undefined
        };
        if (toolChoice)
            payload.tool_choice = toolChoice;
        return payload;
    }
    defaultResponseTransform(data) {
        var _a;
        // Handle OpenAI-compatible format
        if (data.choices && data.choices[0]) {
            const choice = data.choices[0];
            return {
                content: ((_a = choice.message) === null || _a === void 0 ? void 0 : _a.content) || choice.text || '',
                finishReason: choice.finish_reason || 'stop',
                usage: data.usage || undefined
            };
        }
        // Handle simple response format
        if (typeof data.response === 'string') {
            return {
                content: data.response,
                finishReason: 'stop'
            };
        }
        // Fallback
        return {
            content: String(data),
            finishReason: 'stop'
        };
    }
    defaultStreamTransform(data) {
        // Handle OpenAI-compatible streaming format
        if (data.choices && data.choices[0]) {
            const choice = data.choices[0];
            const delta = choice.delta || choice.message || {};
            return {
                content: delta.content || '',
                isComplete: choice.finish_reason !== null && choice.finish_reason !== undefined,
                usage: data.usage || undefined
            };
        }
        // Handle simple streaming format
        if (typeof data.response === 'string') {
            return {
                content: data.response,
                isComplete: data.done || false
            };
        }
        return null;
    }
    // Configuration helpers
    setRequestTransformer(transformer) {
        this.customConfig.requestTransformer = transformer;
    }
    setResponseTransformer(transformer) {
        this.customConfig.responseTransformer = transformer;
    }
    setStreamTransformer(transformer) {
        this.customConfig.streamTransformer = transformer;
    }
    addCustomHeader(name, value) {
        this.customConfig.headers = this.customConfig.headers || {};
        this.customConfig.headers[name] = value;
    }
}
// Factory function for easy custom provider creation
export function createCustomProvider(name, config) {
    ProviderRegistry.register({
        name: `custom:${name}`,
        factory: (providerConfig) => new CustomProvider(Object.assign(Object.assign({}, providerConfig), config)),
        isAvailable: async () => {
            try {
                const provider = new CustomProvider(config);
                return await provider.checkHealth();
            }
            catch (_a) {
                return false;
            }
        },
        defaultConfig: config
    });
}
// Register the base custom provider
ProviderRegistry.register({
    name: 'custom',
    factory: (config) => new CustomProvider(config),
    isAvailable: async () => true, // Always available, validation happens at runtime
    defaultConfig: {
        customConfig: {
            pathTemplate: '/v1/chat/completions',
            method: 'POST',
            authHeaderName: 'Authorization'
        }
    }
});
export default CustomProvider;
