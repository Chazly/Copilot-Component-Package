import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProviderRegistry } from '../services/BaseProvider';
import { getApiKeyWithConfig } from '../lib/env';
// Import and register providers
import '../services/OllamaProvider';
import '../services/CustomProvider';
// Convert copilot config to provider config
function configToProviderConfig(config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const providerConfig = {
        modelProvider: config.modelProvider,
        model: config.model,
        apiKey: undefined, // Will be set based on provider type
        baseURL: undefined // Will be set based on provider type
    };
    // Handle provider-specific configurations
    if (config.modelProvider === 'openai') {
        // OpenAI configuration - use unified environment detection that checks config first
        try {
            const envConfig = (_a = config.metadata) === null || _a === void 0 ? void 0 : _a.environmentConfig;
            providerConfig.apiKey = getApiKeyWithConfig(envConfig);
        }
        catch (error) {
            console.error('Failed to get OpenAI API key:', error);
            providerConfig.apiKey = undefined;
        }
        providerConfig.baseURL = 'https://api.openai.com';
        // Only enable fallback for OpenAI if explicitly configured
        if (config.performance && ((_c = (_b = config.integrations) === null || _b === void 0 ? void 0 : _b.contextProviders) === null || _c === void 0 ? void 0 : _c['ai-endpoint'])) {
            providerConfig.enterpriseConfig = {
                loadBalancing: 'health-based',
                failover: {
                    enabled: true,
                    fallbackProviders: ['ollama'] // Only if custom endpoint is configured
                },
                monitoring: {
                    metricsEndpoint: (_e = (_d = config.integrations) === null || _d === void 0 ? void 0 : _d.webhooks) === null || _e === void 0 ? void 0 : _e.onMessageSent
                }
            };
        }
    }
    else if (config.modelProvider === 'ollama') {
        // Ollama configuration
        providerConfig.localConfig = {
            endpoint: 'localhost',
            port: 11434,
            protocol: 'http',
            timeout: 60000,
            retryAttempts: 2
        };
    }
    else if (config.modelProvider.startsWith('custom:')) {
        // Custom provider configuration
        providerConfig.localConfig = {
            endpoint: ((_h = (_g = (_f = config.integrations) === null || _f === void 0 ? void 0 : _f.contextProviders) === null || _g === void 0 ? void 0 : _g['ai-endpoint']) === null || _h === void 0 ? void 0 : _h.apiEndpoint) || 'localhost',
            protocol: 'https',
            timeout: 30000,
            retryAttempts: 3,
            authentication: {
                type: ((_l = (_k = (_j = config.integrations) === null || _j === void 0 ? void 0 : _j.contextProviders) === null || _k === void 0 ? void 0 : _k['ai-endpoint']) === null || _l === void 0 ? void 0 : _l.authMethod) || 'none'
            }
        };
        // Enable enterprise config for custom providers with fallback
        if (config.performance) {
            providerConfig.enterpriseConfig = {
                loadBalancing: 'health-based',
                failover: {
                    enabled: true,
                    fallbackProviders: ['ollama']
                },
                monitoring: {
                    metricsEndpoint: (_o = (_m = config.integrations) === null || _m === void 0 ? void 0 : _m.webhooks) === null || _o === void 0 ? void 0 : _o.onMessageSent
                }
            };
        }
    }
    return providerConfig;
}
export function useModelProvider(config) {
    var _a, _b;
    const [state, setState] = useState({
        currentProvider: null,
        availableProviders: [],
        providerStatuses: {},
        isLoading: true,
        error: null
    });
    // Memoize provider config to avoid unnecessary recreations
    const providerConfig = useMemo(() => configToProviderConfig(config), [config]);
    // Initialize providers and check availability
    const initializeProviders = useCallback(async () => {
        setState(prev => (Object.assign(Object.assign({}, prev), { isLoading: true, error: null })));
        try {
            // Discover available providers
            const available = await ProviderRegistry.discoverAvailableProviders();
            // Update provider statuses
            const statuses = {};
            const registrations = ProviderRegistry.getAllProviders();
            for (const registration of registrations) {
                const isAvailable = available.indexOf(registration.name) !== -1;
                statuses[registration.name] = {
                    name: registration.name,
                    isAvailable,
                    isHealthy: false,
                    lastChecked: new Date(),
                    error: isAvailable ? undefined : 'Provider not available'
                };
            }
            setState(prev => (Object.assign(Object.assign({}, prev), { availableProviders: available, providerStatuses: statuses, isLoading: false })));
            // Try to create the requested provider
            await createProvider(config.modelProvider);
        }
        catch (error) {
            setState(prev => (Object.assign(Object.assign({}, prev), { isLoading: false, error: error instanceof Error ? error.message : String(error) })));
        }
    }, [config.modelProvider]);
    // Create a specific provider instance
    const createProvider = useCallback(async (providerName) => {
        var _a, _b;
        try {
            const registration = ProviderRegistry.getProvider(providerName);
            if (!registration) {
                throw new Error(`Unknown provider: ${providerName}`);
            }
            // Create provider instance
            const provider = registration.factory(providerConfig);
            // Validate configuration
            if (!provider.validateConfig()) {
                throw new Error(`Invalid configuration for provider: ${providerName}`);
            }
            // Authenticate and health check
            const isAuthenticated = await provider.authenticate();
            if (!isAuthenticated) {
                throw new Error(`Authentication failed for provider: ${providerName}`);
            }
            const isHealthy = await provider.performHealthCheck();
            // Update provider status
            setState(prev => (Object.assign(Object.assign({}, prev), { currentProvider: provider, providerStatuses: Object.assign(Object.assign({}, prev.providerStatuses), { [providerName]: Object.assign(Object.assign({}, prev.providerStatuses[providerName]), { isHealthy, lastChecked: new Date(), error: isHealthy ? undefined : 'Health check failed', metrics: provider.getMetrics() }) }), error: null })));
            return provider;
        }
        catch (error) {
            // Update status with error
            setState(prev => (Object.assign(Object.assign({}, prev), { providerStatuses: Object.assign(Object.assign({}, prev.providerStatuses), { [providerName]: Object.assign(Object.assign({}, prev.providerStatuses[providerName]), { isHealthy: false, lastChecked: new Date(), error: error instanceof Error ? error.message : String(error) }) }), error: error instanceof Error ? error.message : String(error) })));
            // Try fallback providers
            if ((_b = (_a = providerConfig.enterpriseConfig) === null || _a === void 0 ? void 0 : _a.failover) === null || _b === void 0 ? void 0 : _b.enabled) {
                const fallbackProviders = providerConfig.enterpriseConfig.failover.fallbackProviders;
                for (const fallbackName of fallbackProviders) {
                    if (fallbackName !== providerName) {
                        console.warn(`Trying fallback provider: ${fallbackName}`);
                        const fallbackProvider = await createProvider(fallbackName);
                        if (fallbackProvider) {
                            return fallbackProvider;
                        }
                    }
                }
            }
            return null;
        }
    }, [providerConfig]);
    // Switch to a different provider
    const switchProvider = useCallback(async (providerName) => {
        setState(prev => (Object.assign(Object.assign({}, prev), { isLoading: true })));
        const provider = await createProvider(providerName);
        setState(prev => (Object.assign(Object.assign({}, prev), { isLoading: false })));
        return provider !== null;
    }, [createProvider]);
    // Refresh provider health status
    const refreshProviderHealth = useCallback(async () => {
        var _a, _b;
        if (!state.currentProvider)
            return;
        try {
            const isHealthy = await state.currentProvider.performHealthCheck();
            const providerName = state.currentProvider.name;
            setState(prev => {
                var _a;
                return (Object.assign(Object.assign({}, prev), { providerStatuses: Object.assign(Object.assign({}, prev.providerStatuses), { [providerName]: Object.assign(Object.assign({}, prev.providerStatuses[providerName]), { isHealthy, lastChecked: new Date(), error: isHealthy ? undefined : 'Health check failed', metrics: (_a = state.currentProvider) === null || _a === void 0 ? void 0 : _a.getMetrics() }) }) }));
            });
            // If current provider is unhealthy, try to switch to fallback
            if (!isHealthy && ((_b = (_a = providerConfig.enterpriseConfig) === null || _a === void 0 ? void 0 : _a.failover) === null || _b === void 0 ? void 0 : _b.enabled)) {
                const fallbackProviders = providerConfig.enterpriseConfig.failover.fallbackProviders;
                for (const fallbackName of fallbackProviders) {
                    if (fallbackName !== providerName) {
                        const switched = await switchProvider(fallbackName);
                        if (switched) {
                            console.warn(`Switched to fallback provider: ${fallbackName}`);
                            break;
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Health check failed:', error);
        }
    }, [state.currentProvider, providerConfig, switchProvider]);
    // Initialize on mount and when config changes
    useEffect(() => {
        initializeProviders();
    }, [initializeProviders]);
    // Periodic health checks
    useEffect(() => {
        if (!state.currentProvider)
            return;
        const interval = setInterval(refreshProviderHealth, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, [state.currentProvider, refreshProviderHealth]);
    // Provider wrapper methods
    const sendMessage = useCallback(async (messages, systemPrompt, tools, toolChoice, debug) => {
        if (!state.currentProvider) {
            throw new Error('No provider available');
        }
        try {
            // pass through optional args when provider supports them (CustomProvider accepts and ignores extras)
            return await state.currentProvider.sendMessage(messages, systemPrompt, tools, toolChoice, debug);
        }
        catch (error) {
            // Refresh health status and potentially switch providers
            await refreshProviderHealth();
            throw error;
        }
    }, [state.currentProvider, refreshProviderHealth]);
    const sendMessageStream = useCallback(async (messages, onChunk, systemPrompt, tools, toolChoice, debug) => {
        if (!state.currentProvider) {
            throw new Error('No provider available');
        }
        try {
            return await state.currentProvider.sendMessageStream(messages, onChunk, systemPrompt, tools, toolChoice, debug);
        }
        catch (error) {
            // Refresh health status and potentially switch providers
            await refreshProviderHealth();
            throw error;
        }
    }, [state.currentProvider, refreshProviderHealth]);
    return Object.assign(Object.assign({}, state), { 
        // Actions
        initializeProviders,
        switchProvider,
        refreshProviderHealth,
        // Provider methods
        sendMessage,
        sendMessageStream, 
        // Utility
        isReady: state.currentProvider !== null && !state.isLoading, capabilities: (_a = state.currentProvider) === null || _a === void 0 ? void 0 : _a.capabilities, metrics: (_b = state.currentProvider) === null || _b === void 0 ? void 0 : _b.getMetrics() });
}
export default useModelProvider;
