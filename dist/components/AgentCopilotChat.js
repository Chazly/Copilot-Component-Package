import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Bot, User, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
// This mirrors the existing CopilotChat look-and-feel but reads state from the agent
const layout = {
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
};
export function AgentCopilotChat({ agent, className }) {
    const [messages, setMessages] = React.useState(agent.getMessages());
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    React.useEffect(() => {
        const onMsg = () => setMessages(agent.getMessages());
        const onLoad = (v) => setLoading(v);
        agent.on('message', onMsg);
        agent.on('loading', onLoad);
    }, [agent]);
    const container = className || layout.container;
    return (_jsxs("div", { className: container, children: [_jsxs("header", { className: `flex items-center gap-2 border-b border-gray-200 ${layout.header}`, children: [_jsx("span", { className: `flex ${layout.avatar} items-center justify-center rounded-full bg-blue-600`, children: agent.avatarUrl ? (_jsx("img", { src: agent.avatarUrl, alt: "Avatar", className: `${layout.avatar} rounded-full object-cover` })) : (_jsx(Bot, { className: `${layout.avatarIcon} text-white` })) }), _jsxs("div", { className: "flex-1", children: [_jsx("h1", { className: `font-semibold text-gray-900 text-sm`, children: agent.name || 'AI Assistant' }), agent.description && _jsx("p", { className: `text-gray-500 text-xs`, children: agent.description })] })] }), _jsx("div", { className: `${layout.messages}`, children: _jsxs("div", { className: `space-y-3 p-4`, children: [messages.length === 0 && !loading && (_jsx("div", { className: "text-center py-8 text-gray-500", children: _jsx("p", { className: 'text-xs', children: "Start a conversation to get help" }) })), messages.map((m) => (_jsxs("div", { className: `flex items-start gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`, children: [m.sender === 'assistant' && (_jsx("div", { className: `${layout.avatar} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`, children: agent.avatarUrl ? (_jsx("img", { src: agent.avatarUrl, alt: "Assistant", className: "w-full h-full rounded-full object-cover" })) : (_jsx(Bot, { className: `${layout.avatarIcon} text-gray-600` })) })), _jsxs("div", { className: `max-w-[80%] rounded-lg px-3 py-2 ${m.sender === 'user' ? 'bg-white text-black' : 'bg-gray-100 text-gray-900'}`, children: [_jsx("div", { className: layout.messageText, children: m.content }), m.timestamp && (_jsx("div", { className: `${layout.timestampText} opacity-70 mt-1 ${m.sender === 'user' ? 'text-gray-600' : 'text-gray-500'}`, children: m.timestamp.toLocaleTimeString() }))] }), m.sender === 'user' && (_jsx("div", { className: `${layout.avatar} rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0`, children: _jsx(User, { className: `${layout.avatarIcon} text-white` }) }))] }, m.id))), loading && (_jsxs("div", { className: "flex items-start gap-2 justify-start", children: [_jsx("div", { className: `${layout.avatar} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`, children: agent.avatarUrl ? (_jsx("img", { src: agent.avatarUrl, alt: "Assistant", className: "w-full h-full rounded-full object-cover" })) : (_jsx(Bot, { className: `${layout.avatarIcon} text-gray-600` })) }), _jsx("div", { className: "bg-gray-100 text-gray-900 rounded-lg px-3 py-2", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) })] }))] }) }), _jsx("div", { className: `border-t border-gray-200 ${layout.input}`, children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: input, onChange: (e) => setInput(e.target.value), placeholder: `Ask ${agent.name || 'the copilot'}...`, onKeyDown: (e) => e.key === 'Enter' && !loading && agent.send(input), className: `flex-1 ${layout.inputField}`, disabled: loading }), _jsx(Button, { onClick: () => agent.send(input), size: "sm", className: `${layout.button} p-0 bg-blue-600 hover:bg-blue-700`, disabled: loading, children: _jsx(Send, { className: `${layout.avatarIcon}` }) })] }) })] }));
}
export default AgentCopilotChat;
