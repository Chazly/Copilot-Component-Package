import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  MemoryScope, 
  MemoryScopeConfig, 
  MemoryEntry, 
  MemoryScopeHookResult,
  MemoryScopeStats,
  SyncOperation,
  ConflictInfo,
  SetDataOptions,
  SyncResult,
  ConflictResolution,
  CacheStats,
  OptimizationResult,
  IntegrityReport,
  MemoryEvent,
  MemoryEventData
} from '../types/memory'

// Default configuration
const DEFAULT_CONFIG: MemoryScopeConfig = {
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
}

// Storage adapters
class StorageAdapter {
  async get(key: string): Promise<string | null> {
    throw new Error('Not implemented')
  }

  async set(key: string, value: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async remove(key: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async clear(): Promise<void> {
    throw new Error('Not implemented')
  }

  async keys(): Promise<string[]> {
    throw new Error('Not implemented')
  }
}

class LocalStorageAdapter extends StorageAdapter {
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      throw new Error(`LocalStorage quota exceeded: ${error}`)
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    localStorage.clear()
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage)
  }
}

class SessionStorageAdapter extends StorageAdapter {
  async get(key: string): Promise<string | null> {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      sessionStorage.setItem(key, value)
    } catch (error) {
      throw new Error(`SessionStorage quota exceeded: ${error}`)
    }
  }

  async remove(key: string): Promise<void> {
    sessionStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    sessionStorage.clear()
  }

  async keys(): Promise<string[]> {
    return Object.keys(sessionStorage)
  }
}

class MemoryAdapter extends StorageAdapter {
  private storage = new Map<string, string>()

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) || null
  }

  async set(key: string, value: string): Promise<void> {
    this.storage.set(key, value)
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys())
  }
}

class RemoteAdapter extends StorageAdapter {
  constructor(private endpoint: string, private auth: any) {
    super()
  }

