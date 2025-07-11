import React, { useCallback, useEffect, useState } from 'react'
import { AICopilotConfig } from '../types'
import { Button } from './ui/button'

interface ActionButtonsProps {
  config: AICopilotConfig
  onActionTriggered?: (actionId: string, context?: any) => Promise<void> | void
  context?: any // Current conversation context, user data, etc.
  layout?: 'horizontal' | 'vertical' | 'grid'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

interface ActionResult {
  success: boolean
  message?: string
  data?: any
}

// Built-in action categories with icons
const ACTION_CATEGORIES = {
  conversation: {
    icon: '💬',
    color: 'blue',
    description: 'Conversation actions'
  },
  content: {
    icon: '📝',
    color: 'green', 
    description: 'Content actions'
  },
  workflow: {
    icon: '⚡',
    color: 'purple',
    description: 'Workflow actions'
  },
  data: {
    icon: '📊',
    color: 'amber',
    description: 'Data actions'
  },
  system: {
    icon: '⚙️',
    color: 'gray',
    description: 'System actions'
  }
}

// Keyboard shortcut mapping
const KEYBOARD_SHORTCUTS: { [key: string]: string } = {
  'ctrl+1': 'action-1',
  'ctrl+2': 'action-2', 
  'ctrl+3': 'action-3',
  'ctrl+s': 'save',
  'ctrl+e': 'export',
  'ctrl+r': 'refresh',
  'escape': 'cancel'
}

export function ActionButtons({
  config,
  onActionTriggered,
  context,
  layout = 'horizontal',
  size = 'default',
  className = ''
}: ActionButtonsProps) {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())
  const [actionResults, setActionResults] = useState<Map<string, ActionResult>>(new Map())

  const actions = config.actions || []
  const userRoles = context?.user?.roles || []
  const allowedRoles = config.visibility?.rolesAllowed || []

  // Check if user has permission to see/use actions
  const hasPermission = useCallback((actionId: string) => {
    // If no roles are specified, allow all users
    if (allowedRoles.length === 0) return true
    
    // Check if user has any of the allowed roles
    return userRoles.some((role: string) => allowedRoles.includes(role))
  }, [allowedRoles, userRoles])

  // Filter actions based on permissions
  const visibleActions = actions.filter(action => hasPermission(action.actionId))

