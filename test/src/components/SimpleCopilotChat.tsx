import React, { useState } from 'react'
import { Bot, User, Send } from 'lucide-react'
import { processMarkdown } from '../../../src/lib/utils'

// Simple types for testing
interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

interface CopilotConfig {
  title: string
  subtitle: string
  color: string
  initialMessage: string
}

interface AICopilotConfig {
  name: string
  slug: string
  description?: string
  firstMessage: string
  databasePath: string
  embedLocation: string
  modelProvider: string
  systemPrompt: string
  uiConfig?: {
    theme?: string
    showAvatar?: boolean
    layout?: string
  }
}

type CopilotConfigType = CopilotConfig | AICopilotConfig

interface CopilotChatProps {
  config: CopilotConfigType
  onSendMessage?: (message: string) => Promise<string> | string
  className?: string
}

const colorConfig: Record<string, {
  headerBg: string
  userBg: string
  userText: string
  buttonBg: string
  buttonHover: string
}> = {
  blue: {
    headerBg: "bg-blue-600",
    userBg: "bg-blue-600",
    userText: "text-blue-100",
    buttonBg: "bg-blue-600",
    buttonHover: "hover:bg-blue-700"
  },
  green: {
    headerBg: "bg-green-600",
    userBg: "bg-green-600", 
    userText: "text-green-100",
    buttonBg: "bg-green-600",
    buttonHover: "hover:bg-green-700"
  },
  purple: {
    headerBg: "bg-purple-600",
    userBg: "bg-purple-600",
    userText: "text-purple-100",
    buttonBg: "bg-purple-600",
    buttonHover: "hover:bg-purple-700"
  },
  emerald: {
    headerBg: "bg-emerald-600",
    userBg: "bg-emerald-600",
    userText: "text-emerald-100",
    buttonBg: "bg-emerald-600",
    buttonHover: "hover:bg-emerald-700"
  },
  cyan: {
    headerBg: "bg-cyan-600",
    userBg: "bg-cyan-600",
    userText: "text-cyan-100",
    buttonBg: "bg-cyan-600",
    buttonHover: "hover:bg-cyan-700"
  },
  amber: {
    headerBg: "bg-amber-600",
    userBg: "bg-amber-600",
    userText: "text-amber-100",
    buttonBg: "bg-amber-600",
    buttonHover: "hover:bg-amber-700"
  },
  teal: {
    headerBg: "bg-teal-600",
    userBg: "bg-teal-600",
    userText: "text-teal-100",
    buttonBg: "bg-teal-600",
    buttonHover: "hover:bg-teal-700"
  },
  slate: {
    headerBg: "bg-slate-600",
    userBg: "bg-slate-600",
    userText: "text-slate-100",
    buttonBg: "bg-slate-600",
    buttonHover: "hover:bg-slate-700"
  },
  indigo: {
    headerBg: "bg-indigo-600",
    userBg: "bg-indigo-600",
    userText: "text-indigo-100",
    buttonBg: "bg-indigo-600",
    buttonHover: "hover:bg-indigo-700"
  }
}

// Type guards
function isAICopilotConfig(config: CopilotConfigType): config is AICopilotConfig {
  return 'slug' in config && 'modelProvider' in config && 'systemPrompt' in config;
}

function isLegacyCopilotConfig(config: CopilotConfigType): config is CopilotConfig {
  return 'title' in config && 'subtitle' in config && 'color' in config;
}

// Simple chat hook
function useSimpleCopilotChat(
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
    isLoading,
  }
}

export function CopilotChat({ config, onSendMessage, className }: CopilotChatProps) {
  // Extract config properties
  const configProps = isLegacyCopilotConfig(config)
    ? {
        title: config.title,
        subtitle: config.subtitle,
        initialMessage: config.initialMessage,
        colors: colorConfig[config.color] || colorConfig.blue,
        showAvatar: true,
        placeholder: `Ask about ${config.title.toLowerCase()}...`
      }
    : isAICopilotConfig(config)
    ? {
        title: config.name,
        subtitle: config.description || '',
        initialMessage: config.firstMessage,
        colors: colorConfig.blue, // Default for AI config
        showAvatar: config.uiConfig?.showAvatar !== false,
        placeholder: `Ask ${config.name}...`
      }
    : {
        title: 'AI Assistant',
        subtitle: 'How can I help?',
        initialMessage: 'Hello! How can I assist you today?',
        colors: colorConfig.blue,
        showAvatar: true,
        placeholder: 'Ask me anything...'
      }

  const { messages, input, setInput, sendMsg, isLoading } = useSimpleCopilotChat(
    configProps.initialMessage,
    onSendMessage
  )

  return (
    <div className={`flex flex-col bg-white border rounded-lg shadow-sm h-96 w-full max-w-md ${className || ''}`}>
      {/* Header */}
      <header className={`flex items-center gap-2 border-b border-gray-200 px-4 py-2 ${configProps.colors.headerBg}`}>
        {configProps.showAvatar && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white bg-opacity-20">
            <Bot className="h-3 w-3 text-white" />
          </span>
        )}
        <div className="flex-1">
          <h1 className="font-semibold text-white text-sm">
            {configProps.title}
          </h1>
          {configProps.subtitle && (
            <p className="text-white text-opacity-80 text-xs">
              {configProps.subtitle}
            </p>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-4">
          {messages.map((message) => {
            // Helper function to detect streaming placeholder messages
            const isStreamingPlaceholder = (msg: Message) => {
              return msg.sender === 'assistant' && msg.content === '' && isLoading
            }
            
            return (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "assistant" && configProps.showAvatar && (
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${configProps.colors.headerBg}`}>
                    <Bot className="h-3 w-3 text-white" />
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                    message.sender === "user"
                      ? `${configProps.colors.userBg} ${configProps.colors.userText}`
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: processMarkdown(message.content) }}
                  />
                  <p className="text-[10px] mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.sender === "user" && configProps.showAvatar && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                    <User className="h-3 w-3 text-gray-600" />
                  </span>
                )}
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              {configProps.showAvatar && (
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${configProps.colors.headerBg}`}>
                  <Bot className="h-3 w-3 text-white" />
                </span>
              )}
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            placeholder={configProps.placeholder}
            disabled={isLoading}
            className="flex-1 h-8 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMsg}
            disabled={!input.trim() || isLoading}
            className={`h-8 w-8 rounded-md ${configProps.colors.buttonBg} ${configProps.colors.buttonHover} text-white disabled:opacity-50 flex items-center justify-center`}
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
} 