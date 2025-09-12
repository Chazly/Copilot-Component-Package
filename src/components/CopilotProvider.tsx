import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { CopilotConfigType, CopilotContextValue, RuntimeTool } from '../types'
import { useCopilotConfig } from '../hooks/useCopilotConfig'

// Create the context
const CopilotContext = createContext<CopilotContextValue | null>(null)

// Provider component props
interface CopilotProviderProps {
  config: CopilotConfigType
  children: ReactNode
  tools?: RuntimeTool[]
  context?: string | (() => Promise<string> | string)
  toolContext?: { businessId?: string; userId?: string; sessionId?: string } | (() => Promise<{ businessId?: string; userId?: string; sessionId?: string } | undefined> | { businessId?: string; userId?: string; sessionId?: string })
}

// Provider component
export function CopilotProvider({ config, children, tools, context, toolContext }: CopilotProviderProps) {
  const configState = useCopilotConfig(config)

  const getContext = useMemo(() => {
    if (typeof context === 'function') return context as () => Promise<string> | string
    if (typeof context === 'string') return () => context
    return undefined
  }, [context])

  const getToolContext = useMemo(() => {
    if (typeof toolContext === 'function') return toolContext as () => Promise<{ businessId?: string; userId?: string; sessionId?: string } | undefined>
    if (toolContext && typeof toolContext === 'object') return () => toolContext
    return undefined
  }, [toolContext])

  const contextValue: CopilotContextValue = useMemo(() => ({
    config: configState.config,
    validation: configState.validation,
    updateConfig: configState.updateConfig,
    resetConfig: configState.resetConfig,
    isReady: configState.isReady,
    runtimeTools: tools,
    getContext,
    getToolContext
  }), [configState.config, configState.validation, configState.updateConfig, configState.resetConfig, configState.isReady, tools, getContext, getToolContext])

  // Show warning if config is invalid in development
  if (!configState.isReady && (process.env.NODE_ENV === 'development' || configState.config.development.debugMode)) {
    console.warn('CopilotProvider: Configuration is invalid', configState.validation.errors)
  }

  return (
    <CopilotContext.Provider value={contextValue}>
      {children}
    </CopilotContext.Provider>
  )
}

// Hook to use the copilot context
export function useCopilotContext(): CopilotContextValue {
  const context = useContext(CopilotContext)
  
  if (!context) {
    throw new Error('useCopilotContext must be used within a CopilotProvider')
  }
  
  return context
}

// Higher-order component for easier integration
export function withCopilot<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: CopilotConfigType
) {
  return function CopilotWrappedComponent(props: P) {
    return (
      <CopilotProvider config={config}>
        <WrappedComponent {...props} />
      </CopilotProvider>
    )
  }
}

export default CopilotProvider 