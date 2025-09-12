import { 
  BaseProvider, 
  ProviderConfig, 
  ProviderCapabilities, 
  ChatMessage, 
  ChatResponse, 
  StreamChunk,
  ProviderRegistry
} from './BaseProvider'

export interface CustomProviderConfig extends ProviderConfig {
  customConfig?: {
    requestTransformer?: (messages: ChatMessage[], systemPrompt?: string, stream?: boolean, tools?: any[]) => any
    responseTransformer?: (response: any) => ChatResponse
    streamTransformer?: (chunk: any) => StreamChunk | null
    headers?: Record<string, string>
    pathTemplate?: string // e.g., "/v1/chat/completions"
    method?: 'POST' | 'GET' | 'PUT'
    authHeaderName?: string // Custom auth header name
    proxy?: {
      host: string
      port: number
      auth?: { username: string; password: string }
    }
  }
}

export class CustomProvider extends BaseProvider {
  private customConfig: NonNullable<CustomProviderConfig['customConfig']>
  
  constructor(config: CustomProviderConfig) {
    super(config)
    
    // Set default custom configuration
    this.customConfig = {
      pathTemplate: '/v1/chat/completions',
      method: 'POST',
      authHeaderName: 'Authorization',
      headers: {},
      ...config.customConfig
    }
  }
  
  get name(): string {
    return `custom:${this.config.modelProvider.replace('custom:', '')}`
  }
  
