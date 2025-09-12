import { CustomProvider } from '../services/CustomProvider'
import { ProviderRegistry } from '../services/BaseProvider'

// Commit/version identifier for runtime diagnostics
const COPILOT_COMMIT = '3fea60c'

// Shared sanitizer to ensure OpenAI-safe tool names
const sanitizeToolName = (value: string) => String(value).toString().slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_')

// OpenAI model configurations
export const OPENAI_MODELS = {
  'gpt-4o-latest': { name: 'gpt-4o-latest', contextWindow: 128000, description: 'Latest GPT-4 Omni model' },
  'gpt-4o-mini': { name: 'gpt-4o-mini', contextWindow: 128000, description: 'Lightweight GPT-4 Omni model' },
  'gpt-4-turbo': { name: 'gpt-4-turbo', contextWindow: 128000, description: 'GPT-4 Turbo model' },
  'gpt-4': { name: 'gpt-4', contextWindow: 8192, description: 'GPT-4 base model' },
  'gpt-3.5-turbo': { name: 'gpt-3.5-turbo', contextWindow: 16384, description: 'GPT-3.5 Turbo model' },
  'o1-preview': { name: 'o1-preview', contextWindow: 128000, description: 'O1 reasoning model preview' },
  'o1-mini': { name: 'o1-mini', contextWindow: 128000, description: 'O1 mini reasoning model' }
} as const

// Helper function to create OpenAI configurations
export const createOpenAIConfig = (options: {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
} = {}) => {
  const getEnvVar = (key: string): string | undefined => {
    if (typeof window !== 'undefined') {
      // Browser environment - try both Vite and Next.js patterns
      const viteKey = `VITE_${key}`
      const nextKey = `NEXT_PUBLIC_${key}`
      return (import.meta as any).env?.[viteKey] || 
             (window as any).process?.env?.[nextKey] ||
             (window as any).process?.env?.[key] ||
             (import.meta as any).env?.[key]
    }
    return (process.env as any)[key]
  }

  return {
  modelProvider: 'openai',
    model: options.model || getEnvVar('OPENAI_DEFAULT_MODEL') || getEnvVar('VITE_OPENAI_DEFAULT_MODEL') || 'gpt-4o-latest',
    apiKey: options.apiKey || getEnvVar('OPENAI_API_KEY') || getEnvVar('VITE_OPENAI_API_KEY'),
    baseURL: options.baseURL || 'https://api.openai.com',
  customConfig: {
    pathTemplate: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
      requestTransformer: (messages: any[], systemPrompt?: string, stream = false, tools?: any[], toolChoice?: any, _debug?: boolean) => {
        const systemMessage = systemPrompt ? [{ role: 'system', content: systemPrompt }] : []
        const mapTools = (t?: any[]) => {
          if (!t || !Array.isArray(t) || t.length === 0) return undefined
          try {
            return t.map((tool: any) => ({
              type: 'function',
              function: {
                name: sanitizeToolName(tool.id || tool.name || 'tool'),
                description: tool.description || '',
                parameters: tool.inputSchema || { type: 'object', properties: {} }
              }
            }))
          } catch {
            return undefined
          }
        }

        const modelId = options.model || getEnvVar('OPENAI_DEFAULT_MODEL') || getEnvVar('VITE_OPENAI_DEFAULT_MODEL') || 'gpt-4o-latest'
        const path = '/v1/chat/completions'
        const payload: any = {
          model: modelId,
          messages: [...systemMessage, ...messages],
          stream,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          tools: mapTools(tools)
        }
        if (toolChoice) payload.tool_choice = toolChoice
        try {
          console.log(`[OpenAI][requestTransformer] { tools:[${(payload.tools || []).map((t: any) => t.function?.name).join(',')}], tool_choice:${JSON.stringify(payload.tool_choice) || 'undefined'}, stream:${Boolean(stream)}, model:${modelId}, path:chat }`)
          console.log(`[CopilotPackage] version: ${COPILOT_COMMIT}`)
        } catch {}
        return payload
      },
      responseTransformer: (response: any) => {
        if (response.choices?.[0]?.message?.content) {
          const msg = response.choices[0].message
          const toolCalls = (msg.tool_calls || []).map((tc: any) => ({
            id: tc.id,
            name: tc.function?.name,
            arguments: (() => { try { return JSON.parse(tc.function?.arguments || '{}') } catch { return {} } })()
          }))
          return {
            content: msg.content,
            finishReason: response.choices[0].finish_reason,
            usage: response.usage,
            metadata: toolCalls.length ? { toolCalls } : undefined
          }
        }
        throw new Error('Invalid OpenAI response format')
      },
      streamTransformer: (data: any) => {
      if (data.choices?.[0]?.delta?.content) {
        return {
          content: data.choices[0].delta.content,
            isComplete: data.choices[0].finish_reason !== null && data.choices[0].finish_reason !== undefined
        }
      }
      if (data.choices?.[0]?.delta?.tool_calls) {
        return { content: '', isComplete: false, raw: data }
      }
        
        if (data.choices?.[0]?.message?.content) {
          return {
            content: data.choices[0].message.content,
            isComplete: true
          }
        }
        
        if (data.choices?.[0]?.finish_reason) {
          return {
            content: '',
            isComplete: true
          }
        }
        
        return null
    }
  }
  }
}

