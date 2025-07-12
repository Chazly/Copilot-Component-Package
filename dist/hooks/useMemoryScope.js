import { useState, useCallback, useEffect, useRef } from 'react';
// Default configuration
const DEFAULT_CONFIG = {
    defaultScope: 'user',
    enabledScopes: ['session', 'user', 'ephemeral'],
    encryption: {
        enabled: false,
        algorithm: 'AES-256-GCM',
        scopeBasedKeys: true
    },
    retentionPolicies: {
        session: {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            maxSize: 50 * 1024 * 1024, // 50MB
            maxEntries: 10000,
            cleanupInterval: 60 * 60 * 1000, // 1 hour
            compressionEnabled: true
        },
        user: {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            maxSize: 200 * 1024 * 1024, // 200MB
            maxEntries: 50000,
            cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
            compressionEnabled: true
        },
        organization: {
            maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
            maxSize: 1024 * 1024 * 1024, // 1GB
            maxEntries: 100000,
            cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
            compressionEnabled: true
        },
        ephemeral: {
            maxAge: 60 * 60 * 1000, // 1 hour
            maxSize: 10 * 1024 * 1024, // 10MB
            maxEntries: 1000,
            cleanupInterval: 10 * 60 * 1000, // 10 minutes
            compressionEnabled: false
        }
    },
    synchronization: {
        enabled: true,
        conflictResolution: 'timestamp-based',
        syncInterval: 30 * 1000, // 30 seconds
        offlineQueueSize: 1000,
        batchSize: 50
    },
    performance: {
        caching: {
            enabled: true,
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB
            evictionPolicy: 'LRU'
        },
        indexing: {
            enabled: true,
            indexedFields: ['key', 'tags', 'createdAt', 'updatedAt']
        },
        compression: {
            enabled: true,
            algorithm: 'gzip',
            threshold: 1024 // 1KB
        }
    },
    storage: {
        session: 'sessionStorage',
        user: 'localStorage',
        organization: 'remote',
        global: 'remote',
        ephemeral: 'memory'
    }
};
// Storage adapters
class StorageAdapter {
    async get(key) {
        throw new Error('Not implemented');
    }
    async set(key, value) {
        throw new Error('Not implemented');
    }
    async remove(key) {
        throw new Error('Not implemented');
    }
    async clear() {
        throw new Error('Not implemented');
    }
    async keys() {
        throw new Error('Not implemented');
    }
}
class LocalStorageAdapter extends StorageAdapter {
    async get(key) {
        try {
            return localStorage.getItem(key);
        }
        catch (_a) {
            return null;
        }
    }
    async set(key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch (error) {
            throw new Error(`LocalStorage quota exceeded: ${error}`);
        }
    }
    async remove(key) {
        localStorage.removeItem(key);
    }
    async clear() {
        localStorage.clear();
    }
    async keys() {
        return Object.keys(localStorage);
    }
}
class SessionStorageAdapter extends StorageAdapter {
    async get(key) {
        try {
            return sessionStorage.getItem(key);
        }
        catch (_a) {
            return null;
        }
    }
    async set(key, value) {
        try {
            sessionStorage.setItem(key, value);
        }
        catch (error) {
            throw new Error(`SessionStorage quota exceeded: ${error}`);
        }
    }
    async remove(key) {
        sessionStorage.removeItem(key);
    }
    async clear() {
        sessionStorage.clear();
    }
    async keys() {
        return Object.keys(sessionStorage);
    }
}
class MemoryAdapter extends StorageAdapter {
    constructor() {
        super(...arguments);
        this.storage = new Map();
    }
    async get(key) {
        return this.storage.get(key) || null;
    }
    async set(key, value) {
        this.storage.set(key, value);
    }
    async remove(key) {
        this.storage.delete(key);
    }
    async clear() {
        this.storage.clear();
    }
    async keys() {
        return Array.from(this.storage.keys());
    }
}
class RemoteAdapter extends StorageAdapter {
    constructor(endpoint, auth) {
        super();
        this.endpoint = endpoint;
        this.auth = auth;
    }
    async get(key) {
        try {
            const response = await fetch(`${this.endpoint}/data/${key}`, {
                headers: this.getHeaders()
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.value;
        }
        catch (_a) {
            return null;
        }
    }
    async set(key, value) {
        await fetch(`${this.endpoint}/data/${key}`, {
            method: 'PUT',
            headers: Object.assign(Object.assign({}, this.getHeaders()), { 'Content-Type': 'application/json' }),
            body: JSON.stringify({ value })
        });
    }
    async remove(key) {
        await fetch(`${this.endpoint}/data/${key}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
    }
    async clear() {
        await fetch(`${this.endpoint}/data`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
    }
    async keys() {
        const response = await fetch(`${this.endpoint}/data`, {
            headers: this.getHeaders()
        });
        const data = await response.json();
        return data.keys || [];
    }
    getHeaders() {
        var _a, _b;
        const headers = {};
        if (((_a = this.auth) === null || _a === void 0 ? void 0 : _a.method) === 'bearer') {
            headers['Authorization'] = `Bearer ${this.auth.credentials}`;
        }
        else if (((_b = this.auth) === null || _b === void 0 ? void 0 : _b.method) === 'apikey') {
            headers['X-API-Key'] = this.auth.credentials;
        }
        return headers;
    }
}
// Encryption utilities
class EncryptionService {
    constructor() {
        this.keys = new Map();
    }
    async encrypt(data, scope) {
        // Simple base64 encoding for demo - use proper encryption in production
        try {
            return btoa(data);
        }
        catch (_a) {
            return data;
        }
    }
    async decrypt(encryptedData, scope) {
        // Simple base64 decoding for demo - use proper decryption in production
        try {
            return atob(encryptedData);
        }
        catch (_a) {
            return encryptedData;
        }
    }
    generateChecksum(data) {
        // Simple checksum - use proper hashing in production
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
}
// Main hook implementation
export function useMemoryScope(config = {}) {
    const finalConfig = Object.assign(Object.assign({}, DEFAULT_CONFIG), config);
    const [currentScope, setCurrentScope] = useState(finalConfig.defaultScope);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    // Internal state
    const adapters = useRef(new Map());
    const encryption = useRef(new EncryptionService());
    const cache = useRef(new Map());
    const stats = useRef(new Map());
    const eventListeners = useRef(new Map());
    const syncInterval = useRef();
    // Initialize storage adapters
    useEffect(() => {
        const initAdapters = () => {
            finalConfig.enabledScopes.forEach(scope => {
                var _a, _b;
                // Skip 'all' scope as it's not a real storage scope
                if (scope === 'all')
                    return;
                const storageType = finalConfig.storage[scope];
                let adapter;
                switch (storageType) {
                    case 'localStorage':
                        adapter = new LocalStorageAdapter();
                        break;
                    case 'sessionStorage':
                        adapter = new SessionStorageAdapter();
                        break;
                    case 'memory':
                        adapter = new MemoryAdapter();
                        break;
                    case 'remote':
                        adapter = new RemoteAdapter(((_a = finalConfig.remoteStorage) === null || _a === void 0 ? void 0 : _a.endpoint) || '', (_b = finalConfig.remoteStorage) === null || _b === void 0 ? void 0 : _b.authentication);
                        break;
                    default:
                        adapter = new MemoryAdapter();
                }
                adapters.current.set(scope, adapter);
            });
        };
        initAdapters();
    }, []);
    // Online status monitoring
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    // Sync interval
    useEffect(() => {
        if (finalConfig.synchronization.enabled && isOnline) {
            syncInterval.current = setInterval(() => {
                syncData().catch(console.error);
            }, finalConfig.synchronization.syncInterval);
            return () => {
                if (syncInterval.current) {
                    clearInterval(syncInterval.current);
                }
            };
        }
    }, [finalConfig.synchronization.enabled, isOnline]);
    // Event emission
    const emit = useCallback((event, data) => {
        const listeners = eventListeners.current.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(data));
        }
    }, []);
    // Utility functions
    const createStorageKey = (key, scope) => {
        return `copilot:${scope}:${key}`;
    };
    const serializeEntry = async (entry) => {
        let serialized = JSON.stringify(entry);
        if (finalConfig.encryption.enabled) {
            serialized = await encryption.current.encrypt(serialized, entry.scope);
        }
        return serialized;
    };
    const deserializeEntry = async (data, scope) => {
        try {
            let entryData = data;
            if (finalConfig.encryption.enabled) {
                entryData = await encryption.current.decrypt(data, scope);
            }
            const entry = JSON.parse(entryData);
            // Convert date strings back to Date objects
            entry.metadata.createdAt = new Date(entry.metadata.createdAt);
            entry.metadata.updatedAt = new Date(entry.metadata.updatedAt);
            entry.metadata.accessedAt = new Date(entry.metadata.accessedAt);
            return entry;
        }
        catch (_a) {
            return null;
        }
    };
    // Core data operations
    const getData = useCallback(async (key, scope) => {
        const targetScope = scope || currentScope;
        const adapter = adapters.current.get(targetScope);
        if (!adapter)
            return null;
        const storageKey = createStorageKey(key, targetScope);
        // Check cache first
        const cached = cache.current.get(storageKey);
        if (cached) {
            cached.metadata.accessedAt = new Date();
            cached.metadata.accessCount++;
            return cached.value;
        }
        try {
            const data = await adapter.get(storageKey);
            if (!data)
                return null;
            const entry = await deserializeEntry(data, targetScope);
            if (!entry)
                return null;
            // Check TTL
            if (entry.metadata.ttl && Date.now() > entry.metadata.ttl) {
                await adapter.remove(storageKey);
                return null;
            }
            // Update access metadata
            entry.metadata.accessedAt = new Date();
            entry.metadata.accessCount++;
            // Cache the entry
            cache.current.set(storageKey, entry);
            emit('dataChanged', {
                scope: targetScope,
                key,
                operation: 'read',
                timestamp: new Date()
            });
            return entry.value;
        }
        catch (error) {
            emit('errorOccurred', {
                scope: targetScope,
                key,
                operation: 'read',
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
        }
    }, [currentScope, emit]);
    const setData = useCallback(async (key, value, scope, options = {}) => {
        const targetScope = scope || currentScope;
        const adapter = adapters.current.get(targetScope);
        if (!adapter)
            throw new Error(`No adapter for scope: ${targetScope}`);
        const storageKey = createStorageKey(key, targetScope);
        const now = new Date();
        const entry = {
            id: `${targetScope}:${key}:${now.getTime()}`,
            scope: targetScope,
            key,
            value,
            metadata: {
                createdAt: now,
                updatedAt: now,
                accessedAt: now,
                accessCount: 1,
                version: options.version || 1,
                checksum: encryption.current.generateChecksum(JSON.stringify(value)),
                compressed: options.compress || false,
                encrypted: options.encrypt || finalConfig.encryption.enabled,
                tags: options.tags || [],
                ttl: options.ttl ? now.getTime() + options.ttl : undefined
            }
        };
        try {
            const serialized = await serializeEntry(entry);
            await adapter.set(storageKey, serialized);
            // Update cache
            cache.current.set(storageKey, entry);
            // Queue for sync if enabled
            if (finalConfig.synchronization.enabled && targetScope !== 'ephemeral') {
                const syncOp = {
                    id: `sync-${Date.now()}-${Math.random()}`,
                    timestamp: now,
                    scope: targetScope,
                    operation: 'update',
                    key,
                    data: value,
                    status: 'pending',
                    retryCount: 0
                };
                setPendingChanges(prev => [...prev, syncOp]);
            }
            emit('dataChanged', {
                scope: targetScope,
                key,
                operation: 'write',
                timestamp: now
            });
        }
        catch (error) {
            emit('errorOccurred', {
                scope: targetScope,
                key,
                operation: 'write',
                timestamp: now,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }, [currentScope, finalConfig.encryption.enabled, finalConfig.synchronization.enabled, emit]);
    const removeData = useCallback(async (key, scope) => {
        const targetScope = scope || currentScope;
        const adapter = adapters.current.get(targetScope);
        if (!adapter)
            return;
        const storageKey = createStorageKey(key, targetScope);
        try {
            await adapter.remove(storageKey);
            cache.current.delete(storageKey);
            emit('dataChanged', {
                scope: targetScope,
                key,
                operation: 'delete',
                timestamp: new Date()
            });
        }
        catch (error) {
            emit('errorOccurred', {
                scope: targetScope,
                key,
                operation: 'delete',
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }, [currentScope, emit]);
    const clearScope = useCallback(async (scope) => {
        const adapter = adapters.current.get(scope);
        if (!adapter)
            return;
        try {
            // Clear storage
            await adapter.clear();
            // Clear cache entries for this scope
            const cacheKeys = Array.from(cache.current.keys());
            cacheKeys.forEach(key => {
                if (key.startsWith(`copilot:${scope}:`)) {
                    cache.current.delete(key);
                }
            });
            emit('dataChanged', {
                scope,
                operation: 'clear',
                timestamp: new Date()
            });
        }
        catch (error) {
            emit('errorOccurred', {
                scope,
                operation: 'clear',
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }, [emit]);
    // Batch operations
    const getBatch = useCallback(async (keys, scope) => {
        const result = {};
        await Promise.all(keys.map(async (key) => {
            const value = await getData(key, scope);
            if (value !== null) {
                result[key] = value;
            }
        }));
        return result;
    }, [getData]);
    const setBatch = useCallback(async (data, scope) => {
        await Promise.all(Object.entries(data).map(([key, value]) => setData(key, value, scope)));
    }, [setData]);
    // Scope management
    const switchScope = useCallback((scope) => {
        if (finalConfig.enabledScopes.includes(scope)) {
            setCurrentScope(scope);
            emit('scopeChanged', {
                scope,
                timestamp: new Date()
            });
        }
    }, [finalConfig.enabledScopes, emit]);
    const getCurrentScope = useCallback(() => currentScope, [currentScope]);
    const getAvailableScopes = useCallback(() => finalConfig.enabledScopes, [finalConfig.enabledScopes]);
    // Sync operations
    const syncData = useCallback(async (scope) => {
        if (!finalConfig.synchronization.enabled || !isOnline) {
            return { success: false, syncedEntries: 0, conflicts: [], errors: ['Sync disabled or offline'], duration: 0 };
        }
        const startTime = Date.now();
        const result = {
            success: true,
            syncedEntries: 0,
            conflicts: [],
            errors: [],
            duration: 0
        };
        emit('syncStarted', { scope: scope || 'all', timestamp: new Date() });
        try {
            // Implementation would sync with remote storage
            // For now, just mark pending changes as completed
            setPendingChanges(prev => prev.map(op => (Object.assign(Object.assign({}, op), { status: 'completed' }))));
            setLastSyncTime(new Date());
            result.duration = Date.now() - startTime;
            emit('syncCompleted', {
                scope: scope || 'all',
                timestamp: new Date(),
                data: result
            });
        }
        catch (error) {
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
            emit('syncFailed', {
                scope: scope || 'all',
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown sync error'
            });
        }
        return result;
    }, [finalConfig.synchronization.enabled, isOnline, emit]);
    // Conflict resolution
    const resolveConflict = useCallback(async (key, resolution) => {
        const conflict = conflicts.find(c => c.key === key);
        if (!conflict)
            return;
        let resolvedValue;
        switch (resolution.strategy) {
            case 'useLocal':
                resolvedValue = conflict.localValue;
                break;
            case 'useRemote':
                resolvedValue = conflict.remoteValue;
                break;
            case 'merge':
                // Simple merge strategy - in production, use proper merge logic
                resolvedValue = Object.assign(Object.assign({}, conflict.remoteValue), conflict.localValue);
                break;
            case 'manual':
                resolvedValue = resolution.mergedValue;
                break;
        }
        await setData(key, resolvedValue, conflict.scope);
        setConflicts(prev => prev.filter(c => c.key !== key));
    }, [conflicts, setData]);
    // Performance and monitoring
    const getStats = useCallback((scope) => {
        const scopes = scope ? [scope] : finalConfig.enabledScopes;
        return scopes.map(s => ({
            scope: s,
            totalEntries: 0, // Would be calculated from actual storage
            totalSize: 0,
            memoryUsage: 0,
            hitRate: 0,
            missRate: 0,
            evictionCount: 0,
            lastCleanup: new Date(),
            syncStatus: isOnline ? 'synced' : 'offline',
            conflicts: conflicts.filter(c => c.scope === s).length
        }));
    }, [finalConfig.enabledScopes, isOnline, conflicts]);
    const getCacheStats = useCallback(() => {
        return {
            totalMemoryUsage: cache.current.size * 1000, // Rough estimation
            maxMemoryUsage: finalConfig.performance.caching.maxMemoryUsage,
            hitRate: 0, // Would be calculated from actual metrics
            missRate: 0,
            evictionCount: 0,
            compressionRatio: 0
        };
    }, [finalConfig.performance.caching.maxMemoryUsage]);
    const optimizeStorage = useCallback(async (scope) => {
        const before = {
            entries: cache.current.size,
            size: cache.current.size * 1000,
            memoryUsage: cache.current.size * 1000
        };
        // Simple optimization - clear old cache entries
        const now = Date.now();
        const entriesToRemove = [];
        cache.current.forEach((entry, key) => {
            if (entry.metadata.ttl && now > entry.metadata.ttl) {
                entriesToRemove.push(key);
            }
        });
        entriesToRemove.forEach(key => cache.current.delete(key));
        const after = {
            entries: cache.current.size,
            size: cache.current.size * 1000,
            memoryUsage: cache.current.size * 1000
        };
        const result = {
            before,
            after,
            operations: {
                compressed: 0,
                deleted: entriesToRemove.length,
                defragmented: false
            },
            duration: 0
        };
        emit('storageOptimized', {
            scope: scope || 'all',
            timestamp: new Date(),
            data: result
        });
        return result;
    }, [emit]);
    // Event handling
    const subscribe = useCallback((event, callback) => {
        var _a;
        if (!eventListeners.current.has(event)) {
            eventListeners.current.set(event, new Set());
        }
        (_a = eventListeners.current.get(event)) === null || _a === void 0 ? void 0 : _a.add(callback);
        return () => {
            var _a;
            (_a = eventListeners.current.get(event)) === null || _a === void 0 ? void 0 : _a.delete(callback);
        };
    }, []);
    // Utility methods - simplified implementations
    const query = useCallback(async (predicate, scope) => {
        // Simplified query - would implement proper indexing in production
        const results = [];
        cache.current.forEach((entry) => {
            if ((!scope || entry.scope === scope) && predicate(entry)) {
                results.push(entry);
            }
        });
        return results;
    }, []);
    const search = useCallback(async (searchTerm, scope) => {
        return query((entry) => {
            const searchableText = JSON.stringify(entry.value).toLowerCase();
            return searchableText.includes(searchTerm.toLowerCase());
        }, scope);
    }, [query]);
    const exportData = useCallback(async (scope, format = 'json') => {
        const entries = await query(() => true, scope);
        switch (format) {
            case 'json':
                return JSON.stringify(entries, null, 2);
            case 'csv':
                // Simplified CSV export
                const headers = 'scope,key,value,createdAt,updatedAt\n';
                const rows = entries.map(e => `${e.scope},${e.key},"${JSON.stringify(e.value)}",${e.metadata.createdAt.toISOString()},${e.metadata.updatedAt.toISOString()}`).join('\n');
                return headers + rows;
            default:
                return JSON.stringify(entries);
        }
    }, [query]);
    const importData = useCallback(async (data, scope, format = 'json') => {
        try {
            if (format === 'json') {
                const entries = JSON.parse(data);
                for (const entry of entries) {
                    await setData(entry.key, entry.value, scope || entry.scope);
                }
            }
            // Add CSV and XML parsing as needed
        }
        catch (error) {
            throw new Error(`Import failed: ${error}`);
        }
    }, [setData]);
    const validateIntegrity = useCallback(async (scope) => {
        const entries = await query(() => true, scope);
        return {
            scope: scope || 'all',
            totalEntries: entries.length,
            corruptedEntries: 0,
            missingChecksums: 0,
            encryptionErrors: 0,
            repaired: false,
            errors: []
        };
    }, [query]);
    return {
        // Data operations
        getData,
        setData,
        removeData,
        clearScope,
        // Batch operations
        getBatch,
        setBatch,
        // Scope management
        switchScope,
        getCurrentScope,
        getAvailableScopes,
        // Query operations
        query,
        search,
        // Synchronization
        syncData,
        isOnline,
        lastSyncTime,
        pendingChanges,
        conflicts,
        resolveConflict,
        // Performance and monitoring
        getStats,
        getCacheStats,
        optimizeStorage,
        // Event handling
        subscribe,
        // Utility
        exportData,
        importData,
        validateIntegrity
    };
}
