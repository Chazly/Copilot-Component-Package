import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { useCopilotConfig } from '../hooks/useCopilotConfig';
// Create the context
const CopilotContext = createContext(null);
// Provider component
export function CopilotProvider({ config, children, tools, context, toolContext }) {
    const configState = useCopilotConfig(config);
    const getContext = useMemo(() => {
        if (typeof context === 'function')
            return context;
        if (typeof context === 'string')
            return () => context;
        return undefined;
    }, [context]);
    const getToolContext = useMemo(() => {
        if (typeof toolContext === 'function')
            return toolContext;
        if (toolContext && typeof toolContext === 'object')
            return () => toolContext;
        return undefined;
    }, [toolContext]);
    const contextValue = useMemo(() => ({
        config: configState.config,
        validation: configState.validation,
        updateConfig: configState.updateConfig,
        resetConfig: configState.resetConfig,
        isReady: configState.isReady,
        runtimeTools: tools,
        getContext,
        getToolContext
    }), [configState.config, configState.validation, configState.updateConfig, configState.resetConfig, configState.isReady, tools, getContext, getToolContext]);
    // Show warning if config is invalid in development
    if (!configState.isReady && (process.env.NODE_ENV === 'development' || configState.config.development.debugMode)) {
        console.warn('CopilotProvider: Configuration is invalid', configState.validation.errors);
    }
    return (_jsx(CopilotContext.Provider, { value: contextValue, children: children }));
}
// Hook to use the copilot context
export function useCopilotContext() {
    const context = useContext(CopilotContext);
    if (!context) {
        throw new Error('useCopilotContext must be used within a CopilotProvider');
    }
    return context;
}
// Higher-order component for easier integration
export function withCopilot(WrappedComponent, config) {
    return function CopilotWrappedComponent(props) {
        return (_jsx(CopilotProvider, { config: config, children: _jsx(WrappedComponent, Object.assign({}, props)) }));
    };
}
export default CopilotProvider;
