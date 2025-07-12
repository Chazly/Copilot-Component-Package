import { useState, useCallback, useEffect, useRef } from 'react';
export function useTools(config) {
    var _a, _b, _c, _d;
    const [state, setState] = useState({
        tools: new Map(),
        contextSources: new Map(),
        cache: new Map(),
        executionHistory: [],
        isExecuting: false,
        lastError: null
    });
    const abortController = useRef(null);
    // Initialize built-in tools
    useEffect(() => {
        const builtInTools = new Map([
            // Data tools
            ['fetch-data', {
                    name: 'fetch-data',
                    description: 'Fetch data from external APIs',
                    parameters: { url: 'string', method: 'string', headers: 'object' },
                    execute: async (params, context) => {
                        var _a;
                        const response = await fetch(params.url, {
                            method: params.method || 'GET',
                            headers: params.headers || {},
                            signal: (_a = abortController.current) === null || _a === void 0 ? void 0 : _a.signal
                        });
                        if (!response.ok)
                            throw new Error(`HTTP ${response.status}`);
                        return await response.json();
                    },
                    category: 'data',
                    cacheable: true,
                    cacheTTL: 300
                }],
            // Action tools
            ['send-notification', {
                    name: 'send-notification',
                    description: 'Send a notification to the user',
                    parameters: { message: 'string', type: 'string', duration: 'number' },
                    execute: (params) => {
                        // Browser notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(params.message, {
                                icon: '/favicon.ico',
                                tag: 'copilot-notification'
                            });
                        }
                        // Console log for debugging
                        console.log(`[${params.type || 'info'}] ${params.message}`);
                        return { sent: true, message: params.message };
                    },
                    category: 'action'
                }],
            // Integration tools
            ['query-database', {
                    name: 'query-database',
                    description: 'Query configured databases',
                    parameters: { query: 'string', database: 'string' },
                    execute: async (params, context) => {
                        // This would integrate with actual database connections
                        const mockData = {
                            query: params.query,
                            results: [],
                            timestamp: new Date().toISOString()
                        };
                        // Simulate database delay
                        await new Promise(resolve => setTimeout(resolve, 500));
                        return mockData;
                    },
                    category: 'integration',
                    requiresAuth: true,
                    cacheable: true,
                    cacheTTL: 60
                }],
            // Utility tools
            ['format-text', {
                    name: 'format-text',
                    description: 'Format text in various ways',
                    parameters: { text: 'string', format: 'string' },
                    execute: (params) => {
                        const { text, format } = params;
                        switch (format) {
                            case 'uppercase':
                                return text.toUpperCase();
                            case 'lowercase':
                                return text.toLowerCase();
                            case 'title':
                                return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                            case 'markdown':
                                return `**${text}**`;
                            default:
                                return text;
                        }
                    },
                    category: 'utility',
                    cacheable: true,
                    cacheTTL: 3600
                }],
            // RAG tools
            ['semantic-search', {
                    name: 'semantic-search',
                    description: 'Search through context sources using semantic similarity',
                    parameters: { query: 'string', limit: 'number', threshold: 'number' },
                    execute: async (params, context) => {
                        // This would integrate with vector databases or semantic search APIs
                        const mockResults = [
                            {
                                content: `Relevant information about: ${params.query}`,
                                similarity: 0.85,
                                source: 'knowledge-base',
                                metadata: { section: 'documentation' }
                            }
                        ];
                        // Simulate search delay
                        await new Promise(resolve => setTimeout(resolve, 200));
                        return {
                            query: params.query,
                            results: mockResults.slice(0, params.limit || 5),
                            totalResults: mockResults.length
                        };
                    },
                    category: 'data',
                    cacheable: true,
                    cacheTTL: 1800
                }]
        ]);
        setState(prev => (Object.assign(Object.assign({}, prev), { tools: builtInTools })));
    }, []);
    // Initialize context sources from config
    useEffect(() => {
        const sources = new Map();
        // Parse context sources from config
        if (config.contextSources) {
            config.contextSources.forEach(sourceId => {
                var _a, _b;
                const providerConfig = (_b = (_a = config.integrations) === null || _a === void 0 ? void 0 : _a.contextProviders) === null || _b === void 0 ? void 0 : _b[sourceId];
                if (providerConfig) {
                    sources.set(sourceId, {
                        name: sourceId,
                        type: sourceId,
                        config: providerConfig,
                        transformer: getDefaultTransformer(sourceId)
                    });
                }
            });
        }
        setState(prev => (Object.assign(Object.assign({}, prev), { contextSources: sources })));
    }, [config.contextSources, (_a = config.integrations) === null || _a === void 0 ? void 0 : _a.contextProviders]);
    // Cache management
    const getCachedResult = useCallback((key) => {
        const entry = state.cache.get(key);
        if (!entry)
            return null;
        // Check if cache entry is still valid
        const now = new Date();
        const age = (now.getTime() - entry.timestamp.getTime()) / 1000;
        if (age > entry.ttl) {
            setState(prev => {
                const newCache = new Map(prev.cache);
                newCache.delete(key);
                return Object.assign(Object.assign({}, prev), { cache: newCache });
            });
            return null;
        }
        return entry.data;
    }, [state.cache]);
    const setCachedResult = useCallback((key, data, ttl) => {
        setState(prev => {
            const newCache = new Map(prev.cache);
            newCache.set(key, {
                data,
                timestamp: new Date(),
                ttl
            });
            return Object.assign(Object.assign({}, prev), { cache: newCache });
        });
    }, []);
    // Register custom tool
    const registerTool = useCallback((tool) => {
        setState(prev => {
            const newTools = new Map(prev.tools);
            newTools.set(tool.name, tool);
            return Object.assign(Object.assign({}, prev), { tools: newTools });
        });
    }, []);
    // Unregister tool
    const unregisterTool = useCallback((toolName) => {
        setState(prev => {
            const newTools = new Map(prev.tools);
            newTools.delete(toolName);
            return Object.assign(Object.assign({}, prev), { tools: newTools });
        });
    }, []);
    // Execute tool
    const executeTool = useCallback(async (toolName, parameters = {}, context = {}) => {
        var _a, _b, _c, _d, _e, _f;
        const startTime = Date.now();
        try {
            setState(prev => (Object.assign(Object.assign({}, prev), { isExecuting: true, lastError: null })));
            const tool = state.tools.get(toolName);
            if (!tool) {
                throw new Error(`Tool '${toolName}' not found`);
            }
            // Check authentication if required
            if (tool.requiresAuth && !((_a = context.user) === null || _a === void 0 ? void 0 : _a.authenticated)) {
                throw new Error(`Tool '${toolName}' requires authentication`);
            }
            // Check cache if tool is cacheable
            let result;
            const cacheKey = `${toolName}:${JSON.stringify(parameters)}`;
            if (tool.cacheable && ((_c = (_b = config.performance) === null || _b === void 0 ? void 0 : _b.caching) === null || _c === void 0 ? void 0 : _c.enabled)) {
                const cachedResult = getCachedResult(cacheKey);
                if (cachedResult !== null) {
                    result = cachedResult;
                }
            }
            // Execute tool if not cached
            if (result === undefined) {
                // Create abort controller for this execution
                abortController.current = new AbortController();
                result = await tool.execute(parameters, context);
                // Cache result if tool is cacheable
                if (tool.cacheable && ((_e = (_d = config.performance) === null || _d === void 0 ? void 0 : _d.caching) === null || _e === void 0 ? void 0 : _e.enabled)) {
                    setCachedResult(cacheKey, result, tool.cacheTTL || 300);
                }
            }
            const duration = Date.now() - startTime;
            const toolResult = {
                success: true,
                data: result,
                timestamp: new Date(),
                duration
            };
            // Add to execution history
            setState(prev => (Object.assign(Object.assign({}, prev), { executionHistory: [toolResult, ...prev.executionHistory.slice(0, 99)], isExecuting: false })));
            // Track analytics if enabled
            if ((_f = config.analytics) === null || _f === void 0 ? void 0 : _f.trackActions) {
                console.log('Tool execution tracked:', {
                    tool: toolName,
                    success: true,
                    duration,
                    timestamp: new Date()
                });
            }
            return toolResult;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const toolResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                duration
            };
            setState(prev => (Object.assign(Object.assign({}, prev), { executionHistory: [toolResult, ...prev.executionHistory.slice(0, 99)], isExecuting: false, lastError: toolResult.error || 'Unknown error' })));
            console.error(`Tool execution failed [${toolName}]:`, error);
            return toolResult;
        }
        finally {
            abortController.current = null;
        }
    }, [state.tools, (_c = (_b = config.performance) === null || _b === void 0 ? void 0 : _b.caching) === null || _c === void 0 ? void 0 : _c.enabled, (_d = config.analytics) === null || _d === void 0 ? void 0 : _d.trackActions, getCachedResult, setCachedResult]);
    // Fetch from context source
    const fetchFromContextSource = useCallback(async (sourceName, query) => {
        var _a;
        const source = state.contextSources.get(sourceName);
        if (!source) {
            throw new Error(`Context source '${sourceName}' not found`);
        }
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            // Add authentication
            switch (source.config.authMethod) {
                case 'bearer':
                    if (source.config.apiKey) {
                        headers['Authorization'] = `Bearer ${source.config.apiKey}`;
                    }
                    break;
                case 'apikey':
                    if (source.config.apiKey) {
                        headers['X-API-Key'] = source.config.apiKey;
                    }
                    break;
            }
            const url = query
                ? `${source.config.apiEndpoint}?q=${encodeURIComponent(query)}`
                : source.config.apiEndpoint;
            const response = await fetch(url, {
                headers,
                signal: (_a = abortController.current) === null || _a === void 0 ? void 0 : _a.signal
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} from ${sourceName}`);
            }
            let data = await response.json();
            // Apply transformer if configured
            if (source.transformer) {
                data = source.transformer(data);
            }
            return data;
        }
        catch (error) {
            console.error(`Failed to fetch from context source ${sourceName}:`, error);
            throw error;
        }
    }, [state.contextSources]);
    // Clear cache
    const clearCache = useCallback(() => {
        setState(prev => (Object.assign(Object.assign({}, prev), { cache: new Map() })));
    }, []);
    // Abort current execution
    const abortExecution = useCallback(() => {
        if (abortController.current) {
            abortController.current.abort();
        }
    }, []);
    return {
        // State
        tools: Array.from(state.tools.values()),
        contextSources: Array.from(state.contextSources.values()),
        executionHistory: state.executionHistory,
        isExecuting: state.isExecuting,
        lastError: state.lastError,
        cacheSize: state.cache.size,
        // Actions
        registerTool,
        unregisterTool,
        executeTool,
        fetchFromContextSource,
        clearCache,
        abortExecution,
        // Utilities
        hasTool: (name) => state.tools.has(name),
        hasContextSource: (name) => state.contextSources.has(name)
    };
}
// Default transformers for common context sources
function getDefaultTransformer(sourceType) {
    switch (sourceType) {
        case 'notion':
            return (data) => {
                var _a;
                return ({
                    pages: ((_a = data.results) === null || _a === void 0 ? void 0 : _a.map((page) => {
                        var _a, _b, _c, _d;
                        return ({
                            id: page.id,
                            title: ((_d = (_c = (_b = (_a = page.properties) === null || _a === void 0 ? void 0 : _a.title) === null || _b === void 0 ? void 0 : _b.title) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.plain_text) || 'Untitled',
                            content: page.properties || {},
                            lastModified: page.last_edited_time
                        });
                    })) || []
                });
            };
        case 'github':
            return (data) => {
                var _a;
                return ({
                    repositories: ((_a = data.items) === null || _a === void 0 ? void 0 : _a.map((repo) => ({
                        id: repo.id,
                        name: repo.name,
                        description: repo.description,
                        url: repo.html_url,
                        stars: repo.stargazers_count
                    }))) || []
                });
            };
        case 'supabase':
            return (data) => ({
                rows: Array.isArray(data) ? data : [data],
                count: Array.isArray(data) ? data.length : 1
            });
        default:
            return (data) => data;
    }
}
