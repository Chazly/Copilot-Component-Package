import { useState } from 'react'
import { Message, NormalizedCopilotConfig } from '../types'
import { useModelProvider } from './useModelProvider'
import { ChatMessage } from '../services/BaseProvider'
import { parseChoicesFromText } from '../lib/utils'

// Convert Message to ChatMessage format
function messageToProviderFormat(message: Message): ChatMessage {
  return {
    role: message.sender === 'user' ? 'user' : 'assistant',
    content: message.content,
    timestamp: message.timestamp
  }
}

// Enhanced hook with provider abstraction
export function useCopilotChat(
  config: NormalizedCopilotConfig,
  onSendMessage?: (message: string) => Promise<string> | string
) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: config.firstMessage,
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Use provider abstraction for AI configs
  const shouldUseProvider = !config.isLegacyConfig
  const modelProvider = useModelProvider(config)

  const sendMsg = async () => {
    if (!input.trim() || isLoading) return
    
    const outgoing: Message = {
      id: crypto.randomUUID(),
      content: input.trim(),
      sender: "user",
      timestamp: new Date(),
    }
    
    setMessages((m) => [...m, outgoing])
    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      let responseContent: string

      if (shouldUseProvider && modelProvider.isReady) {
        // Use AI provider abstraction
        const chatMessages = messages.map(messageToProviderFormat)
        chatMessages.push(messageToProviderFormat(outgoing))
        
        const response = await modelProvider.sendMessage(
          chatMessages,
          config.systemPrompt
        )
        
        responseContent = response.content
        
      } else if (onSendMessage) {
        // Use legacy callback
        responseContent = await onSendMessage(userMessage)
      } else {
        // Default fallback response
        responseContent = config.fallbackMessage || "I can help you with that! What specific area would you like to focus on?"
      }

      setTimeout(() => {
        const parsed = parseChoicesFromText(responseContent)
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            content: parsed.remainingText,
            sender: "assistant",
            timestamp: new Date(),
            choices: parsed.choices || undefined
          },
        ])
        setIsLoading(false)
      }, 800)
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage = config.fallbackMessage || "Sorry, I encountered an error. Please try again."
      
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          content: errorMessage,
          sender: "assistant",
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
    }
  }

  // Streaming message support for AI providers
  const sendMsgStream = async () => {
    if (!input.trim() || isLoading || !shouldUseProvider || !modelProvider.isReady) {
      return sendMsg() // Fallback to regular message
    }
    
    const outgoing: Message = {
      id: crypto.randomUUID(),
      content: input.trim(),
      sender: "user",
      timestamp: new Date(),
    }
    
    setMessages((m) => [...m, outgoing])
    setInput("")
    setIsLoading(true)

    // Create placeholder for streaming response
    const responseId = crypto.randomUUID()
    const responseMessage: Message = {
      id: responseId,
      content: "",
      sender: "assistant",
      timestamp: new Date(),
    }
    
    setMessages((m) => [...m, responseMessage])

    // Track if this is the first chunk to hide loading dots immediately
    let isFirstChunk = true

    try {
      const chatMessages = messages.map(messageToProviderFormat)
      chatMessages.push(messageToProviderFormat(outgoing))
      
      await modelProvider.sendMessageStream(
        chatMessages,
        (chunk) => {
          // Hide loading dots as soon as first chunk arrives
          if (isFirstChunk && chunk.content) {
            setIsLoading(false)
            isFirstChunk = false
          }
          
          setMessages((m) => {
            const updated = m.map(msg =>
              msg.id === responseId
                ? { ...msg, content: msg.content + (chunk.content || '') }
                : msg
            )
            // As content grows, try to parse choices without being too aggressive
            const target = updated.find(msg => msg.id === responseId)
            if (target) {
              const parsed = parseChoicesFromText(target.content)
              target.content = parsed.remainingText
              target.choices = parsed.choices || undefined
            }
            return [...updated]
          })
          
          // Keep this for backwards compatibility/fallback
          if (chunk.isComplete) {
            setIsLoading(false)
          }
        },
        config.systemPrompt
      )
      
    } catch (error) {
      console.error('Error streaming message:', error)
      
      const errorMessage = config.fallbackMessage || "Sorry, I encountered an error. Please try again."
      
      setMessages((m) => 
        m.map(msg => 
          msg.id === responseId 
            ? { ...msg, content: errorMessage }
            : msg
        )
      )
      setIsLoading(false)
    }
  }

  return {
    messages,
    input,
    setInput,
    sendMsg: config.performance?.streamingEnabled ? sendMsgStream : sendMsg,
    sendMsgStream,
    isLoading,
    // Provider information
    providerStatus: shouldUseProvider ? {
      isReady: modelProvider.isReady,
      currentProvider: modelProvider.currentProvider?.name,
      availableProviders: modelProvider.availableProviders,
      error: modelProvider.error,
      metrics: modelProvider.metrics
    } : null,
    // Provider controls
    switchProvider: shouldUseProvider ? modelProvider.switchProvider : undefined,
    refreshProvider: shouldUseProvider ? modelProvider.refreshProviderHealth : undefined
  }
}

// Legacy compatibility function
export function useLegacyCopilotChat(
  initialMessage: string,
  onSendMessage?: (message: string) => Promise<string> | string
) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: initialMessage,
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const sendMsg = async () => {
    if (!input.trim() || isLoading) return
    
    const outgoing: Message = {
      id: crypto.randomUUID(),
      content: input.trim(),
      sender: "user",
      timestamp: new Date(),
    }
    
    setMessages((m) => [...m, outgoing])
    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      let responseContent: string
      
      if (onSendMessage) {
        responseContent = await onSendMessage(userMessage)
      } else {
        // Default fallback response
        responseContent = "I can help you with that! What specific area would you like to focus on?"
      }

      setTimeout(() => {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            content: responseContent,
            sender: "assistant",
            timestamp: new Date(),
          },
        ])
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          content: "Sorry, I encountered an error. Please try again.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
    }
  }

  return {
    messages,
    input,
    setInput,
    sendMsg,
    isLoading
  }
}

export default useCopilotChat