  // Handle action execution
  const handleAction = useCallback(async (actionId: string, runFunction: string) => {
    if (loadingActions.has(actionId)) return

    setLoadingActions(prev => new Set(prev).add(actionId))
    setActionResults(prev => {
      const newMap = new Map(prev)
      newMap.delete(actionId)
      return newMap
    })

    try {
      let result: ActionResult = { success: false }

      // Built-in action handlers
      switch (actionId) {
        case 'clear-conversation':
          result = { success: true, message: 'Conversation cleared' }
          break
          
        case 'export-conversation':
          const exportData = {
            timestamp: new Date().toISOString(),
            conversation: context?.messages || [],
            config: config.name
          }
          // Trigger download
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `conversation-${Date.now()}.json`
          a.click()
          URL.revokeObjectURL(url)
          result = { success: true, message: 'Conversation exported' }
          break

        case 'save-conversation':
          // Save to localStorage or configured database
          const saveKey = `${config.slug}-conversation-${Date.now()}`
          localStorage.setItem(saveKey, JSON.stringify({
            timestamp: new Date().toISOString(),
            messages: context?.messages || [],
            metadata: context?.metadata || {}
          }))
          result = { success: true, message: 'Conversation saved' }
          break

        case 'refresh-context':
          // Refresh context sources
          if (config.contextSources && config.contextSources.length > 0) {
            // Simulate context refresh
            await new Promise(resolve => setTimeout(resolve, 1000))
            result = { success: true, message: 'Context refreshed' }
          } else {
            result = { success: false, message: 'No context sources configured' }
          }
          break

        default:
          // Custom action - try to execute the runFunction
          if (onActionTriggered) {
            await onActionTriggered(actionId, context)
            result = { success: true, message: 'Action completed' }
          } else {
            // Fallback: try to find function in global scope (development mode)
            if (config.development?.debugMode && typeof window !== 'undefined') {
              const func = (window as any)[runFunction]
              if (typeof func === 'function') {
                const funcResult = await func(context)
                result = { success: true, data: funcResult }
              } else {
                result = { success: false, message: `Function ${runFunction} not found` }
              }
            } else {
              result = { success: false, message: 'Action handler not configured' }
            }
          }
      }

      setActionResults(prev => new Map(prev).set(actionId, result))

      // Track analytics if enabled
      if (config.analytics?.trackActions) {
        console.log('Action tracked:', { actionId, success: result.success, timestamp: new Date() })
      }

      // Trigger webhook if configured
      if (config.integrations?.webhooks?.onActionTriggered) {
        fetch(config.integrations.webhooks.onActionTriggered, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionId,
            success: result.success,
            timestamp: new Date().toISOString(),
            copilotSlug: config.slug
          })
        }).catch(console.error)
      }

    } catch (error) {
      console.error('Action execution failed:', error)
      setActionResults(prev => new Map(prev).set(actionId, {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }))
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(actionId)
        return newSet
      })
    }
  }, [loadingActions, config, context, onActionTriggered])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'cmd',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase()
      ].filter(Boolean).join('+')

      const actionId = KEYBOARD_SHORTCUTS[shortcut]
      if (actionId) {
        const action = actions.find(a => a.actionId === actionId)
        if (action && hasPermission(actionId)) {
          event.preventDefault()
          handleAction(actionId, action.runFunction)
        }
      }
    }

    if (config.features?.voiceInput) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [actions, config.features?.voiceInput, handleAction, hasPermission])

  // Get action category info
  const getActionCategory = (action: any) => {
    const categoryKey = action.category || 'conversation'
    return ACTION_CATEGORIES[categoryKey as keyof typeof ACTION_CATEGORIES] || ACTION_CATEGORIES.conversation
  }

  // Get button size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1'
      case 'lg': return 'text-base px-4 py-3'
      default: return 'text-sm px-3 py-2'
    }
  }

  // Get layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical': return 'flex flex-col space-y-2'
      case 'grid': return 'grid grid-cols-2 gap-2'
      default: return 'flex flex-wrap gap-2'
    }
  }

  if (visibleActions.length === 0) {
    return null
  }

  return (
    <div className={`${getLayoutClasses()} ${className}`}>
      {visibleActions.map((action) => {
        const category = getActionCategory(action)
        const isLoading = loadingActions.has(action.actionId)
        const result = actionResults.get(action.actionId)
        const shortcut = Object.entries(KEYBOARD_SHORTCUTS).find(([, id]) => id === action.actionId)?.[0]

        return (
          <div key={action.actionId} className="relative">
            <Button
              variant="outline"
              size={size}
              onClick={() => handleAction(action.actionId, action.runFunction)}
              disabled={isLoading}
              className={`
                ${getSizeClasses()}
                border-${category.color}-200 hover:border-${category.color}-300
                hover:bg-${category.color}-50 dark:hover:bg-${category.color}-900/20
                transition-all duration-200
                ${result?.success === false ? 'border-red-300 bg-red-50' : ''}
                ${result?.success === true ? 'border-green-300 bg-green-50' : ''}
              `}
              title={`${action.description || action.label}${shortcut ? ` (${shortcut})` : ''}`}
            >
              <div className="flex items-center space-x-2">
                {/* Icon */}
                <span className="text-base">
                  {action.icon || category.icon}
                </span>
                
                {/* Label */}
                <span className={isLoading ? 'opacity-50' : ''}>
                  {action.label}
                </span>
                
                {/* Loading spinner */}
                {isLoading && (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
                
                {/* Keyboard shortcut hint */}
                {shortcut && !isLoading && (
                  <span className="text-xs opacity-60 ml-auto">
                    {shortcut.replace('ctrl', '⌘').replace('+', '')}
                  </span>
                )}
              </div>
            </Button>

            {/* Result feedback */}
            {result && (
              <div className={`
                absolute top-full left-0 mt-1 px-2 py-1 rounded text-xs whitespace-nowrap z-10
                ${result.success 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
                }
              `}>
                {result.message}
              </div>
            )}
          </div>
        )
      })}

      {/* Debug info in development mode */}
      {config.development?.debugMode && (
        <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Debug Actions</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify({ 
                visibleActions: visibleActions.length,
                userRoles,
                allowedRoles,
                loadingActions: Array.from(loadingActions),
                shortcuts: Object.keys(KEYBOARD_SHORTCUTS)
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
} 