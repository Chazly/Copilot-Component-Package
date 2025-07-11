import React, { useState, useRef, useEffect } from 'react'
import { Bot, X, MessageCircle } from 'lucide-react'
import { CopilotChat } from './CopilotChat'
import { CopilotConfigType, isAICopilotConfig, isLegacyCopilotConfig } from '../types'

export interface FloatingCopilotProps {
  config: CopilotConfigType
  onSendMessage?: (message: string) => Promise<string> | string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: 'small' | 'medium' | 'large'
  triggerIcon?: 'bot' | 'message' | 'custom'
  customTriggerIcon?: React.ReactNode
  closeOnClickOutside?: boolean
  showBadge?: boolean
  badgeText?: string
  className?: string
}

// Position configurations
const positionConfig = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4', 
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4'
}

// Size configurations for trigger button
const sizeConfig = {
  small: {
    button: 'h-12 w-12',
    icon: 'h-5 w-5',
    modal: 'h-96 w-80'
  },
  medium: {
    button: 'h-14 w-14', 
    icon: 'h-6 w-6',
    modal: 'h-[32rem] w-96'
  },
  large: {
    button: 'h-16 w-16',
    icon: 'h-7 w-7',
    modal: 'h-[36rem] w-[26rem]'
  }
}

// Extract config properties for styling
function getFloatingConfigProperties(config: CopilotConfigType) {
  if (isLegacyCopilotConfig(config)) {
    return {
      name: config.title,
      avatarUrl: undefined,
      theme: 'blue' as const
    }
  } else if (isAICopilotConfig(config)) {
    return {
      name: config.name,
      avatarUrl: config.persona?.avatarUrl,
      theme: config.uiConfig?.theme || 'auto'
    }
  }
  
  return {
    name: 'AI Assistant',
    avatarUrl: undefined,
    theme: 'blue' as const
  }
}

export function FloatingCopilot({
  config,
  onSendMessage,
  position = 'bottom-right',
  size = 'medium',
  triggerIcon = 'bot',
  customTriggerIcon,
  closeOnClickOutside = true,
  showBadge = false,
  badgeText = '1',
  className
}: FloatingCopilotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const configProps = getFloatingConfigProperties(config)
  const styles = sizeConfig[size]

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return

    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, closeOnClickOutside])

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Render trigger icon
  function renderTriggerIcon() {
    if (customTriggerIcon) {
      return customTriggerIcon
    }

    if (configProps.avatarUrl) {
      return (
        <img 
          src={configProps.avatarUrl} 
          alt={`${configProps.name} Avatar`}
          className={`${styles.icon} rounded-full object-cover`}
        />
      )
    }

    switch (triggerIcon) {
      case 'message':
        return <MessageCircle className={`${styles.icon} text-white`} />
      case 'bot':
      default:
        return <Bot className={`${styles.icon} text-white`} />
    }
  }

  // Get theme-based button colors
  function getButtonColors() {
    const themeColors = {
      blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
      green: 'bg-green-600 hover:bg-green-700 shadow-green-200',
      purple: 'bg-purple-600 hover:bg-purple-700 shadow-purple-200',
      auto: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
      dark: 'bg-gray-800 hover:bg-gray-900 shadow-gray-200',
      light: 'bg-white hover:bg-gray-50 shadow-gray-300 text-gray-800'
    }
    
    return themeColors[configProps.theme] || themeColors.blue
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <div className={`fixed ${positionConfig[position]} z-40 ${className || ''}`}>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              ${styles.button}
              ${getButtonColors()}
              rounded-full
              shadow-lg
              transition-all
              duration-200
              ease-in-out
              hover:scale-105
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-blue-500
              flex
              items-center
              justify-center
            `}
            aria-label={`${isOpen ? 'Close' : 'Open'} ${configProps.name} chat`}
          >
            {isOpen ? (
              <X className={`${styles.icon} text-white`} />
            ) : (
              renderTriggerIcon()
            )}
          </button>

          {/* Badge */}
          {showBadge && !isOpen && badgeText && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {badgeText}
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-20 transition-opacity" />
          
          {/* Modal Content */}
          <div className={`absolute ${positionConfig[position]} m-4`}>
            <div 
              ref={modalRef}
              className={`
                ${styles.modal}
                bg-white
                rounded-lg
                shadow-2xl
                border
                border-gray-200
                overflow-hidden
                transform
                transition-all
                duration-200
                ease-in-out
                ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
              `}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  {configProps.avatarUrl ? (
                    <img 
                      src={configProps.avatarUrl} 
                      alt="Avatar"
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <Bot className="h-5 w-5 text-gray-600" />
                  )}
                  <h3 className="text-sm font-medium text-gray-900">
                    {configProps.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Content */}
              <div className="h-full">
                <CopilotChat
                  config={config}
                  onSendMessage={onSendMessage}
                  className="flex flex-col h-full bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FloatingCopilot 