export type MemoryScope = 'session' | 'user' | 'organization' | 'global' | 'ephemeral' | 'all';
export interface MemoryScopeConfig {
    defaultScope: MemoryScope;
    enabledScopes: MemoryScope[];
    encryption: {
        enabled: boolean;
        algorithm: 'AES-256-GCM' | 'AES-128-GCM' | 'ChaCha20-Poly1305';
        keyRotationInterval?: number;
        scopeBasedKeys: boolean;
    };
    retentionPolicies: {
        [K in MemoryScope]?: {
            maxAge: number;
            maxSize: number;
            maxEntries: number;
            cleanupInterval: number;
            compressionEnabled: boolean;
        };
    };
    synchronization: {
        enabled: boolean;
        conflictResolution: 'last-write-wins' | 'manual' | 'merge' | 'timestamp-based';
        syncInterval: number;
        offlineQueueSize: number;
        batchSize: number;
    };
    performance: {
        caching: {
            enabled: boolean;
            maxMemoryUsage: number;
            evictionPolicy: 'LRU' | 'LFU' | 'TTL';
        };
        indexing: {
            enabled: boolean;
            indexedFields: string[];
        };
        compression: {
            enabled: boolean;
            algorithm: 'gzip' | 'lz4' | 'snappy';
            threshold: number;
        };
    };
    storage: {
        session: 'sessionStorage' | 'memory' | 'indexedDB';
        user: 'localStorage' | 'indexedDB' | 'remote';
        organization: 'remote' | 'indexedDB';
        global: 'remote';
        ephemeral: 'memory';
    };
    remoteStorage?: {
        endpoint: string;
        authentication: {
            method: 'bearer' | 'apikey' | 'oauth' | 'jwt';
            credentials: string;
        };
        encryption: {
            clientSide: boolean;
            transitEncryption: boolean;
        };
    };
}
export interface MemoryEntry<T = any> {
    id: string;
    scope: MemoryScope;
    key: string;
    value: T;
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        accessedAt: Date;
        accessCount: number;
        version: number;
        checksum: string;
        compressed: boolean;
        encrypted: boolean;
        tags: string[];
        ttl?: number;
    };
}
export interface MemoryScopeStats {
    scope: MemoryScope;
    totalEntries: number;
    totalSize: number;
    memoryUsage: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
    lastCleanup: Date;
    syncStatus: 'synced' | 'pending' | 'error' | 'offline';
    conflicts: number;
}
export interface SyncOperation {
    id: string;
    timestamp: Date;
    scope: MemoryScope;
    operation: 'create' | 'update' | 'delete' | 'batch';
    key: string;
    data?: any;
    status: 'pending' | 'completed' | 'failed' | 'conflict';
    retryCount: number;
    error?: string;
}
export interface ConflictInfo {
    key: string;
    scope: MemoryScope;
    localValue: any;
    remoteValue: any;
    localTimestamp: Date;
    remoteTimestamp: Date;
    conflictType: 'data' | 'deletion' | 'creation';
}
export interface MemoryScopeHookResult {
    getData: <T>(key: string, scope?: MemoryScope) => Promise<T | null>;
    setData: <T>(key: string, value: T, scope?: MemoryScope, options?: SetDataOptions) => Promise<void>;
    removeData: (key: string, scope?: MemoryScope) => Promise<void>;
    clearScope: (scope: MemoryScope) => Promise<void>;
    getBatch: <T>(keys: string[], scope?: MemoryScope) => Promise<Record<string, T>>;
    setBatch: <T>(data: Record<string, T>, scope?: MemoryScope) => Promise<void>;
    switchScope: (scope: MemoryScope) => void;
    getCurrentScope: () => MemoryScope;
    getAvailableScopes: () => MemoryScope[];
    query: <T>(predicate: (entry: MemoryEntry<T>) => boolean, scope?: MemoryScope) => Promise<MemoryEntry<T>[]>;
    search: <T>(searchTerm: string, scope?: MemoryScope) => Promise<MemoryEntry<T>[]>;
    syncData: (scope?: MemoryScope) => Promise<SyncResult>;
    isOnline: boolean;
    lastSyncTime: Date | null;
    pendingChanges: SyncOperation[];
    conflicts: ConflictInfo[];
    resolveConflict: (key: string, resolution: ConflictResolution) => Promise<void>;
    getStats: (scope?: MemoryScope) => MemoryScopeStats[];
    getCacheStats: () => CacheStats;
    optimizeStorage: (scope?: MemoryScope) => Promise<OptimizationResult>;
    subscribe: (event: MemoryEvent, callback: (data: any) => void) => () => void;
    exportData: (scope?: MemoryScope, format?: 'json' | 'csv' | 'xml') => Promise<string>;
    importData: (data: string, scope?: MemoryScope, format?: 'json' | 'csv' | 'xml') => Promise<void>;
    validateIntegrity: (scope?: MemoryScope) => Promise<IntegrityReport>;
}
export interface SetDataOptions {
    ttl?: number;
    tags?: string[];
    compress?: boolean;
    encrypt?: boolean;
    syncImmediately?: boolean;
    version?: number;
}
export interface SyncResult {
    success: boolean;
    syncedEntries: number;
    conflicts: ConflictInfo[];
    errors: string[];
    duration: number;
}
export interface ConflictResolution {
    strategy: 'useLocal' | 'useRemote' | 'merge' | 'manual';
    mergedValue?: any;
}
export interface CacheStats {
    totalMemoryUsage: number;
    maxMemoryUsage: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
    compressionRatio: number;
}
export interface OptimizationResult {
    before: {
        entries: number;
        size: number;
        memoryUsage: number;
    };
    after: {
        entries: number;
        size: number;
        memoryUsage: number;
    };
    operations: {
        compressed: number;
        deleted: number;
        defragmented: boolean;
    };
    duration: number;
}
export interface IntegrityReport {
    scope: MemoryScope;
    totalEntries: number;
    corruptedEntries: number;
    missingChecksums: number;
    encryptionErrors: number;
    repaired: boolean;
    errors: string[];
}
export type MemoryEvent = 'dataChanged' | 'scopeChanged' | 'syncStarted' | 'syncCompleted' | 'syncFailed' | 'conflictDetected' | 'storageOptimized' | 'errorOccurred' | 'quotaExceeded';
export interface MemoryEventData {
    scope: MemoryScope;
    key?: string;
    operation?: string;
    timestamp: Date;
    data?: any;
    error?: string;
}
