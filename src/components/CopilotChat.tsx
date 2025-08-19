import React from 'react'
import { Bot, User, Send, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll_area'
import { useCopilotChat } from '../hooks/useCopilotChat'
import { useCopilotConfig } from '../hooks/useCopilotConfig'
import { CopilotChatProps, CopilotColor, isAICopilotConfig, isLegacyCopilotConfig } from '../types'
import { processMarkdown } from '../lib/utils'

const colorConfig: Record<CopilotColor, {
  headerBg: string
  userBg: string
  userText: string
  buttonBg: string
  buttonHover: string
}> = {
  blue: {
    headerBg: "bg-blue-600",
    userBg: "bg-white",
    userText: "text-black",
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

// Preset className for ResizableLayout usage
export const RESIZABLE_PANEL_CLASSNAME = "flex flex-col bg-white h-full w-full border border-gray-200 rounded-lg shadow-sm"

// Layout configurations
const layoutConfig = {
  chatbox: {
    container: "flex flex-col bg-white h-96 w-full max-w-md border border-gray-200 rounded-lg shadow-sm",
    header: "px-4 py-3 border-b border-gray-200",
    messages: "flex-1 overflow-auto",
    messageText: "text-xs",
    timestampText: "text-[10px]",
    input: "p-4 border-t border-gray-200",
    inputField: "h-8 text-xs",
    button: "h-8 w-8",
    avatar: "h-6 w-6",
        avatarIcon: "h-3 w-3"
  },
  sidebar: {
    container: "flex flex-col bg-white h-full w-full max-w-xs border border-gray-200 rounded-lg shadow-sm",
    header: "px-3 py-2 border-b border-gray-200",
    messages: "flex-1 overflow-auto",
    messageText: "text-xs",
    timestampText: "text-[10px]",
    input: "p-3 border-t border-gray-200",
    inputField: "h-7 text-xs",
    button: "h-7 w-7",
    avatar: "h-5 w-5",
    avatarIcon: "h-2.5 w-2.5"
  },
  fullpage: {
    container: "flex flex-col bg-white h-full w-full border border-gray-200 rounded-lg shadow-sm",
    header: "px-6 py-4 border-b border-gray-200",
    messages: "flex-1 overflow-auto",
    messageText: "text-sm",
    timestampText: "text-xs",
    input: "p-6 border-t border-gray-200",
    inputField: "h-10 text-sm",
    button: "h-10 w-10",
    avatar: "h-8 w-8",
    avatarIcon: "h-4 w-4"
  }
}

// Extract config properties for both types
function getConfigProperties(config: CopilotChatProps['config']) {
  if (isLegacyCopilotConfig(config)) {
    // Legacy config mapping
    return {
      title: config.title,
      subtitle: config.subtitle,
      initialMessage: config.initialMessage,
      colors: colorConfig[config.color],
      layout: 'chatbox' as const,
      showAvatar: true,
      avatarUrl: undefined,
      placeholder: `Ask about ${config.title.toLowerCase()}...`
    }
  } else if (isAICopilotConfig(config)) {
    // New AI config mapping
    const layout = config.uiConfig?.layout || 'chatbox'
    const defaultColor = 'blue' // fallback for AI config
    
    return {
      title: config.name,
      subtitle: config.description || '',
      initialMessage: config.firstMessage,
      colors: colorConfig[defaultColor], // AI config uses theme instead of colors
      layout: layout,
      showAvatar: config.uiConfig?.showAvatar !== false,
      avatarUrl: config.persona?.avatarUrl,
      placeholder: `Ask ${config.name}...`
    }
  }
  
  // Fallback
  return {
    title: 'AI Assistant',
    subtitle: 'How can I help?',
    initialMessage: 'Hello! How can I assist you today?',
    colors: colorConfig.blue,
    layout: 'chatbox' as const,
    showAvatar: true,
    avatarUrl: undefined,
    placeholder: 'Ask me anything...'
  }
}

// Chat Header Component
interface ChatHeaderProps {
  title: string
  subtitle: string
  showAvatar: boolean
  avatarUrl?: string
  colors: any
  layout: keyof typeof layoutConfig
}

function ChatHeader({ title, subtitle, showAvatar, avatarUrl, colors, layout }: ChatHeaderProps) {
  const styles = layoutConfig[layout]
  
  return (
    <header className={`flex items-center gap-2 border-b border-gray-200 ${styles.header}`}>
      {showAvatar && (
        <span className={`flex ${styles.avatar} items-center justify-center rounded-full ${colors.headerBg}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className={`${styles.avatar} rounded-full object-cover`} />
          ) : (
            <Bot className={`${styles.avatarIcon} text-white`} />
          )}
        </span>
      )}
      <div className="flex-1">
        <h1 className={`font-semibold text-gray-900 ${layout === 'fullpage' ? 'text-base' : 'text-sm'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-gray-500 ${layout === 'fullpage' ? 'text-sm' : 'text-xs'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </header>
  )
}

// Chat Messages Component
interface ChatMessagesProps {
  messages: any[]
  isLoading: boolean
  showAvatar: boolean
  avatarUrl?: string
  colors: any
  layout: keyof typeof layoutConfig
  composer?: {
    onChoiceSelectBehavior?: 'sendKey' | 'sendText'
    multiSelect?: boolean
    selectionLimit?: number
    submitLabel?: string
    sendOnSelect?: boolean
  }
}

function ChatMessages({ messages, isLoading, showAvatar, avatarUrl, colors, layout, composer }: ChatMessagesProps) {
  const styles = layoutConfig[layout]
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  
  // Helper function to detect streaming placeholder messages
  const isStreamingPlaceholder = (message: any) => {
    return message.sender === 'assistant' && message.content === '' && isLoading
  }
  
  // Check if we have any streaming placeholder messages
  const hasStreamingPlaceholder = messages.some(isStreamingPlaceholder)

  return (
    <div className={`${styles.messages}`}>
      <div className={`space-y-3 ${layout === 'chatbox' ? 'p-4' : layout === 'sidebar' ? 'p-3' : 'p-6'}`}>
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <p className={layout === 'fullpage' ? 'text-sm' : 'text-xs'}>
              Start a conversation to get help
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.sender === 'assistant' && showAvatar && (
              <div className={`${styles.avatar} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
              {avatarUrl ? (
                  <img src={avatarUrl} alt="Assistant" className="w-full h-full rounded-full object-cover" />
              ) : (
                  <Bot className={`${styles.avatarIcon} text-gray-600`} />
              )}
              </div>
          )}

            <div className={`
              max-w-[80%] rounded-lg px-3 py-2 
              ${message.sender === 'user' 
                ? `${colors.userBg} ${colors.userText}` 
                : 'bg-gray-100 text-gray-900'
              }
            `}>
              {isStreamingPlaceholder(message) ? (
                // Show loading dots inside the message bubble
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              ) : (
                // Show normal message content
                <div 
                  className={styles.messageText}
                  dangerouslySetInnerHTML={{ __html: processMarkdown(message.content) }}
                />
              )}
              {message.choices && message.choices.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {message.choices.map((c: any) => {
                      const isSelected = !!selected[c.key]
                      return (
                        <button
                          key={c.key}
                          data-choice-key={c.key}
                          className={`text-xs px-2 py-1 border rounded transition ${isSelected ? 'bg-gray-300 border-gray-400' : 'border-gray-300 hover:bg-gray-200'}`}
                          onClick={() => {
                            const allowMulti = !!composer?.multiSelect
                            if (allowMulti) {
                              setSelected(prev => {
                                const next = { ...prev }
                                const nextVal = !next[c.key]
                                // enforce selection limit if provided
                                const limit = composer?.selectionLimit
                                if (nextVal && typeof limit === 'number') {
                                  const count = Object.values(next).filter(Boolean).length
                                  if (count >= limit) {
                                    return prev
                                  }
                                }
                                next[c.key] = nextVal
                                return next
                              })
                              if (composer?.sendOnSelect) {
                                const event = new CustomEvent('copilot-choice-selected', {
                                  detail: { key: c.key, text: c.text }
                                })
                                window.dispatchEvent(event)
                              }
                            } else {
                              const behavior = composer?.onChoiceSelectBehavior || 'sendKey'
                              const event = new CustomEvent('copilot-choice-selected', {
                                detail: { key: c.key, text: c.text, behavior }
                              })
                              window.dispatchEvent(event)
                            }
                          }}
                        >{c.key}. {c.text}</button>
                      )
                    })}
                  </div>
                  {composer?.multiSelect && !composer?.sendOnSelect && (
                    <div className="pt-1">
                      <button
                        className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-200 transition"
                        onClick={() => {
                          const selectedKeys = Object.entries(selected).filter(([, v]) => v).map(([k]) => k)
                          if (selectedKeys.length === 0) return
                          const selectedChoices = message.choices.filter((c: any) => selectedKeys.includes(c.key))
                          const behavior = composer?.onChoiceSelectBehavior || 'sendKey'
                          const payload = behavior === 'sendText'
                            ? selectedChoices.map((c: any) => `${c.key}. ${c.text}`).join(', ')
                            : selectedChoices.map((c: any) => c.key).join(', ')
                          const event = new CustomEvent('copilot-choice-selected', {
                            detail: { payload }
                          })
                          window.dispatchEvent(event)
                          setSelected({})
                        }}
                      >{composer?.submitLabel || 'Submit'}</button>
                    </div>
                  )}
                </div>
              )}
              {message.timestamp && (
                <div className={`${styles.timestampText} opacity-70 mt-1 ${
                  message.sender === 'user' ? 'text-gray-600' : 'text-gray-500'
            }`}>
                  {message.timestamp.toLocaleTimeString()}
            </div>
              )}
          </div>

            {message.sender === 'user' && showAvatar && (
              <div className={`${styles.avatar} rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0`}>
              <User className={`${styles.avatarIcon} text-white`} />
              </div>
          )}
        </div>
      ))}
        
        {isLoading && !hasStreamingPlaceholder && (
          <div className="flex items-start gap-2 justify-start">
          {showAvatar && (
              <div className={`${styles.avatar} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
              {avatarUrl ? (
                  <img src={avatarUrl} alt="Assistant" className="w-full h-full rounded-full object-cover" />
              ) : (
                  <Bot className={`${styles.avatarIcon} text-gray-600`} />
              )}
              </div>
          )}
          <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

// Chat Input Component
interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  sendMsg: () => void
  isLoading: boolean
  placeholder: string
  colors: any
  layout: keyof typeof layoutConfig
}

function ChatInput({ input, setInput, sendMsg, isLoading, placeholder, colors, layout }: ChatInputProps) {
  const styles = layoutConfig[layout]
  
  return (
    <div className={`border-t border-gray-200 ${styles.input}`}>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMsg()}
          className={`flex-1 ${styles.inputField}`}
          disabled={isLoading}
        />
        <Button 
          onClick={sendMsg} 
          size="sm" 
          className={`${styles.button} p-0 ${colors.buttonBg} ${colors.buttonHover}`}
          disabled={isLoading}
        >
          <Send className={`${styles.avatarIcon}`} />
        </Button>
      </div>
    </div>
  )
}

// Main CopilotChat Component
export function CopilotChat({ config, onSendMessage, className }: CopilotChatProps) {
  const { config: normalizedConfig } = useCopilotConfig(config)
  const configProps = getConfigProperties(config)
  const { messages, input, setInput, sendMsg, isLoading } = useCopilotChat(normalizedConfig, onSendMessage)

  // Listen for choice selection and auto-send based on config preferences
  React.useEffect(() => {
    const handler = (e: any) => {
      const behavior = normalizedConfig.uiConfig.composer?.onChoiceSelectBehavior || 'sendKey'
      const key = e.detail?.key
      const text = e.detail?.text
      const explicitPayload = e.detail?.payload
      if (!explicitPayload && !key && !text) return
      const payload = explicitPayload || (behavior === 'sendText' ? `${key}. ${text}` : key)
      setInput(payload)
      setTimeout(() => {
        const inputEl = document.activeElement as HTMLElement
        // ensure send fires with current state; rely on sendMsg using state
        sendMsg()
      }, 0)
    }
    window.addEventListener('copilot-choice-selected', handler)
    return () => window.removeEventListener('copilot-choice-selected', handler)
  }, [normalizedConfig.uiConfig.composer?.onChoiceSelectBehavior, setInput, sendMsg])
  
  // Show deprecation warning for legacy config in development
  if (isLegacyCopilotConfig(config) && (process.env.NODE_ENV === 'development' || typeof window !== 'undefined')) {
    console.warn('CopilotChat: Using legacy CopilotConfig. Consider migrating to AICopilotConfig for advanced features.')
  }
  
  const styles = layoutConfig[configProps.layout]
  const finalClassName = className || styles.container

  return (
    <div className={finalClassName}>
      <ChatHeader
        title={configProps.title}
        subtitle={configProps.subtitle}
        showAvatar={configProps.showAvatar}
        avatarUrl={configProps.avatarUrl}
        colors={configProps.colors}
        layout={configProps.layout}
      />
      
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        showAvatar={configProps.showAvatar}
        avatarUrl={configProps.avatarUrl}
        colors={configProps.colors}
        layout={configProps.layout}
      />
      
      <ChatInput
        input={input}
        setInput={setInput}
        sendMsg={sendMsg}
        isLoading={isLoading}
        placeholder={configProps.placeholder}
        colors={configProps.colors}
        layout={configProps.layout}
      />
    </div>
  )
}