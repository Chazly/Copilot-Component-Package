import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Bot, X, MessageCircle } from 'lucide-react';
import { CopilotChat } from './CopilotChat';
import { isAICopilotConfig, isLegacyCopilotConfig } from '../types';
// Position configurations
const positionConfig = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
};
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
};
// Extract config properties for styling
function getFloatingConfigProperties(config) {
    var _a, _b;
    if (isLegacyCopilotConfig(config)) {
        return {
            name: config.title,
            avatarUrl: undefined,
            theme: 'blue'
        };
    }
    else if (isAICopilotConfig(config)) {
        return {
            name: config.name,
            avatarUrl: (_a = config.persona) === null || _a === void 0 ? void 0 : _a.avatarUrl,
            theme: ((_b = config.uiConfig) === null || _b === void 0 ? void 0 : _b.theme) || 'auto'
        };
    }
    return {
        name: 'AI Assistant',
        avatarUrl: undefined,
        theme: 'blue'
    };
}
export function FloatingCopilot({ config, onSendMessage, position = 'bottom-right', size = 'medium', triggerIcon = 'bot', customTriggerIcon, closeOnClickOutside = true, showBadge = false, badgeText = '1', className }) {
    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef(null);
    const configProps = getFloatingConfigProperties(config);
    const styles = sizeConfig[size];
    // Handle click outside to close
    useEffect(() => {
        if (!isOpen || !closeOnClickOutside)
            return;
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closeOnClickOutside]);
    // Handle escape key to close
    useEffect(() => {
        if (!isOpen)
            return;
        function handleEscape(event) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);
    // Render trigger icon
    function renderTriggerIcon() {
        if (customTriggerIcon) {
            return customTriggerIcon;
        }
        if (configProps.avatarUrl) {
            return (_jsx("img", { src: configProps.avatarUrl, alt: `${configProps.name} Avatar`, className: `${styles.icon} rounded-full object-cover` }));
        }
        switch (triggerIcon) {
            case 'message':
                return _jsx(MessageCircle, { className: `${styles.icon} text-white` });
            case 'bot':
            default:
                return _jsx(Bot, { className: `${styles.icon} text-white` });
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
        };
        return themeColors[configProps.theme] || themeColors.blue;
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: `fixed ${positionConfig[position]} z-40 ${className || ''}`, children: _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setIsOpen(!isOpen), className: `
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
            `, "aria-label": `${isOpen ? 'Close' : 'Open'} ${configProps.name} chat`, children: isOpen ? (_jsx(X, { className: `${styles.icon} text-white` })) : (renderTriggerIcon()) }), showBadge && !isOpen && badgeText && (_jsx("div", { className: "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium", children: badgeText }))] }) }), isOpen && (_jsxs("div", { className: "fixed inset-0 z-50 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-black bg-opacity-20 transition-opacity" }), _jsx("div", { className: `absolute ${positionConfig[position]} m-4`, children: _jsxs("div", { ref: modalRef, className: `
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
              `, children: [_jsxs("div", { className: "flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [configProps.avatarUrl ? (_jsx("img", { src: configProps.avatarUrl, alt: "Avatar", className: "h-6 w-6 rounded-full object-cover" })) : (_jsx(Bot, { className: "h-5 w-5 text-gray-600" })), _jsx("h3", { className: "text-sm font-medium text-gray-900", children: configProps.name })] }), _jsx("button", { onClick: () => setIsOpen(false), className: "text-gray-400 hover:text-gray-600 transition-colors", "aria-label": "Close chat", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "h-full", children: _jsx(CopilotChat, { config: config, onSendMessage: onSendMessage, className: "flex flex-col h-full bg-white" }) })] }) })] }))] }));
}
export default FloatingCopilot;