// Register OpenAI provider
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  const getEnvVar = (key: string): string | undefined => {
    if (typeof window !== 'undefined') {
      // Browser environment - try both Vite and Next.js patterns
      const viteKey = `VITE_${key}`
      const nextKey = `NEXT_PUBLIC_${key}`
      return (import.meta as any).env?.[viteKey] || 
             (window as any).process?.env?.[nextKey] ||
             (window as any).process?.env?.[key] ||
             (import.meta as any).env?.[key]
    }
    return (process.env as any)[key]
  }

  ProviderRegistry.register({
    name: 'openai',
    factory: (config) => {
      return new CustomProvider({
        ...config,
        customConfig: {
          pathTemplate: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          requestTransformer: (messages: any[], systemPrompt?: string, stream = false, tools?: any[], toolChoice?: any, _debug?: boolean) => {
            const pathTemplate = '/v1/chat/completions'
            const systemMessage = systemPrompt ? [{ role: 'system', content: systemPrompt }] : []
            const mapTools = (t?: any[]) => {
              if (!t || !Array.isArray(t) || t.length === 0) return undefined
              try {
                return t.map((tool: any) => ({
                  type: 'function',
                  function: {
                    name: sanitizeToolName(tool.id || tool.name || 'tool'),
                    description: tool.description || '',
                    parameters: tool.inputSchema || { type: 'object', properties: {} }
                  }
                }))
              } catch {
                return undefined
              }
            }

            const modelId = config.model || getEnvVar('OPENAI_DEFAULT_MODEL') || getEnvVar('VITE_OPENAI_DEFAULT_MODEL') || 'gpt-4o-latest'
            // Support both Chat Completions and Responses APIs
            const isResponses = String(pathTemplate).endsWith('/v1/responses') || String(config.baseURL || '').endsWith('/v1/responses')
            let payload: any
            if (isResponses) {
              // Minimal Responses API payload
              // Flatten messages to a single input string while preserving system prompt
              const text = [systemPrompt ? `(system) ${systemPrompt}` : '', ...messages.map((m: any) => `(${m.role}) ${m.content}`)].filter(Boolean).join('\n')
              payload = {
                model: modelId,
                input: text,
                tools: mapTools(tools),
                tool_choice: toolChoice || undefined,
                stream
              }
            } else {
              payload = {
                model: modelId,
                messages: [...systemMessage, ...messages],
                stream,
                temperature: 0.7,
                max_tokens: 2000,
                tools: mapTools(tools)
              }
              if (toolChoice) payload.tool_choice = toolChoice
            }
            try {
              console.log(`[OpenAI][requestTransformer] { tools:[${(payload.tools || []).map((t: any) => t.function?.name).join(',')}], tool_choice:${JSON.stringify(payload.tool_choice) || 'undefined'}, stream:${Boolean(stream)}, model:${modelId}, path:${isResponses ? 'responses' : 'chat'} }`)
              console.log(`[CopilotPackage] version: ${COPILOT_COMMIT}`)
            } catch {}
            return payload
          },
          responseTransformer: (response: any) => {
            // Chat Completions
            if (response.choices?.[0]?.message) {
              const msg = response.choices[0].message
              const toolCalls = (msg.tool_calls || []).map((tc: any) => ({
                id: tc.id,
                name: tc.function?.name,
                arguments: (() => { try { return JSON.parse(tc.function?.arguments || '{}') } catch { return {} } })()
              }))
              return {
                content: msg.content || '',
                finishReason: response.choices[0].finish_reason,
                usage: response.usage,
                metadata: toolCalls.length ? { toolCalls } : undefined
              }
            }
            // Responses API (best-effort parsing)
            if (response?.output_text || response?.response?.content) {
              let content = ''
              if (typeof response.output_text === 'string') content = response.output_text
              else if (Array.isArray(response.response?.content)) {
                const textPart = response.response.content.find((c: any) => c?.text || c?.type === 'output_text')
                content = textPart?.text || textPart?.content || ''
              }
              // Extract tool calls if present under output or response
              const toolCallsRaw = (response?.tool_calls || response?.response?.tool_calls || []) as any[]
              const toolCalls = (toolCallsRaw || []).map((tc: any) => ({
                id: tc.id,
                name: tc.function?.name,
                arguments: (() => { try { return JSON.parse(tc.function?.arguments || '{}') } catch { return {} } })()
              }))
              return {
                content,
                finishReason: 'stop',
                usage: response.usage,
                metadata: toolCalls.length ? { toolCalls } : undefined
              }
            }
            throw new Error('Invalid OpenAI response format')
          },
          streamTransformer: (data: any) => {
            // Handle streaming format (delta) - this is correct for streaming
            if (data.choices?.[0]?.delta?.content) {
              const result = {
                content: data.choices[0].delta.content,
                isComplete: data.choices[0].finish_reason !== null && data.choices[0].finish_reason !== undefined
              }
              return result
            }
            if (data.choices?.[0]?.delta?.tool_calls) {
              return { content: '', isComplete: false, raw: data }
            }
            
            // Handle complete response format (message) - fallback for non-streaming
            if (data.choices?.[0]?.message?.content) {
              const result = {
                content: data.choices[0].message.content,
                isComplete: true
              }
              return result
            }
            
            // Handle completion signals  
            if (data.choices?.[0]?.finish_reason) {
              const result = {
                content: '',
                isComplete: true
              }
              return result
            }
            
            return null
          }
        }
      })
    },
    isAvailable: async () => {
      return !!(getEnvVar('OPENAI_API_KEY') || getEnvVar('VITE_OPENAI_API_KEY'))
    },
    defaultConfig: {
      baseURL: 'https://api.openai.com',
      apiKey: getEnvVar('OPENAI_API_KEY') || getEnvVar('VITE_OPENAI_API_KEY'),
      model: getEnvVar('OPENAI_DEFAULT_MODEL') || getEnvVar('VITE_OPENAI_DEFAULT_MODEL') || 'gpt-4o-latest'
    }
  })
} 