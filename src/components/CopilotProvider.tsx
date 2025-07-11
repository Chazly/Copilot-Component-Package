import React, { createContext, useContext, ReactNode } from 'react'
import { CopilotConfigType, CopilotContextValue } from '../types'
import { useCopilotConfig } from '../hooks/useCopilotConfig'

// Create the context
const CopilotContext = createContext<CopilotContextValue | null>(null)

// Provider component props
interface CopilotProviderProps {
  config: CopilotConfigType
  children: ReactNode
}

// Provider component
export function CopilotProvider({ config, children }: CopilotProviderProps) {
  const configState = useCopilotConfig(config)

  const contextValue: CopilotContextValue = {
    config: configState.config,
    validation: configState.validation,
    updateConfig: configState.updateConfig,
    resetConfig: configState.resetConfig,
    isReady: configState.isReady
  }

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