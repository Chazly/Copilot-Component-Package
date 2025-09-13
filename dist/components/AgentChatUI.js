import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export function AgentChatUI({ agent }) {
    const [messages, setMessages] = React.useState(agent.getMessages());
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    React.useEffect(() => {
        const onMessage = () => setMessages(agent.getMessages());
        const onLoading = (v) => setLoading(v);
        agent.on('message', onMessage);
        agent.on('loading', onLoading);
    }, [agent]);
    return (_jsxs("div", { className: "flex flex-col h-full border border-gray-200 rounded-lg", children: [_jsx("div", { className: "p-3 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center gap-2", children: [agent.avatarUrl && _jsx("img", { src: agent.avatarUrl, className: "w-6 h-6 rounded-full" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-sm", children: agent.name }), _jsx("div", { className: "text-[11px] text-gray-500", children: agent.description })] })] }) }), _jsxs("div", { className: "flex-1 overflow-auto p-3 space-y-2", children: [messages.map(m => (_jsx("div", { className: m.sender === 'user' ? 'text-right' : 'text-left', children: _jsx("span", { className: `inline-block px-3 py-2 rounded ${m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`, children: m.content }) }, m.id))), loading && _jsx("div", { className: "text-gray-500 text-xs", children: "Thinking\u2026" })] }), _jsxs("div", { className: "p-2 border-t border-gray-200 flex gap-2", children: [_jsx("input", { className: "flex-1 border px-2 py-1 rounded text-sm", value: input, onChange: e => setInput(e.target.value), onKeyDown: e => e.key === 'Enter' && agent.send(input) }), _jsx("button", { className: "px-3 py-1 bg-black text-white rounded text-sm", onClick: () => agent.send(input), children: "Send" })] })] }));
}
export default AgentChatUI;