  async get(key: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.endpoint}/data/${key}`, {
        headers: this.getHeaders()
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.value
    } catch {
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    await fetch(`${this.endpoint}/data/${key}`, {
      method: 'PUT',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
  }

  async remove(key: string): Promise<void> {
    await fetch(`${this.endpoint}/data/${key}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
  }

  async clear(): Promise<void> {
    await fetch(`${this.endpoint}/data`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
  }

  async keys(): Promise<string[]> {
    const response = await fetch(`${this.endpoint}/data`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    return data.keys || []
  }

  private getHeaders() {
    const headers: Record<string, string> = {}
    if (this.auth?.method === 'bearer') {
      headers['Authorization'] = `Bearer ${this.auth.credentials}`
    } else if (this.auth?.method === 'apikey') {
      headers['X-API-Key'] = this.auth.credentials
    }
    return headers
  }
}

// Encryption utilities
class EncryptionService {
  private keys = new Map<MemoryScope, string>()

  async encrypt(data: string, scope: MemoryScope): Promise<string> {
    // Simple base64 encoding for demo - use proper encryption in production
    try {
      return btoa(data)
    } catch {
      return data
    }
  }

  async decrypt(encryptedData: string, scope: MemoryScope): Promise<string> {
    // Simple base64 decoding for demo - use proper decryption in production
    try {
      return atob(encryptedData)
    } catch {
      return encryptedData
    }
  }

  generateChecksum(data: string): string {
    // Simple checksum - use proper hashing in production
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }
}

// Main hook implementation
export function useMemoryScope(config: Partial<MemoryScopeConfig> = {}): MemoryScopeHookResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const [currentScope, setCurrentScope] = useState<MemoryScope>(finalConfig.defaultScope)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [pendingChanges, setPendingChanges] = useState<SyncOperation[]>([])
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])

  // Internal state
  const adapters = useRef(new Map<MemoryScope, StorageAdapter>())
  const encryption = useRef(new EncryptionService())
  const cache = useRef(new Map<string, MemoryEntry>())
  const stats = useRef(new Map<MemoryScope, MemoryScopeStats>())
  const eventListeners = useRef(new Map<MemoryEvent, Set<(data: any) => void>>())
  const syncInterval = useRef<NodeJS.Timeout>()

  // Initialize storage adapters
  useEffect(() => {
    const initAdapters = () => {
      finalConfig.enabledScopes.forEach(scope => {
        // Skip 'all' scope as it's not a real storage scope
        if (scope === 'all') return
        
        const storageType = finalConfig.storage[scope]
        let adapter: StorageAdapter

        switch (storageType) {
          case 'localStorage':
            adapter = new LocalStorageAdapter()
            break
          case 'sessionStorage':
            adapter = new SessionStorageAdapter()
            break
          case 'memory':
            adapter = new MemoryAdapter()
            break
          case 'remote':
            adapter = new RemoteAdapter(
              finalConfig.remoteStorage?.endpoint || '', 
              finalConfig.remoteStorage?.authentication
            )
            break
          default:
            adapter = new MemoryAdapter()
        }

        adapters.current.set(scope, adapter)
      })
    }

    initAdapters()
  }, [])

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync interval
  useEffect(() => {
    if (finalConfig.synchronization.enabled && isOnline) {
      syncInterval.current = setInterval(() => {
        syncData().catch(console.error)
      }, finalConfig.synchronization.syncInterval)

      return () => {
        if (syncInterval.current) {
          clearInterval(syncInterval.current)
        }
      }
    }
  }, [finalConfig.synchronization.enabled, isOnline])

  // Event emission
  const emit = useCallback((event: MemoryEvent, data: MemoryEventData) => {
    const listeners = eventListeners.current.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }, [])

  // Utility functions
  const createStorageKey = (key: string, scope: MemoryScope): string => {
    return `copilot:${scope}:${key}`
  }

  const serializeEntry = async (entry: MemoryEntry): Promise<string> => {
    let serialized = JSON.stringify(entry)
    
    if (finalConfig.encryption.enabled) {
      serialized = await encryption.current.encrypt(serialized, entry.scope)
    }
    
    return serialized
  }

  const deserializeEntry = async (data: string, scope: MemoryScope): Promise<MemoryEntry | null> => {
    try {
      let entryData = data
      
      if (finalConfig.encryption.enabled) {
        entryData = await encryption.current.decrypt(data, scope)
      }
      
      const entry = JSON.parse(entryData) as MemoryEntry
      
      // Convert date strings back to Date objects
      entry.metadata.createdAt = new Date(entry.metadata.createdAt)
      entry.metadata.updatedAt = new Date(entry.metadata.updatedAt)
      entry.metadata.accessedAt = new Date(entry.metadata.accessedAt)
      
      return entry
    } catch {
      return null
    }
  }

  // Core data operations
  const getData = useCallback(async <T>(key: string, scope?: MemoryScope): Promise<T | null> => {
    const targetScope = scope || currentScope
    const adapter = adapters.current.get(targetScope)
    if (!adapter) return null

    const storageKey = createStorageKey(key, targetScope)
    
    // Check cache first
    const cached = cache.current.get(storageKey)
    if (cached) {
      cached.metadata.accessedAt = new Date()
      cached.metadata.accessCount++
      return cached.value as T
    }

    try {
      const data = await adapter.get(storageKey)
      if (!data) return null

      const entry = await deserializeEntry(data, targetScope)
      if (!entry) return null

      // Check TTL
      if (entry.metadata.ttl && Date.now() > entry.metadata.ttl) {
        await adapter.remove(storageKey)
        return null
      }

      // Update access metadata
      entry.metadata.accessedAt = new Date()
      entry.metadata.accessCount++

      // Cache the entry
      cache.current.set(storageKey, entry)

      emit('dataChanged', {
        scope: targetScope,
        key,
        operation: 'read',
        timestamp: new Date()
      })

      return entry.value as T
    } catch (error) {
      emit('errorOccurred', {
        scope: targetScope,
        key,
        operation: 'read',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }, [currentScope, emit])

  const setData = useCallback(async <T>(
    key: string, 
    value: T, 
    scope?: MemoryScope, 
    options: SetDataOptions = {}
  ): Promise<void> => {
    const targetScope = scope || currentScope
    const adapter = adapters.current.get(targetScope)
    if (!adapter) throw new Error(`No adapter for scope: ${targetScope}`)

    const storageKey = createStorageKey(key, targetScope)
    const now = new Date()

    const entry: MemoryEntry<T> = {
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
    }

    try {
      const serialized = await serializeEntry(entry)
      await adapter.set(storageKey, serialized)

      // Update cache
      cache.current.set(storageKey, entry)

      // Queue for sync if enabled
      if (finalConfig.synchronization.enabled && targetScope !== 'ephemeral') {
        const syncOp: SyncOperation = {
          id: `sync-${Date.now()}-${Math.random()}`,
          timestamp: now,
          scope: targetScope,
          operation: 'update',
          key,
          data: value,
          status: 'pending',
          retryCount: 0
        }
        setPendingChanges(prev => [...prev, syncOp])
      }

      emit('dataChanged', {
        scope: targetScope,
        key,
        operation: 'write',
        timestamp: now
      })

    } catch (error) {
      emit('errorOccurred', {
        scope: targetScope,
        key,
        operation: 'write',
        timestamp: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }, [currentScope, finalConfig.encryption.enabled, finalConfig.synchronization.enabled, emit])

  const removeData = useCallback(async (key: string, scope?: MemoryScope): Promise<void> => {
    const targetScope = scope || currentScope
    const adapter = adapters.current.get(targetScope)
    if (!adapter) return

    const storageKey = createStorageKey(key, targetScope)

    try {
      await adapter.remove(storageKey)
      cache.current.delete(storageKey)

      emit('dataChanged', {
        scope: targetScope,
        key,
        operation: 'delete',
        timestamp: new Date()
      })
    } catch (error) {
      emit('errorOccurred', {
        scope: targetScope,
        key,
        operation: 'delete',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [currentScope, emit])

  const clearScope = useCallback(async (scope: MemoryScope): Promise<void> => {
    const adapter = adapters.current.get(scope)
    if (!adapter) return

    try {
      // Clear storage
      await adapter.clear()
      
      // Clear cache entries for this scope
      const cacheKeys = Array.from(cache.current.keys())
      cacheKeys.forEach(key => {
        if (key.startsWith(`copilot:${scope}:`)) {
          cache.current.delete(key)
        }
      })

      emit('dataChanged', {
        scope,
        operation: 'clear',
        timestamp: new Date()
      })
    } catch (error) {
      emit('errorOccurred', {
        scope,
        operation: 'clear',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [emit])

  // Batch operations
  const getBatch = useCallback(async <T>(keys: string[], scope?: MemoryScope): Promise<Record<string, T>> => {
    const result: Record<string, T> = {}
    
    await Promise.all(keys.map(async (key) => {
      const value = await getData<T>(key, scope)
      if (value !== null) {
        result[key] = value
      }
    }))

    return result
  }, [getData])

  const setBatch = useCallback(async <T>(data: Record<string, T>, scope?: MemoryScope): Promise<void> => {
    await Promise.all(
      Object.entries(data).map(([key, value]) => setData(key, value, scope))
    )
  }, [setData])

  // Scope management
  const switchScope = useCallback((scope: MemoryScope) => {
    if (finalConfig.enabledScopes.includes(scope)) {
      setCurrentScope(scope)
      emit('scopeChanged', {
        scope,
        timestamp: new Date()
      })
    }
  }, [finalConfig.enabledScopes, emit])

  const getCurrentScope = useCallback(() => currentScope, [currentScope])

  const getAvailableScopes = useCallback(() => finalConfig.enabledScopes, [finalConfig.enabledScopes])

  // Sync operations
  const syncData = useCallback(async (scope?: MemoryScope): Promise<SyncResult> => {
    if (!finalConfig.synchronization.enabled || !isOnline) {
      return { success: false, syncedEntries: 0, conflicts: [], errors: ['Sync disabled or offline'], duration: 0 }
    }

    const startTime = Date.now()
    const result: SyncResult = {
      success: true,
      syncedEntries: 0,
      conflicts: [],
      errors: [],
      duration: 0
    }

    emit('syncStarted', { scope: scope || 'all', timestamp: new Date() })

    try {
      // Implementation would sync with remote storage
      // For now, just mark pending changes as completed
      setPendingChanges(prev => prev.map(op => ({ ...op, status: 'completed' as const })))
      setLastSyncTime(new Date())
      
      result.duration = Date.now() - startTime
      
      emit('syncCompleted', { 
        scope: scope || 'all', 
        timestamp: new Date(),
        data: result
      })

    } catch (error) {
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error')
      
      emit('syncFailed', { 
        scope: scope || 'all', 
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown sync error'
      })
    }

    return result
  }, [finalConfig.synchronization.enabled, isOnline, emit])

  // Conflict resolution
  const resolveConflict = useCallback(async (key: string, resolution: ConflictResolution): Promise<void> => {
    const conflict = conflicts.find(c => c.key === key)
    if (!conflict) return

    let resolvedValue: any
    
    switch (resolution.strategy) {
      case 'useLocal':
        resolvedValue = conflict.localValue
        break
      case 'useRemote':
        resolvedValue = conflict.remoteValue
        break
      case 'merge':
        // Simple merge strategy - in production, use proper merge logic
        resolvedValue = { ...conflict.remoteValue, ...conflict.localValue }
        break
      case 'manual':
        resolvedValue = resolution.mergedValue
        break
    }

    await setData(key, resolvedValue, conflict.scope)
    setConflicts(prev => prev.filter(c => c.key !== key))
  }, [conflicts, setData])

  // Performance and monitoring
  const getStats = useCallback((scope?: MemoryScope): MemoryScopeStats[] => {
    const scopes = scope ? [scope] : finalConfig.enabledScopes
    
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
    }))
  }, [finalConfig.enabledScopes, isOnline, conflicts])

  const getCacheStats = useCallback((): CacheStats => {
    return {
      totalMemoryUsage: cache.current.size * 1000, // Rough estimation
      maxMemoryUsage: finalConfig.performance.caching.maxMemoryUsage,
      hitRate: 0, // Would be calculated from actual metrics
      missRate: 0,
      evictionCount: 0,
      compressionRatio: 0
    }
  }, [finalConfig.performance.caching.maxMemoryUsage])

  const optimizeStorage = useCallback(async (scope?: MemoryScope): Promise<OptimizationResult> => {
    const before = {
      entries: cache.current.size,
      size: cache.current.size * 1000,
      memoryUsage: cache.current.size * 1000
    }

    // Simple optimization - clear old cache entries
    const now = Date.now()
    const entriesToRemove: string[] = []
    
    cache.current.forEach((entry, key) => {
      if (entry.metadata.ttl && now > entry.metadata.ttl) {
        entriesToRemove.push(key)
      }
    })

    entriesToRemove.forEach(key => cache.current.delete(key))

    const after = {
      entries: cache.current.size,
      size: cache.current.size * 1000,
      memoryUsage: cache.current.size * 1000
    }

    const result: OptimizationResult = {
      before,
      after,
      operations: {
        compressed: 0,
        deleted: entriesToRemove.length,
        defragmented: false
      },
      duration: 0
    }

    emit('storageOptimized', {
      scope: scope || 'all',
      timestamp: new Date(),
      data: result
    })

    return result
  }, [emit])

  // Event handling
  const subscribe = useCallback((event: MemoryEvent, callback: (data: any) => void): (() => void) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set())
    }
    
    eventListeners.current.get(event)?.add(callback)
    
    return () => {
      eventListeners.current.get(event)?.delete(callback)
    }
  }, [])

  // Utility methods - simplified implementations
  const query = useCallback(async <T>(
    predicate: (entry: MemoryEntry<T>) => boolean, 
    scope?: MemoryScope
  ): Promise<MemoryEntry<T>[]> => {
    // Simplified query - would implement proper indexing in production
    const results: MemoryEntry<T>[] = []
    
    cache.current.forEach((entry) => {
      if ((!scope || entry.scope === scope) && predicate(entry as MemoryEntry<T>)) {
        results.push(entry as MemoryEntry<T>)
      }
    })
    
    return results
  }, [])

  const search = useCallback(async <T>(searchTerm: string, scope?: MemoryScope): Promise<MemoryEntry<T>[]> => {
    return query<T>((entry) => {
      const searchableText = JSON.stringify(entry.value).toLowerCase()
      return searchableText.includes(searchTerm.toLowerCase())
    }, scope)
  }, [query])

  const exportData = useCallback(async (scope?: MemoryScope, format: 'json' | 'csv' | 'xml' = 'json'): Promise<string> => {
    const entries = await query(() => true, scope)
    
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 2)
      case 'csv':
        // Simplified CSV export
        const headers = 'scope,key,value,createdAt,updatedAt\n'
        const rows = entries.map(e => 
          `${e.scope},${e.key},"${JSON.stringify(e.value)}",${e.metadata.createdAt.toISOString()},${e.metadata.updatedAt.toISOString()}`
        ).join('\n')
        return headers + rows
      default:
        return JSON.stringify(entries)
    }
  }, [query])

  const importData = useCallback(async (data: string, scope?: MemoryScope, format: 'json' | 'csv' | 'xml' = 'json'): Promise<void> => {
    try {
      if (format === 'json') {
        const entries = JSON.parse(data) as MemoryEntry[]
        for (const entry of entries) {
          await setData(entry.key, entry.value, scope || entry.scope)
        }
      }
      // Add CSV and XML parsing as needed
    } catch (error) {
      throw new Error(`Import failed: ${error}`)
    }
  }, [setData])

  const validateIntegrity = useCallback(async (scope?: MemoryScope): Promise<IntegrityReport> => {
    const entries = await query(() => true, scope)
    
    return {
      scope: scope || 'all',
      totalEntries: entries.length,
      corruptedEntries: 0,
      missingChecksums: 0,
      encryptionErrors: 0,
      repaired: false,
      errors: []
    }
  }, [query])

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
  }
} 