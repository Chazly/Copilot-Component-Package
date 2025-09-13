import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  BaseProvider, 
  ProviderConfig, 
  ProviderRegistry,
  ChatMessage,
  ChatResponse,
  StreamChunk
} from '../services/BaseProvider'
import { AICopilotConfig, NormalizedCopilotConfig } from '../types'
import { getApiKey, getApiKeyWithConfig } from '../lib/env'

// Import and register providers
import '../services/OllamaProvider'
import '../services/CustomProvider'
import '../providers/openai'

export interface ProviderStatus {
  name: string
  isAvailable: boolean
  isHealthy: boolean
  lastChecked: Date
  error?: string
  metrics?: {
    requestCount: number
    errorCount: number
    averageLatency: number
  }
}

export interface ProviderFactoryState {
  currentProvider: BaseProvider | null
  availableProviders: string[]
  providerStatuses: Record<string, ProviderStatus>
  isLoading: boolean
  error: string | null
}

// Convert copilot config to provider config
function configToProviderConfig(config: NormalizedCopilotConfig): ProviderConfig {
  const providerConfig: ProviderConfig = {
    modelProvider: config.modelProvider,
    model: config.model,
    apiKey: undefined, // Will be set based on provider type
    baseURL: undefined // Will be set based on provider type
  }

  // Handle provider-specific configurations
  if (config.modelProvider === 'openai') {
    // OpenAI configuration - use unified environment detection that checks config first
    try {
      const envConfig = config.metadata?.environmentConfig
      providerConfig.apiKey = getApiKeyWithConfig(envConfig)
    } catch (error) {
      console.error('Failed to get OpenAI API key:', error)
      providerConfig.apiKey = undefined
    }
    providerConfig.baseURL = 'https://api.openai.com'
    
    // Only enable fallback for OpenAI if explicitly configured
    if (config.performance && config.integrations?.contextProviders?.['ai-endpoint']) {
      providerConfig.enterpriseConfig = {
        loadBalancing: 'health-based',
        failover: {
          enabled: true,
          fallbackProviders: ['ollama'] // Only if custom endpoint is configured
        },
        monitoring: {
          metricsEndpoint: config.integrations?.webhooks?.onMessageSent
        }
      }
    }
    
  } else if (config.modelProvider === 'ollama') {
    // Ollama configuration
    providerConfig.localConfig = {
      endpoint: 'localhost',
      port: 11434,
      protocol: 'http',
      timeout: 60000,
      retryAttempts: 2
    }
    
  } else if (config.modelProvider.startsWith('custom:')) {
    // Custom provider configuration
    providerConfig.localConfig = {
      endpoint: config.integrations?.contextProviders?.['ai-endpoint']?.apiEndpoint || 'localhost',
      protocol: 'https',
      timeout: 30000,
      retryAttempts: 3,
      authentication: {
        type: config.integrations?.contextProviders?.['ai-endpoint']?.authMethod as any || 'none'
    }
  }

    // Enable enterprise config for custom providers with fallback
  if (config.performance) {
    providerConfig.enterpriseConfig = {
      loadBalancing: 'health-based',
      failover: {
        enabled: true,
          fallbackProviders: ['ollama']
      },
      monitoring: {
        metricsEndpoint: config.integrations?.webhooks?.onMessageSent
        }
      }
    }
  }

  return providerConfig
}



