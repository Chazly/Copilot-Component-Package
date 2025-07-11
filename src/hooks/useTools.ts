import { useState, useCallback, useEffect, useRef } from 'react'
import { AICopilotConfig } from '../types'

// Tool execution result
interface ToolResult {
  success: boolean
  data?: any
  error?: string
  timestamp: Date
  duration: number
}

// Tool definition
interface Tool {
  name: string
  description: string
  parameters?: Record<string, any>
  execute: (params: any, context?: any) => Promise<any> | any
  category?: 'data' | 'action' | 'integration' | 'utility'
  requiresAuth?: boolean
  cacheable?: boolean
  cacheTTL?: number // seconds
}

// Context source configuration
interface ContextSource {
  name: string
  type: 'notion' | 'supabase' | 'github' | 'custom'
  config: {
    apiEndpoint: string
    authMethod: 'bearer' | 'apikey' | 'oauth'
    apiKey?: string
    refreshInterval?: number
  }
  transformer?: (data: any) => any
}

// Cache entry
interface CacheEntry {
  data: any
  timestamp: Date
  ttl: number
}

// Hook state
interface UseToolsState {
  tools: Map<string, Tool>
  contextSources: Map<string, ContextSource>
  cache: Map<string, CacheEntry>
  executionHistory: ToolResult[]
  isExecuting: boolean
  lastError: string | null
}

