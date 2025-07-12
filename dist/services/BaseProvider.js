export class BaseProvider {
    constructor(config) {
        this.isAuthenticated = false;
        // Health check with circuit breaker pattern
        this.lastHealthCheck = 0;
        this.healthCheckInterval = 30000; // 30 seconds
        this.isHealthy = true;
        // Provider metrics
        this.metrics = {
            requestCount: 0,
            errorCount: 0,
            totalLatency: 0,
            averageLatency: 0
        };
        this.config = config;
    }
    // Common utility methods
    async makeRequest(endpoint, options) {
        var _a, _b;
        const timeout = ((_a = this.config.localConfig) === null || _a === void 0 ? void 0 : _a.timeout) || 30000;
        const retryAttempts = ((_b = this.config.localConfig) === null || _b === void 0 ? void 0 : _b.retryAttempts) || 3;
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const response = await fetch(endpoint, Object.assign(Object.assign({}, options), { signal: controller.signal }));
                clearTimeout(timeoutId);
                if (response.ok) {
                    return response;
                }
                if (attempt === retryAttempts) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                // Exponential backoff
                await this.delay(Math.pow(2, attempt) * 1000);
            }
            catch (error) {
                if (attempt === retryAttempts) {
                    throw error;
                }
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
        throw new Error('Max retry attempts exceeded');
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    buildEndpoint(path) {
        var _a, _b, _c;
        const baseURL = this.config.baseURL || ((_a = this.config.localConfig) === null || _a === void 0 ? void 0 : _a.endpoint) || 'localhost';
        const port = (_b = this.config.localConfig) === null || _b === void 0 ? void 0 : _b.port;
        let url;
        // Check if baseURL already contains a protocol (like https://api.openai.com)
        if (baseURL.includes('://')) {
            // baseURL is a full URL with protocol
            url = baseURL;
        }
        else {
            // baseURL is just a hostname, add protocol
            const protocol = ((_c = this.config.localConfig) === null || _c === void 0 ? void 0 : _c.protocol) || 'http';
            url = `${protocol}://${baseURL}`;
            // Add port only for hostname-only baseURLs
            if (port) {
                url += `:${port}`;
            }
        }
        url += path;
        return url;
    }
    getAuthHeaders() {
        var _a;
        const headers = {
            'Content-Type': 'application/json'
        };
        const authConfig = (_a = this.config.localConfig) === null || _a === void 0 ? void 0 : _a.authentication;
        if ((authConfig === null || authConfig === void 0 ? void 0 : authConfig.type) === 'bearer' && authConfig.credentials) {
            headers['Authorization'] = `Bearer ${authConfig.credentials}`;
        }
        else if ((authConfig === null || authConfig === void 0 ? void 0 : authConfig.type) === 'apikey' && this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        else if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        return headers;
    }
    async performHealthCheck() {
        var _a, _b;
        const now = Date.now();
        const interval = ((_b = (_a = this.config.localConfig) === null || _a === void 0 ? void 0 : _a.healthCheck) === null || _b === void 0 ? void 0 : _b.interval) || this.healthCheckInterval;
        if (now - this.lastHealthCheck < interval) {
            return this.isHealthy;
        }
        try {
            this.isHealthy = await this.checkHealth();
            this.lastHealthCheck = now;
            return this.isHealthy;
        }
        catch (error) {
            this.isHealthy = false;
            this.lastHealthCheck = now;
            return false;
        }
    }
    recordMetrics(latency, isError = false) {
        this.metrics.requestCount++;
        this.metrics.totalLatency += latency;
        this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.requestCount;
        if (isError) {
            this.metrics.errorCount++;
        }
    }
    getMetrics() {
        return Object.assign({}, this.metrics);
    }
}
export class ProviderRegistry {
    static register(registration) {
        this.providers.set(registration.name, registration);
    }
    static getProvider(name) {
        return this.providers.get(name);
    }
    static getAllProviders() {
        return Array.from(this.providers.values());
    }
    static async discoverAvailableProviders() {
        const available = [];
        const entries = Array.from(this.providers.entries());
        for (let i = 0; i < entries.length; i++) {
            const [name, registration] = entries[i];
            try {
                if (await registration.isAvailable()) {
                    available.push(name);
                }
            }
            catch (error) {
                // Provider not available, skip
            }
        }
        return available;
    }
}
ProviderRegistry.providers = new Map();
export default BaseProvider;