  get capabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true, // Assume streaming unless configured otherwise
      maxContextLength: 8192, // Default, should be configured per provider
      supportsFunctions: false,
      supportsEmbeddings: false,
      supportsBatching: false
    }
  }
  
  async authenticate(): Promise<boolean> {
    try {
      // For custom providers, authentication is validated by making a test request
      const isHealthy = await this.checkHealth()
      this.isAuthenticated = isHealthy
      return isHealthy
    } catch (error) {
      this.isAuthenticated = false
      return false
    }
  }
  
  validateConfig(): boolean {
    const hasEndpoint = !!(this.config.baseURL || this.config.localConfig?.endpoint)
    const hasPath = !!this.customConfig.pathTemplate
    return hasEndpoint && hasPath
  }
  
  async checkHealth(): Promise<boolean> {
    try {
      // Skip health check for OpenAI (api.openai.com doesn't have /health endpoint)
      if (this.config.baseURL?.includes('api.openai.com')) {
        return true // Assume healthy if we can reach this point
      }
      
      // Use custom health check endpoint if provided
      const healthPath = this.config.localConfig?.healthCheck?.endpoint || '/health'
      const endpoint = this.buildEndpoint(healthPath)
      
      const response = await this.makeRequest(endpoint, {
        method: 'GET',
        headers: this.buildHeaders()
      })
      
      return response.status >= 200 && response.status < 300
    } catch (error) {
      // If health endpoint fails, try the main endpoint with minimal request
      try {
        const mainEndpoint = this.buildEndpoint(this.customConfig.pathTemplate!)
        const response = await this.makeRequest(mainEndpoint, {
          method: 'OPTIONS', // Non-intrusive method
          headers: this.buildHeaders()
        })
        
        return response.status !== 404 // If it's not 404, the endpoint exists
      } catch {
        return false
      }
    }
  }
  
  async sendMessage(
    messages: ChatMessage[], 
    systemPrompt?: string,
    tools?: any[]
  ): Promise<ChatResponse> {
    const startTime = Date.now()
    
    try {
      const endpoint = this.buildEndpoint(this.customConfig.pathTemplate!)
      
      // Transform the request using custom transformer or default
      const requestBody = this.customConfig.requestTransformer 
        ? this.customConfig.requestTransformer(messages, systemPrompt, false, tools)
        : this.defaultRequestTransform(messages, systemPrompt, false, tools)
      
      const response = await this.makeRequest(endpoint, {
        method: this.customConfig.method || 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      
      // Transform the response using custom transformer or default
      const chatResponse = this.customConfig.responseTransformer
        ? this.customConfig.responseTransformer(data)
        : this.defaultResponseTransform(data)
      
      const latency = Date.now() - startTime
      this.recordMetrics(latency, false)
      
      return chatResponse
      
    } catch (error) {
      const latency = Date.now() - startTime
      this.recordMetrics(latency, true)
      
      throw new Error(`Custom provider request failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  async sendMessageStream(
    messages: ChatMessage[], 
    onChunk: (chunk: StreamChunk) => void,
    systemPrompt?: string,
    tools?: any[]
  ): Promise<void> {
    const startTime = Date.now()
    
    try {
      const endpoint = this.buildEndpoint(this.customConfig.pathTemplate!)
      
      const requestBody = this.customConfig.requestTransformer 
        ? this.customConfig.requestTransformer(messages, systemPrompt, true, tools)
        : this.defaultRequestTransform(messages, systemPrompt, true, tools)
      
      const response = await this.makeRequest(endpoint, {
        method: this.customConfig.method || 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(requestBody)
      })
      
      if (!response.body) {
        throw new Error('No response body for streaming')
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            break
          }
          
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              // Handle Server-Sent Events format
              const dataLine = line.startsWith('data: ') ? line.slice(6) : line
              
              if (dataLine.trim() === '[DONE]') {
                const latency = Date.now() - startTime
                this.recordMetrics(latency, false)
                return
              }
              
              const data = JSON.parse(dataLine)
              
              // Transform chunk using custom transformer or default
              const streamChunk = this.customConfig.streamTransformer
                ? this.customConfig.streamTransformer(data)
                : this.defaultStreamTransform(data)
              
              if (streamChunk) {
                onChunk(streamChunk)
                
                if (streamChunk.isComplete) {
                  const latency = Date.now() - startTime
                  this.recordMetrics(latency, false)
                  return
                }
              }
            } catch (parseError) {
              // Continue processing other lines if one fails to parse
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
      
    } catch (error) {
      const latency = Date.now() - startTime
      this.recordMetrics(latency, true)
      
      throw new Error(`Custom provider streaming failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...this.customConfig.headers
    }
    
    // Handle custom authentication header name
    if (this.customConfig.authHeaderName && this.config.apiKey) {
      delete headers['Authorization']
      // Properly format the Bearer token
      const authValue = this.config.apiKey.startsWith('Bearer ') 
        ? this.config.apiKey 
        : `Bearer ${this.config.apiKey}`
      headers[this.customConfig.authHeaderName] = authValue
    }
    
    return headers
  }
  
  // Default transformers for common API formats
  private defaultRequestTransform(
    messages: ChatMessage[], 
    systemPrompt?: string,
    stream: boolean = false,
    tools?: any[]
  ): any {
    const requestMessages = []
    
    if (systemPrompt) {
      requestMessages.push({
        role: 'system',
        content: systemPrompt
      })
    }
    
    requestMessages.push(...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })))
    
    return {
      model: this.config.model || 'default',
      messages: requestMessages,
      stream: stream,
      temperature: 0.7,
      max_tokens: 2048,
      tools: tools && tools.length ? tools : undefined
    }
  }
  
  private defaultResponseTransform(data: any): ChatResponse {
    // Handle OpenAI-compatible format
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0]
      return {
        content: choice.message?.content || choice.text || '',
        finishReason: choice.finish_reason || 'stop',
        usage: data.usage || undefined
      }
    }
    
    // Handle simple response format
    if (typeof data.response === 'string') {
      return {
        content: data.response,
        finishReason: 'stop'
      }
    }
    
    // Fallback
    return {
      content: String(data),
      finishReason: 'stop'
    }
  }
  
  private defaultStreamTransform(data: any): StreamChunk | null {
    // Handle OpenAI-compatible streaming format
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0]
      const delta = choice.delta || choice.message || {}
      
      return {
        content: delta.content || '',
        isComplete: choice.finish_reason !== null && choice.finish_reason !== undefined,
        usage: data.usage || undefined
      }
    }
    
    // Handle simple streaming format
    if (typeof data.response === 'string') {
      return {
        content: data.response,
        isComplete: data.done || false
      }
    }
    
    return null
  }
  
  // Configuration helpers
  setRequestTransformer(transformer: (messages: ChatMessage[], systemPrompt?: string) => any) {
    this.customConfig.requestTransformer = transformer
  }
  
  setResponseTransformer(transformer: (response: any) => ChatResponse) {
    this.customConfig.responseTransformer = transformer
  }
  
  setStreamTransformer(transformer: (chunk: any) => StreamChunk | null) {
    this.customConfig.streamTransformer = transformer
  }
  
  addCustomHeader(name: string, value: string) {
    this.customConfig.headers = this.customConfig.headers || {}
    this.customConfig.headers[name] = value
  }
}

// Factory function for easy custom provider creation
export function createCustomProvider(
  name: string,
  config: CustomProviderConfig
): void {
  ProviderRegistry.register({
    name: `custom:${name}`,
    factory: (providerConfig: ProviderConfig) => new CustomProvider({
      ...providerConfig,
      ...config
    }),
    isAvailable: async () => {
      try {
        const provider = new CustomProvider(config)
        return await provider.checkHealth()
      } catch {
        return false
      }
    },
    defaultConfig: config
  })
}

// Register the base custom provider
ProviderRegistry.register({
  name: 'custom',
  factory: (config: ProviderConfig) => new CustomProvider(config as CustomProviderConfig),
  isAvailable: async () => true, // Always available, validation happens at runtime
  defaultConfig: {
    customConfig: {
      pathTemplate: '/v1/chat/completions',
      method: 'POST',
      authHeaderName: 'Authorization'
    }
  } as CustomProviderConfig
})

export default CustomProvider 