import { 
  BaseProvider, 
  ProviderConfig, 
  ProviderCapabilities, 
  ChatMessage, 
  ChatResponse, 
  StreamChunk,
  ProviderRegistry
} from './BaseProvider'

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export class OllamaProvider extends BaseProvider {
  private availableModels: OllamaModel[] = []
  private currentModel: string
  
  constructor(config: ProviderConfig) {
    super(config)
    this.currentModel = config.model || 'llama2'
    
    // Set default Ollama configuration
    if (!config.localConfig?.endpoint) {
      config.localConfig = {
        ...config.localConfig,
        endpoint: 'localhost',
        port: 11434,
        protocol: 'http'
      }
    }
  }
  
  get name(): string {
    return 'ollama'
  }
  
  get capabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true,
      maxContextLength: 4096, // Varies by model
      supportsFunctions: false,
      supportsEmbeddings: true,
      supportsBatching: false
    }
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const isHealthy = await this.checkHealth()
      if (isHealthy) {
        await this.loadAvailableModels()
        this.isAuthenticated = true
      }
      return isHealthy
    } catch (error) {
      this.isAuthenticated = false
      return false
    }
  }
  
  validateConfig(): boolean {
    return !!(this.config.localConfig?.endpoint || this.config.baseURL)
  }
  
  async checkHealth(): Promise<boolean> {
    try {
      const endpoint = this.buildEndpoint('/api/tags')
      const response = await this.makeRequest(endpoint, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })
      
      return response.status === 200
    } catch (error) {
      return false
    }
  }
  
  async loadAvailableModels(): Promise<OllamaModel[]> {
    try {
      const endpoint = this.buildEndpoint('/api/tags')
      const response = await this.makeRequest(endpoint, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })
      
      const data = await response.json()
      this.availableModels = data.models || []
      return this.availableModels
    } catch (error) {
      console.error('Failed to load Ollama models:', error)
      return []
    }
  }
  
  async pullModel(modelName: string): Promise<boolean> {
    try {
      const endpoint = this.buildEndpoint('/api/pull')
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name: modelName })
      })
      
      return response.ok
    } catch (error) {
      console.error('Failed to pull model:', error)
      return false
    }
  }
  
  async sendMessage(
    messages: ChatMessage[], 
    systemPrompt?: string
  ): Promise<ChatResponse> {
    const startTime = Date.now()
    
    try {
      const endpoint = this.buildEndpoint('/api/generate')
      
      // Convert messages to Ollama format
      const prompt = this.formatMessagesForOllama(messages, systemPrompt)
      
      const requestBody = {
        model: this.currentModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7
        }
      }
      
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      })
      
      const data: OllamaResponse = await response.json()
      
      const latency = Date.now() - startTime
      this.recordMetrics(latency, false)
      
      return {
        content: data.response,
        finishReason: data.done ? 'stop' : 'length',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        },
        metadata: {
          model: data.model,
          totalDuration: data.total_duration,
          loadDuration: data.load_duration
        }
      }
      
    } catch (error) {
      const latency = Date.now() - startTime
      this.recordMetrics(latency, true)
      
      throw new Error(`Ollama request failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  async sendMessageStream(
    messages: ChatMessage[], 
    onChunk: (chunk: StreamChunk) => void,
    systemPrompt?: string
  ): Promise<void> {
    const startTime = Date.now()
    
    try {
      const endpoint = this.buildEndpoint('/api/generate')
      
      const prompt = this.formatMessagesForOllama(messages, systemPrompt)
      
      const requestBody = {
        model: this.currentModel,
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0.7
        }
      }
      
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        headers: this.getAuthHeaders(),
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
              const data: OllamaResponse = JSON.parse(line)
              
              onChunk({
                content: data.response,
                isComplete: data.done,
                usage: data.done ? {
                  promptTokens: data.prompt_eval_count || 0,
                  completionTokens: data.eval_count || 0,
                  totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                } : undefined
              })
              
              if (data.done) {
                const latency = Date.now() - startTime
                this.recordMetrics(latency, false)
                return
              }
              
            } catch (parseError) {
              // Skip invalid JSON lines
              continue
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
      
    } catch (error) {
      const latency = Date.now() - startTime
      this.recordMetrics(latency, true)
      
      throw new Error(`Ollama streaming failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  private formatMessagesForOllama(messages: ChatMessage[], systemPrompt?: string): string {
    let prompt = ''
    
    if (systemPrompt) {
      prompt += `System: ${systemPrompt}\n\n`
    }
    
    for (const message of messages) {
      if (message.role === 'user') {
        prompt += `Human: ${message.content}\n\n`
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`
      }
    }
    
    prompt += 'Assistant: '
    return prompt
  }
  
  // Ollama-specific methods
  async switchModel(modelName: string): Promise<boolean> {
    if (!this.availableModels.some(m => m.name === modelName)) {
      // Try to pull the model if it's not available
      const pulled = await this.pullModel(modelName)
      if (!pulled) {
        return false
      }
      await this.loadAvailableModels()
    }
    
    this.currentModel = modelName
    return true
  }
  
  getAvailableModels(): OllamaModel[] {
    return this.availableModels
  }
  
  getCurrentModel(): string {
    return this.currentModel
  }
}

// Register Ollama provider
ProviderRegistry.register({
  name: 'ollama',
  factory: (config: ProviderConfig) => new OllamaProvider(config),
  isAvailable: async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      return response.ok
    } catch {
      return false
    }
  },
  defaultConfig: {
    localConfig: {
      endpoint: 'localhost',
      port: 11434,
      protocol: 'http',
      timeout: 60000, // Ollama can be slow for large models
      retryAttempts: 2
    }
  }
})

export default OllamaProvider 