export function useTools(config: AICopilotConfig) {
  const [state, setState] = useState<UseToolsState>({
    tools: new Map(),
    contextSources: new Map(),
    cache: new Map(),
    executionHistory: [],
    isExecuting: false,
    lastError: null
  })

  const abortController = useRef<AbortController | null>(null)

  // Initialize built-in tools
  useEffect(() => {
    const builtInTools = new Map<string, Tool>([
      // Data tools
      ['fetch-data', {
        name: 'fetch-data',
        description: 'Fetch data from external APIs',
        parameters: { url: 'string', method: 'string', headers: 'object' },
        execute: async (params, context) => {
          const response = await fetch(params.url, {
            method: params.method || 'GET',
            headers: params.headers || {},
            signal: abortController.current?.signal
          })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return await response.json()
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
            })
          }
          
          // Console log for debugging
          console.log(`[${params.type || 'info'}] ${params.message}`)
          
          return { sent: true, message: params.message }
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
          }
          
          // Simulate database delay
          await new Promise(resolve => setTimeout(resolve, 500))
          
          return mockData
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
          const { text, format } = params
          
          switch (format) {
            case 'uppercase':
              return text.toUpperCase()
            case 'lowercase':
              return text.toLowerCase()
            case 'title':
              return text.replace(/\w\S*/g, (txt: string) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
              )
            case 'markdown':
              return `**${text}**`
            default:
              return text
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
          ]
          
          // Simulate search delay
          await new Promise(resolve => setTimeout(resolve, 200))
          
          return {
            query: params.query,
            results: mockResults.slice(0, params.limit || 5),
            totalResults: mockResults.length
          }
        },
        category: 'data',
        cacheable: true,
        cacheTTL: 1800
      }]
    ])

    setState(prev => ({ ...prev, tools: builtInTools }))
  }, [])

  // Initialize context sources from config
  useEffect(() => {
    const sources = new Map<string, ContextSource>()
    
    // Parse context sources from config
    if (config.contextSources) {
      config.contextSources.forEach(sourceId => {
        const providerConfig = config.integrations?.contextProviders?.[sourceId]
        if (providerConfig) {
          sources.set(sourceId, {
            name: sourceId,
            type: sourceId as any,
            config: providerConfig,
            transformer: getDefaultTransformer(sourceId)
          })
        }
      })
    }

    setState(prev => ({ ...prev, contextSources: sources }))
  }, [config.contextSources, config.integrations?.contextProviders])

  // Cache management
  const getCachedResult = useCallback((key: string): any | null => {
    const entry = state.cache.get(key)
    if (!entry) return null

    // Check if cache entry is still valid
    const now = new Date()
    const age = (now.getTime() - entry.timestamp.getTime()) / 1000
    
    if (age > entry.ttl) {
      setState(prev => {
        const newCache = new Map(prev.cache)
        newCache.delete(key)
        return { ...prev, cache: newCache }
      })
      return null
    }

    return entry.data
  }, [state.cache])

  const setCachedResult = useCallback((key: string, data: any, ttl: number) => {
    setState(prev => {
      const newCache = new Map(prev.cache)
      newCache.set(key, {
        data,
        timestamp: new Date(),
        ttl
      })
      return { ...prev, cache: newCache }
    })
  }, [])

  // Register custom tool
  const registerTool = useCallback((tool: Tool) => {
    setState(prev => {
      const newTools = new Map(prev.tools)
      newTools.set(tool.name, tool)
      return { ...prev, tools: newTools }
    })
  }, [])

  // Unregister tool
  const unregisterTool = useCallback((toolName: string) => {
    setState(prev => {
      const newTools = new Map(prev.tools)
      newTools.delete(toolName)
      return { ...prev, tools: newTools }
    })
  }, [])

  // Execute tool
  const executeTool = useCallback(async (
    toolName: string, 
    parameters: any = {}, 
    context: any = {}
  ): Promise<ToolResult> => {
    const startTime = Date.now()
    
    try {
      setState(prev => ({ ...prev, isExecuting: true, lastError: null }))

      const tool = state.tools.get(toolName)
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found`)
      }

      // Check authentication if required
      if (tool.requiresAuth && !context.user?.authenticated) {
        throw new Error(`Tool '${toolName}' requires authentication`)
      }

      // Check cache if tool is cacheable
      let result: any
      const cacheKey = `${toolName}:${JSON.stringify(parameters)}`
      
      if (tool.cacheable && config.performance?.caching?.enabled) {
        const cachedResult = getCachedResult(cacheKey)
        if (cachedResult !== null) {
          result = cachedResult
        }
      }

      // Execute tool if not cached
      if (result === undefined) {
        // Create abort controller for this execution
        abortController.current = new AbortController()
        
        result = await tool.execute(parameters, context)
        
        // Cache result if tool is cacheable
        if (tool.cacheable && config.performance?.caching?.enabled) {
          setCachedResult(cacheKey, result, tool.cacheTTL || 300)
        }
      }

      const duration = Date.now() - startTime
      const toolResult: ToolResult = {
        success: true,
        data: result,
        timestamp: new Date(),
        duration
      }

      // Add to execution history
      setState(prev => ({
        ...prev,
        executionHistory: [toolResult, ...prev.executionHistory.slice(0, 99)], // Keep last 100
        isExecuting: false
      }))

      // Track analytics if enabled
      if (config.analytics?.trackActions) {
        console.log('Tool execution tracked:', {
          tool: toolName,
          success: true,
          duration,
          timestamp: new Date()
        })
      }

      return toolResult

    } catch (error) {
      const duration = Date.now() - startTime
      const toolResult: ToolResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration
      }

      setState(prev => ({
        ...prev,
        executionHistory: [toolResult, ...prev.executionHistory.slice(0, 99)],
        isExecuting: false,
        lastError: toolResult.error || 'Unknown error'
      }))

      console.error(`Tool execution failed [${toolName}]:`, error)
      return toolResult

    } finally {
      abortController.current = null
    }
  }, [state.tools, config.performance?.caching?.enabled, config.analytics?.trackActions, getCachedResult, setCachedResult])

  // Fetch from context source
  const fetchFromContextSource = useCallback(async (
    sourceName: string,
    query?: string
  ): Promise<any> => {
    const source = state.contextSources.get(sourceName)
    if (!source) {
      throw new Error(`Context source '${sourceName}' not found`)
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add authentication
      switch (source.config.authMethod) {
        case 'bearer':
          if (source.config.apiKey) {
            headers['Authorization'] = `Bearer ${source.config.apiKey}`
          }
          break
        case 'apikey':
          if (source.config.apiKey) {
            headers['X-API-Key'] = source.config.apiKey
          }
          break
      }

      const url = query 
        ? `${source.config.apiEndpoint}?q=${encodeURIComponent(query)}`
        : source.config.apiEndpoint

      const response = await fetch(url, {
        headers,
        signal: abortController.current?.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${sourceName}`)
      }

      let data = await response.json()

      // Apply transformer if configured
      if (source.transformer) {
        data = source.transformer(data)
      }

      return data

    } catch (error) {
      console.error(`Failed to fetch from context source ${sourceName}:`, error)
      throw error
    }
  }, [state.contextSources])

  // Clear cache
  const clearCache = useCallback(() => {
    setState(prev => ({ ...prev, cache: new Map() }))
  }, [])

  // Abort current execution
  const abortExecution = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
    }
  }, [])

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
    hasTool: (name: string) => state.tools.has(name),
    hasContextSource: (name: string) => state.contextSources.has(name)
  }
}

// Default transformers for common context sources
function getDefaultTransformer(sourceType: string) {
  switch (sourceType) {
    case 'notion':
      return (data: any) => ({
        pages: data.results?.map((page: any) => ({
          id: page.id,
          title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
          content: page.properties || {},
          lastModified: page.last_edited_time
        })) || []
      })

    case 'github':
      return (data: any) => ({
        repositories: data.items?.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count
        })) || []
      })

    case 'supabase':
      return (data: any) => ({
        rows: Array.isArray(data) ? data : [data],
        count: Array.isArray(data) ? data.length : 1
      })

    default:
      return (data: any) => data
  }
} 