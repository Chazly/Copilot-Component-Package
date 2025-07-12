import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
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
};
// Keyboard shortcut mapping
const KEYBOARD_SHORTCUTS = {
    'ctrl+1': 'action-1',
    'ctrl+2': 'action-2',
    'ctrl+3': 'action-3',
    'ctrl+s': 'save',
    'ctrl+e': 'export',
    'ctrl+r': 'refresh',
    'escape': 'cancel'
};
export function ActionButtons({ config, onActionTriggered, context, layout = 'horizontal', size = 'default', className = '' }) {
    var _a, _b, _c, _d;
    const [loadingActions, setLoadingActions] = useState(new Set());
    const [actionResults, setActionResults] = useState(new Map());
    const actions = config.actions || [];
    const userRoles = ((_a = context === null || context === void 0 ? void 0 : context.user) === null || _a === void 0 ? void 0 : _a.roles) || [];
    const allowedRoles = ((_b = config.visibility) === null || _b === void 0 ? void 0 : _b.rolesAllowed) || [];
    // Check if user has permission to see/use actions
    const hasPermission = useCallback((actionId) => {
        // If no roles are specified, allow all users
        if (allowedRoles.length === 0)
            return true;
        // Check if user has any of the allowed roles
        return userRoles.some((role) => allowedRoles.includes(role));
    }, [allowedRoles, userRoles]);
    // Filter actions based on permissions
    const visibleActions = actions.filter(action => hasPermission(action.actionId));
    // Handle action execution
    const handleAction = useCallback(async (actionId, runFunction) => {
        var _a, _b, _c, _d;
        if (loadingActions.has(actionId))
            return;
        setLoadingActions(prev => new Set(prev).add(actionId));
        setActionResults(prev => {
            const newMap = new Map(prev);
            newMap.delete(actionId);
            return newMap;
        });
        try {
            let result = { success: false };
            // Built-in action handlers
            switch (actionId) {
                case 'clear-conversation':
                    result = { success: true, message: 'Conversation cleared' };
                    break;
                case 'export-conversation':
                    const exportData = {
                        timestamp: new Date().toISOString(),
                        conversation: (context === null || context === void 0 ? void 0 : context.messages) || [],
                        config: config.name
                    };
                    // Trigger download
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `conversation-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    result = { success: true, message: 'Conversation exported' };
                    break;
                case 'save-conversation':
                    // Save to localStorage or configured database
                    const saveKey = `${config.slug}-conversation-${Date.now()}`;
                    localStorage.setItem(saveKey, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        messages: (context === null || context === void 0 ? void 0 : context.messages) || [],
                        metadata: (context === null || context === void 0 ? void 0 : context.metadata) || {}
                    }));
                    result = { success: true, message: 'Conversation saved' };
                    break;
                case 'refresh-context':
                    // Refresh context sources
                    if (config.contextSources && config.contextSources.length > 0) {
                        // Simulate context refresh
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        result = { success: true, message: 'Context refreshed' };
                    }
                    else {
                        result = { success: false, message: 'No context sources configured' };
                    }
                    break;
                default:
                    // Custom action - try to execute the runFunction
                    if (onActionTriggered) {
                        await onActionTriggered(actionId, context);
                        result = { success: true, message: 'Action completed' };
                    }
                    else {
                        // Fallback: try to find function in global scope (development mode)
                        if (((_a = config.development) === null || _a === void 0 ? void 0 : _a.debugMode) && typeof window !== 'undefined') {
                            const func = window[runFunction];
                            if (typeof func === 'function') {
                                const funcResult = await func(context);
                                result = { success: true, data: funcResult };
                            }
                            else {
                                result = { success: false, message: `Function ${runFunction} not found` };
                            }
                        }
                        else {
                            result = { success: false, message: 'Action handler not configured' };
                        }
                    }
            }
            setActionResults(prev => new Map(prev).set(actionId, result));
            // Track analytics if enabled
            if ((_b = config.analytics) === null || _b === void 0 ? void 0 : _b.trackActions) {
                console.log('Action tracked:', { actionId, success: result.success, timestamp: new Date() });
            }
            // Trigger webhook if configured
            if ((_d = (_c = config.integrations) === null || _c === void 0 ? void 0 : _c.webhooks) === null || _d === void 0 ? void 0 : _d.onActionTriggered) {
                fetch(config.integrations.webhooks.onActionTriggered, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        actionId,
                        success: result.success,
                        timestamp: new Date().toISOString(),
                        copilotSlug: config.slug
                    })
                }).catch(console.error);
            }
        }
        catch (error) {
            console.error('Action execution failed:', error);
            setActionResults(prev => new Map(prev).set(actionId, {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
        finally {
            setLoadingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(actionId);
                return newSet;
            });
        }
    }, [loadingActions, config, context, onActionTriggered]);
    // Keyboard shortcut handler
    useEffect(() => {
        var _a;
        const handleKeyDown = (event) => {
            const shortcut = [
                event.ctrlKey && 'ctrl',
                event.metaKey && 'cmd',
                event.shiftKey && 'shift',
                event.altKey && 'alt',
                event.key.toLowerCase()
            ].filter(Boolean).join('+');
            const actionId = KEYBOARD_SHORTCUTS[shortcut];
            if (actionId) {
                const action = actions.find(a => a.actionId === actionId);
                if (action && hasPermission(actionId)) {
                    event.preventDefault();
                    handleAction(actionId, action.runFunction);
                }
            }
        };
        if ((_a = config.features) === null || _a === void 0 ? void 0 : _a.voiceInput) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [actions, (_c = config.features) === null || _c === void 0 ? void 0 : _c.voiceInput, handleAction, hasPermission]);
    // Get action category info
    const getActionCategory = (action) => {
        const categoryKey = action.category || 'conversation';
        return ACTION_CATEGORIES[categoryKey] || ACTION_CATEGORIES.conversation;
    };
    // Get button size classes
    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'text-xs px-2 py-1';
            case 'lg': return 'text-base px-4 py-3';
            default: return 'text-sm px-3 py-2';
        }
    };
    // Get layout classes
    const getLayoutClasses = () => {
        switch (layout) {
            case 'vertical': return 'flex flex-col space-y-2';
            case 'grid': return 'grid grid-cols-2 gap-2';
            default: return 'flex flex-wrap gap-2';
        }
    };
    if (visibleActions.length === 0) {
        return null;
    }
    return (_jsxs("div", { className: `${getLayoutClasses()} ${className}`, children: [visibleActions.map((action) => {
                var _a;
                const category = getActionCategory(action);
                const isLoading = loadingActions.has(action.actionId);
                const result = actionResults.get(action.actionId);
                const shortcut = (_a = Object.entries(KEYBOARD_SHORTCUTS).find(([, id]) => id === action.actionId)) === null || _a === void 0 ? void 0 : _a[0];
                return (_jsxs("div", { className: "relative", children: [_jsx(Button, { variant: "outline", size: size, onClick: () => handleAction(action.actionId, action.runFunction), disabled: isLoading, className: `
                ${getSizeClasses()}
                border-${category.color}-200 hover:border-${category.color}-300
                hover:bg-${category.color}-50 dark:hover:bg-${category.color}-900/20
                transition-all duration-200
                ${(result === null || result === void 0 ? void 0 : result.success) === false ? 'border-red-300 bg-red-50' : ''}
                ${(result === null || result === void 0 ? void 0 : result.success) === true ? 'border-green-300 bg-green-50' : ''}
              `, title: `${action.description || action.label}${shortcut ? ` (${shortcut})` : ''}`, children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-base", children: action.icon || category.icon }), _jsx("span", { className: isLoading ? 'opacity-50' : '', children: action.label }), isLoading && (_jsx("div", { className: "w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" })), shortcut && !isLoading && (_jsx("span", { className: "text-xs opacity-60 ml-auto", children: shortcut.replace('ctrl', '⌘').replace('+', '') }))] }) }), result && (_jsx("div", { className: `
                absolute top-full left-0 mt-1 px-2 py-1 rounded text-xs whitespace-nowrap z-10
                ${result.success
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'}
              `, children: result.message }))] }, action.actionId));
            }), ((_d = config.development) === null || _d === void 0 ? void 0 : _d.debugMode) && (_jsx("div", { className: "mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs", children: _jsxs("details", { children: [_jsx("summary", { className: "cursor-pointer font-medium", children: "Debug Actions" }), _jsx("pre", { className: "mt-2 text-xs overflow-auto", children: JSON.stringify({
                                visibleActions: visibleActions.length,
                                userRoles,
                                allowedRoles,
                                loadingActions: Array.from(loadingActions),
                                shortcuts: Object.keys(KEYBOARD_SHORTCUTS)
                            }, null, 2) })] }) }))] }));
}