export function useModelProvider(config: NormalizedCopilotConfig) {
  const [state, setState] = useState<ProviderFactoryState>({
    currentProvider: null,
    availableProviders: [],
    providerStatuses: {},
    isLoading: true,
    error: null
  })

  // Memoize provider config to avoid unnecessary recreations
  const providerConfig = useMemo(() => configToProviderConfig(config), [config])

  // Initialize providers and check availability
  const initializeProviders = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Discover available providers
      const available = await ProviderRegistry.discoverAvailableProviders()
      
      // Update provider statuses
      const statuses: Record<string, ProviderStatus> = {}
      const registrations = ProviderRegistry.getAllProviders()
      
      for (const registration of registrations) {
        const isAvailable = available.indexOf(registration.name) !== -1
        statuses[registration.name] = {
          name: registration.name,
          isAvailable,
          isHealthy: false,
          lastChecked: new Date(),
          error: isAvailable ? undefined : 'Provider not available'
        }
      }

      setState(prev => ({
        ...prev,
        availableProviders: available,
        providerStatuses: statuses,
        isLoading: false
      }))

      // Try to create the requested provider
      await createProvider(config.modelProvider)

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error)
      }))
    }
  }, [config.modelProvider])

  // Create a specific provider instance
  const createProvider = useCallback(async (providerName: string): Promise<BaseProvider | null> => {
    try {
      const registration = ProviderRegistry.getProvider(providerName)
      if (!registration) {
        throw new Error(`Unknown provider: ${providerName}`)
      }

      // Create provider instance
      const provider = registration.factory(providerConfig)
      
      // Validate configuration
      if (!provider.validateConfig()) {
        throw new Error(`Invalid configuration for provider: ${providerName}`)
      }

      // Authenticate and health check
      const isAuthenticated = await provider.authenticate()
      if (!isAuthenticated) {
        throw new Error(`Authentication failed for provider: ${providerName}`)
      }

      const isHealthy = await provider.performHealthCheck()
      
      // Update provider status
      setState(prev => ({
        ...prev,
        currentProvider: provider,
        providerStatuses: {
          ...prev.providerStatuses,
          [providerName]: {
            ...prev.providerStatuses[providerName],
            isHealthy,
            lastChecked: new Date(),
            error: isHealthy ? undefined : 'Health check failed',
            metrics: provider.getMetrics()
          }
        },
        error: null
      }))

      return provider

    } catch (error) {
      // Update status with error
      setState(prev => ({
        ...prev,
        providerStatuses: {
          ...prev.providerStatuses,
          [providerName]: {
            ...prev.providerStatuses[providerName],
            isHealthy: false,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : String(error)
          }
        },
        error: error instanceof Error ? error.message : String(error)
      }))

      // Try fallback providers
      if (providerConfig.enterpriseConfig?.failover?.enabled) {
        const fallbackProviders = providerConfig.enterpriseConfig.failover.fallbackProviders
        for (const fallbackName of fallbackProviders) {
          if (fallbackName !== providerName) {
            console.warn(`Trying fallback provider: ${fallbackName}`)
            const fallbackProvider = await createProvider(fallbackName)
            if (fallbackProvider) {
              return fallbackProvider
            }
          }
        }
      }

      return null
    }
  }, [providerConfig])

  // Switch to a different provider
  const switchProvider = useCallback(async (providerName: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    const provider = await createProvider(providerName)
    
    setState(prev => ({ ...prev, isLoading: false }))
    
    return provider !== null
  }, [createProvider])

  // Refresh provider health status
  const refreshProviderHealth = useCallback(async () => {
    if (!state.currentProvider) return

    try {
      const isHealthy = await state.currentProvider.performHealthCheck()
      const providerName = state.currentProvider.name
      
      setState(prev => ({
        ...prev,
        providerStatuses: {
          ...prev.providerStatuses,
          [providerName]: {
            ...prev.providerStatuses[providerName],
            isHealthy,
            lastChecked: new Date(),
            error: isHealthy ? undefined : 'Health check failed',
            metrics: state.currentProvider?.getMetrics()
          }
        }
      }))

      // If current provider is unhealthy, try to switch to fallback
      if (!isHealthy && providerConfig.enterpriseConfig?.failover?.enabled) {
        const fallbackProviders = providerConfig.enterpriseConfig.failover.fallbackProviders
        for (const fallbackName of fallbackProviders) {
          if (fallbackName !== providerName) {
            const switched = await switchProvider(fallbackName)
            if (switched) {
              console.warn(`Switched to fallback provider: ${fallbackName}`)
              break
            }
          }
        }
      }

    } catch (error) {
      console.error('Health check failed:', error)
    }
  }, [state.currentProvider, providerConfig, switchProvider])

  // Initialize on mount and when config changes
  useEffect(() => {
    initializeProviders()
  }, [initializeProviders])

  // Periodic health checks
  useEffect(() => {
    if (!state.currentProvider) return

    const interval = setInterval(refreshProviderHealth, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [state.currentProvider, refreshProviderHealth])

  // Provider wrapper methods
  const sendMessage = useCallback(async (
    messages: ChatMessage[],
    systemPrompt?: string,
    tools?: any[],
    toolChoice?: any,
    debug?: boolean
  ): Promise<ChatResponse> => {
    if (!state.currentProvider) {
      throw new Error('No provider available')
    }

    try {
      // Merge precedence: chat-level tools > provider-level tools
      const providerTools = (config as any)?.tools || []
      const chatTools = tools || []
      const mergedTools = (() => {
        if (chatTools.length && providerTools.length) return [...chatTools, ...providerTools]
        if (chatTools.length) return chatTools
        if (providerTools.length) return providerTools
        return []
      })()
      const origin = chatTools.length && providerTools.length ? 'merged' : (chatTools.length ? 'chat' : (providerTools.length ? 'provider' : 'none'))
      try { console.log(`[Tools][resolved] { origin: '${origin}', count:${mergedTools.length} }`) } catch {}

      // pass through optional args when provider supports them (CustomProvider accepts and ignores extras)
      return await (state.currentProvider as any).sendMessage(messages, systemPrompt, mergedTools, toolChoice, debug)
    } catch (error) {
      // Refresh health status and potentially switch providers
      await refreshProviderHealth()
      throw error
    }
  }, [state.currentProvider, refreshProviderHealth])

  const sendMessageStream = useCallback(async (
    messages: ChatMessage[],
    onChunk: (chunk: StreamChunk) => void,
    systemPrompt?: string,
    tools?: any[],
    toolChoice?: any,
    debug?: boolean
  ): Promise<void> => {
    if (!state.currentProvider) {
      throw new Error('No provider available')
    }

    try {
      const providerTools = (config as any)?.tools || []
      const chatTools = tools || []
      const mergedTools = (() => {
        if (chatTools.length && providerTools.length) return [...chatTools, ...providerTools]
        if (chatTools.length) return chatTools
        if (providerTools.length) return providerTools
        return []
      })()
      const origin = chatTools.length && providerTools.length ? 'merged' : (chatTools.length ? 'chat' : (providerTools.length ? 'provider' : 'none'))
      try { console.log(`[Tools][resolved] { origin: '${origin}', count:${mergedTools.length} }`) } catch {}
      return await (state.currentProvider as any).sendMessageStream(messages, onChunk, systemPrompt, mergedTools, toolChoice, debug)
    } catch (error) {
      // Refresh health status and potentially switch providers
      await refreshProviderHealth()
      throw error
    }
  }, [state.currentProvider, refreshProviderHealth])

  return {
    // State
    ...state,
    
    // Actions
    initializeProviders,
    switchProvider,
    refreshProviderHealth,
    
    // Provider methods
    sendMessage,
    sendMessageStream,
    
    // Utility
    isReady: state.currentProvider !== null && !state.isLoading,
    capabilities: state.currentProvider?.capabilities,
    metrics: state.currentProvider?.getMetrics()
  }
}

export default useModelProvider 