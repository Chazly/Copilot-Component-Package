import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bot, User, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useCopilotChat } from '../hooks/useCopilotChat';
import { useCopilotConfig } from '../hooks/useCopilotConfig';
import { isAICopilotConfig, isLegacyCopilotConfig } from '../types';
import { processMarkdown } from '../lib/utils';
const colorConfig = {
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
};
// Preset className for ResizableLayout usage
export const RESIZABLE_PANEL_CLASSNAME = "flex flex-col bg-white h-full w-full border border-gray-200 rounded-lg shadow-sm";
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
};
// Extract config properties for both types
function getConfigProperties(config) {
    var _a, _b, _c;
    if (isLegacyCopilotConfig(config)) {
        // Legacy config mapping
        return {
            title: config.title,
            subtitle: config.subtitle,
            initialMessage: config.initialMessage,
            colors: colorConfig[config.color],
            layout: 'chatbox',
            showAvatar: true,
            avatarUrl: undefined,
            placeholder: `Ask about ${config.title.toLowerCase()}...`
        };
    }
    else if (isAICopilotConfig(config)) {
        // New AI config mapping
        const layout = ((_a = config.uiConfig) === null || _a === void 0 ? void 0 : _a.layout) || 'chatbox';
        const defaultColor = 'blue'; // fallback for AI config
        return {
            title: config.name,
            subtitle: config.description || '',
            initialMessage: config.firstMessage,
            colors: colorConfig[defaultColor], // AI config uses theme instead of colors
            layout: layout,
            showAvatar: ((_b = config.uiConfig) === null || _b === void 0 ? void 0 : _b.showAvatar) !== false,
            avatarUrl: (_c = config.persona) === null || _c === void 0 ? void 0 : _c.avatarUrl,
            placeholder: `Ask ${config.name}...`
        };
    }
    // Fallback
    return {
        title: 'AI Assistant',
        subtitle: 'How can I help?',
        initialMessage: 'Hello! How can I assist you today?',
        colors: colorConfig.blue,
        layout: 'chatbox',
        showAvatar: true,
        avatarUrl: undefined,
        placeholder: 'Ask me anything...'
    };
}
function ChatHeader({ title, subtitle, showAvatar, avatarUrl, colors, layout }) {
    const styles = layoutConfig[layout];
    return (_jsxs("header", { className: `flex items-center gap-2 border-b border-gray-200 ${styles.header}`, children: [showAvatar && (_jsx("span", { className: `flex ${styles.avatar} items-center justify-center rounded-full ${colors.headerBg}`, children: avatarUrl ? (_jsx("img", { src: avatarUrl, alt: "Avatar", className: `${styles.avatar} rounded-full object-cover` })) : (_jsx(Bot, { className: `${styles.avatarIcon} text-white` })) })), _jsxs("div", { className: "flex-1", children: [_jsx("h1", { className: `font-semibold text-gray-900 ${layout === 'fullpage' ? 'text-base' : 'text-sm'}`, children: title }), subtitle && (_jsx("p", { className: `text-gray-500 ${layout === 'fullpage' ? 'text-sm' : 'text-xs'}`, children: subtitle }))] })] }));
}
function ChatMessages({ messages, isLoading, showAvatar, avatarUrl, colors, layout }) {
    const styles = layoutConfig[layout];
    // Helper function to detect streaming placeholder messages
    const isStreamingPlaceholder = (message) => {
        return message.sender === 'assistant' && message.content === '' && isLoading;
    };
    // Check if we have any streaming placeholder messages
    const hasStreamingPlaceholder = messages.some(isStreamingPlaceholder);
    return (_jsx("div", { className: `${styles.messages}`, children: _jsxs("div", { className: `space-y-3 ${layout === 'chatbox' ? 'p-4' : layout === 'sidebar' ? 'p-3' : 'p-6'}`, children: [messages.length === 0 && !isLoading && (_jsx("div", { className: "text-center py-8 text-gray-500", children: _jsx("p", { className: layout === 'fullpage' ? 'text-sm' : 'text-xs', children: "Start a conversation to get help" }) })), messages.map((message) => (_jsxs("div", { className: `flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`, children: [message.sender === 'assistant' && showAvatar && (_jsx("div", { className: `${styles.avatar} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`, children: avatarUrl ? (_jsx("img", { src: avatarUrl, alt: "Assistant", className: "w-full h-full rounded-full object-cover" })) : (_jsx(Bot, { className: `${styles.avatarIcon} text-gray-600` })) })), _jsxs("div", { className: `
              max-w-[80%] rounded-lg px-3 py-2 
              ${message.sender === 'user'
                                ? `${colors.userBg} ${colors.userText}`
                                : 'bg-gray-100 text-gray-900'}
            `, children: [isStreamingPlaceholder(message) ? (
                                // Show loading dots inside the message bubble
                                _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] })) : (
                                // Show normal message content
                                _jsx("div", { className: styles.messageText, dangerouslySetInnerHTML: { __html: processMarkdown(message.content) } })), message.timestamp && (_jsx("div", { className: `${styles.timestampText} opacity-70 mt-1 ${message.sender === 'user' ? 'text-gray-600' : 'text-gray-500'}`, children: message.timestamp.toLocaleTimeString() }))] }), message.sender === 'user' && showAvatar && (_jsx("div", { className: `${styles.avatar} rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0`, children: _jsx(User, { className: `${styles.avatarIcon} text-white` }) }))] }, message.id))), isLoading && !hasStreamingPlaceholder && (_jsxs("div", { className: "flex items-start gap-2 justify-start", children: [showAvatar && (_jsx("div", { className: `${styles.avatar} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`, children: avatarUrl ? (_jsx("img", { src: avatarUrl, alt: "Assistant", className: "w-full h-full rounded-full object-cover" })) : (_jsx(Bot, { className: `${styles.avatarIcon} text-gray-600` })) })), _jsx("div", { className: "bg-gray-100 text-gray-900 rounded-lg px-3 py-2", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) })] }))] }) }));
}
function ChatInput({ input, setInput, sendMsg, isLoading, placeholder, colors, layout }) {
    const styles = layoutConfig[layout];
    return (_jsx("div", { className: `border-t border-gray-200 ${styles.input}`, children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: input, onChange: (e) => setInput(e.target.value), placeholder: placeholder, onKeyDown: (e) => e.key === "Enter" && !isLoading && sendMsg(), className: `flex-1 ${styles.inputField}`, disabled: isLoading }), _jsx(Button, { onClick: sendMsg, size: "sm", className: `${styles.button} p-0 ${colors.buttonBg} ${colors.buttonHover}`, disabled: isLoading, children: _jsx(Send, { className: `${styles.avatarIcon}` }) })] }) }));
}
// Main CopilotChat Component
export function CopilotChat({ config, onSendMessage, className }) {
    const { config: normalizedConfig } = useCopilotConfig(config);
    const configProps = getConfigProperties(config);
    const { messages, input, setInput, sendMsg, isLoading } = useCopilotChat(normalizedConfig, onSendMessage);
    // Show deprecation warning for legacy config in development
    if (isLegacyCopilotConfig(config) && (process.env.NODE_ENV === 'development' || typeof window !== 'undefined')) {
        console.warn('CopilotChat: Using legacy CopilotConfig. Consider migrating to AICopilotConfig for advanced features.');
    }
    const styles = layoutConfig[configProps.layout];
    const finalClassName = className || styles.container;
    return (_jsxs("div", { className: finalClassName, children: [_jsx(ChatHeader, { title: configProps.title, subtitle: configProps.subtitle, showAvatar: configProps.showAvatar, avatarUrl: configProps.avatarUrl, colors: configProps.colors, layout: configProps.layout }), _jsx(ChatMessages, { messages: messages, isLoading: isLoading, showAvatar: configProps.showAvatar, avatarUrl: configProps.avatarUrl, colors: configProps.colors, layout: configProps.layout }), _jsx(ChatInput, { input: input, setInput: setInput, sendMsg: sendMsg, isLoading: isLoading, placeholder: configProps.placeholder, colors: configProps.colors, layout: configProps.layout })] }));
}
