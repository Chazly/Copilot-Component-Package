// Base provider interface and types
export interface ProviderCapabilities {
  supportsStreaming: boolean
  maxContextLength: number
  supportsFunctions: boolean
  supportsEmbeddings: boolean
  supportsBatching: boolean
}

export interface ProviderConfig {
  modelProvider: string
  model?: string
  apiKey?: string
  baseURL?: string
  
  // On-premises specific configuration
  localConfig?: {
    endpoint?: string
    port?: number
    protocol?: 'http' | 'https'
    authentication?: {
      type: 'none' | 'bearer' | 'apikey' | 'oauth' | 'mtls'
      credentials?: any
    }
    timeout?: number
    retryAttempts?: number
    healthCheck?: {
      enabled: boolean
      interval: number
      endpoint?: string
    }
  }
  
  // Enterprise features
  enterpriseConfig?: {
    loadBalancing?: 'round-robin' | 'least-connections' | 'health-based'
    failover?: {
      enabled: boolean
      fallbackProviders: string[]
    }
    monitoring?: {
      metricsEndpoint?: string
      alertingWebhook?: string
    }
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface ChatResponse {
  content: string
  finishReason?: 'stop' | 'length' | 'error'
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  metadata?: Record<string, any>
}

export interface StreamChunk {
  content: string
  isComplete: boolean
  usage?: ChatResponse['usage']
  raw?: any
}

export abstract class BaseProvider {
  protected config: ProviderConfig
  protected isAuthenticated: boolean = false
  
  constructor(config: ProviderConfig) {
    this.config = config
  }
  
  // Abstract methods that must be implemented
  abstract get name(): string
  abstract get capabilities(): ProviderCapabilities
  abstract authenticate(): Promise<boolean>
  abstract sendMessage(
    messages: ChatMessage[], 
    systemPrompt?: string,
    tools?: any[]
  ): Promise<ChatResponse>
  abstract sendMessageStream(
    messages: ChatMessage[], 
    onChunk: (chunk: StreamChunk) => void,
    systemPrompt?: string,
    tools?: any[]
  ): Promise<void>
  abstract validateConfig(): boolean
  abstract checkHealth(): Promise<boolean>
  
  // Common utility methods
  protected async makeRequest(
    endpoint: string, 
    options: RequestInit
  ): Promise<Response> {
    const timeout = this.config.localConfig?.timeout || 30000
    const retryAttempts = this.config.localConfig?.retryAttempts || 3
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await fetch(endpoint, {
          ...options,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          return response
        }
        
        if (attempt === retryAttempts) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000)
        
      } catch (error) {
        if (attempt === retryAttempts) {
          throw error
        }
        await this.delay(Math.pow(2, attempt) * 1000)
      }
    }
    
    throw new Error('Max retry attempts exceeded')
  }
  
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  protected buildEndpoint(path: string): string {
    let baseURL = this.config.baseURL || this.config.localConfig?.endpoint || 'localhost'
    // Enforce proxy in browser contexts for OpenAI
    try {
      const isBrowser = typeof window !== 'undefined'
      if (isBrowser && /api\.openai\.com/.test(String(baseURL))) {
        // Next.js recommended proxy path
        baseURL = '/api/openai'
      }
    } catch {}
    const port = this.config.localConfig?.port
    
    let url: string
    
    // Check if baseURL already contains a protocol (like https://api.openai.com)
    if (baseURL.includes('://')) {
      // baseURL is a full URL with protocol
      url = baseURL
    } else {
      // baseURL is just a hostname, add protocol
      const protocol = this.config.localConfig?.protocol || 'http'
      url = `${protocol}://${baseURL}`
      
      // Add port only for hostname-only baseURLs
    if (port) {
      url += `:${port}`
    }
    }
    
    url += path
    return url
  }
  
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    const authConfig = this.config.localConfig?.authentication
    
    if (authConfig?.type === 'bearer' && authConfig.credentials) {
      headers['Authorization'] = `Bearer ${authConfig.credentials}`
    } else if (authConfig?.type === 'apikey' && this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    } else if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }
    
    return headers
  }
  
  // Health check with circuit breaker pattern
  private lastHealthCheck: number = 0
  private healthCheckInterval: number = 30000 // 30 seconds
  private isHealthy: boolean = true
  
  async performHealthCheck(): Promise<boolean> {
    const now = Date.now()
    const interval = this.config.localConfig?.healthCheck?.interval || this.healthCheckInterval
    
    if (now - this.lastHealthCheck < interval) {
      return this.isHealthy
    }
    
    try {
      this.isHealthy = await this.checkHealth()
      this.lastHealthCheck = now
      return this.isHealthy
    } catch (error) {
      this.isHealthy = false
      this.lastHealthCheck = now
      return false
    }
  }
  
  // Provider metrics
  protected metrics = {
    requestCount: 0,
    errorCount: 0,
    totalLatency: 0,
    averageLatency: 0
  }
  
  protected recordMetrics(latency: number, isError: boolean = false) {
    this.metrics.requestCount++
    this.metrics.totalLatency += latency
    this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.requestCount
    
    if (isError) {
      this.metrics.errorCount++
    }
  }
  
  getMetrics() {
    return { ...this.metrics }
  }
}

// Provider registration and discovery
export interface ProviderRegistration {
  name: string
  factory: (config: ProviderConfig) => BaseProvider
  isAvailable: () => Promise<boolean>
  defaultConfig?: Partial<ProviderConfig>
}

export class ProviderRegistry {
  private static providers: Map<string, ProviderRegistration> = new Map()
  
  static register(registration: ProviderRegistration) {
    this.providers.set(registration.name, registration)
  }
  
  static getProvider(name: string): ProviderRegistration | undefined {
    return this.providers.get(name)
  }
  
  static getAllProviders(): ProviderRegistration[] {
    return Array.from(this.providers.values())
  }
  
  static async discoverAvailableProviders(): Promise<string[]> {
    const available: string[] = []
    const entries = Array.from(this.providers.entries())
    
    for (let i = 0; i < entries.length; i++) {
      const [name, registration] = entries[i]
      try {
        if (await registration.isAvailable()) {
          available.push(name)
        }
      } catch (error) {
        // Provider not available, skip
      }
    }
    
    return available
  }
}

export default BaseProvider 