import { useState } from 'react';
import { useModelProvider } from './useModelProvider';
import { parseChoicesFromText } from '../lib/utils';
// Convert Message to ChatMessage format
function messageToProviderFormat(message) {
    return {
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.content,
        timestamp: message.timestamp
    };
}
// Enhanced hook with provider abstraction
export function useCopilotChat(config, onSendMessage, options) {
    var _a, _b;
    const [messages, setMessages] = useState([
        {
            id: "1",
            content: config.firstMessage,
            sender: "assistant",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // Use provider abstraction for AI configs
    const shouldUseProvider = !config.isLegacyConfig;
    const modelProvider = useModelProvider(config);
    const resolveContextString = async () => {
        const ctx = options === null || options === void 0 ? void 0 : options.context;
        if (!ctx)
            return undefined;
        if (typeof ctx === 'function') {
            const val = await ctx();
            return typeof val === 'string' ? val : String(val);
        }
        return ctx;
    };
    const resolveToolContext = async () => {
        const ctx = options === null || options === void 0 ? void 0 : options.toolContext;
        if (!ctx)
            return undefined;
        if (typeof ctx === 'function') {
            return await ctx();
        }
        return ctx;
    };
    const buildSystemPromptWithContext = async () => {
        const ctx = await resolveContextString();
        if (!ctx)
            return config.systemPrompt;
        const sessionPrefix = '[SESSION_CONTEXT] ';
        const merged = `${sessionPrefix}${ctx}`;
        if (!config.systemPrompt)
            return merged;
        return `${merged}\n${config.systemPrompt}`;
    };
    const sendMsg = async () => {
        var _a, _b, _c, _d, _e;
        if (!input.trim() || isLoading)
            return;
        const outgoing = {
            id: crypto.randomUUID(),
            content: input.trim(),
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((m) => [...m, outgoing]);
        const userMessage = input.trim();
        setInput("");
        setIsLoading(true);
        try {
            let responseContent;
            if (shouldUseProvider && modelProvider.isReady) {
                // Use AI provider abstraction
                const chatMessages = messages.map(messageToProviderFormat);
                chatMessages.push(messageToProviderFormat(outgoing));
                const toolChoice = ((_a = config.toolCalls) === null || _a === void 0 ? void 0 : _a.toolChoice) === 'auto' || !((_b = config.toolCalls) === null || _b === void 0 ? void 0 : _b.toolChoice)
                    ? 'auto'
                    : { type: 'function', function: { name: ((_c = config.toolCalls) === null || _c === void 0 ? void 0 : _c.toolChoice).name } };
                const debugEnabled = !!((_d = config.toolCalls) === null || _d === void 0 ? void 0 : _d.debug);
                const response = await modelProvider.sendMessage(chatMessages, await buildSystemPromptWithContext(), options === null || options === void 0 ? void 0 : options.tools, toolChoice, debugEnabled);
                responseContent = response.content;
                // Handle model tool-calls (OpenAI function calling or equivalent)
                const toolCalls = (_e = response === null || response === void 0 ? void 0 : response.metadata) === null || _e === void 0 ? void 0 : _e.toolCalls;
                if (toolCalls && toolCalls.length && (options === null || options === void 0 ? void 0 : options.tools) && options.tools.length) {
                    const sanitize = (s) => String(s).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_');
                    for (const call of toolCalls) {
                        const tool = options.tools.find(t => sanitize(t.id) === call.name || sanitize(t.name) === call.name);
                        if (!tool)
                            continue;
                        try {
                            const result = await callRuntimeTool(tool, call.arguments || {});
                            if ((tool.transport || 'sse') === 'http') {
                                const content = typeof result === 'string' ? result : '```json\n' + JSON.stringify(result, null, 2) + '\n```';
                                setMessages(m => [...m, { id: crypto.randomUUID(), content, sender: 'assistant', timestamp: new Date() }]);
                            }
                        }
                        catch (e) {
                            setMessages(m => [...m, { id: crypto.randomUUID(), content: `Tool '${tool.name}' failed.`, sender: 'assistant', timestamp: new Date() }]);
                        }
                    }
                }
            }
            else if (onSendMessage) {
                // Use legacy callback
                responseContent = await onSendMessage(userMessage);
            }
            else {
                // Default fallback response
                responseContent = config.fallbackMessage || "I can help you with that! What specific area would you like to focus on?";
            }
            setTimeout(() => {
                const parsed = parseChoicesFromText(responseContent);
                setMessages((m) => [
                    ...m,
                    {
                        id: crypto.randomUUID(),
                        content: parsed.remainingText,
                        sender: "assistant",
                        timestamp: new Date(),
                        choices: parsed.choices || undefined
                    },
                ]);
                setIsLoading(false);
            }, 800);
        }
        catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = config.fallbackMessage || "Sorry, I encountered an error. Please try again.";
            setMessages((m) => [
                ...m,
                {
                    id: crypto.randomUUID(),
                    content: errorMessage,
                    sender: "assistant",
                    timestamp: new Date(),
                },
            ]);
            setIsLoading(false);
        }
    };
    // Streaming message support for AI providers
    const sendMsgStream = async () => {
        var _a, _b, _c, _d;
        if (!input.trim() || isLoading || !shouldUseProvider || !modelProvider.isReady) {
            return sendMsg(); // Fallback to regular message
        }
        const outgoing = {
            id: crypto.randomUUID(),
            content: input.trim(),
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((m) => [...m, outgoing]);
        setInput("");
        setIsLoading(true);
        // Create placeholder for streaming response
        const responseId = crypto.randomUUID();
        const responseMessage = {
            id: responseId,
            content: "",
            sender: "assistant",
            timestamp: new Date(),
        };
        setMessages((m) => [...m, responseMessage]);
        // Track if this is the first chunk to hide loading dots immediately
        let isFirstChunk = true;
        try {
            const chatMessages = messages.map(messageToProviderFormat);
            chatMessages.push(messageToProviderFormat(outgoing));
            // streaming with tool_call delta buffering
            const pendingToolCalls = {};
            const debugEnabled = !!((_a = config.toolCalls) === null || _a === void 0 ? void 0 : _a.debug);
            const toolChoice = ((_b = config.toolCalls) === null || _b === void 0 ? void 0 : _b.toolChoice) === 'auto' || !((_c = config.toolCalls) === null || _c === void 0 ? void 0 : _c.toolChoice)
                ? 'auto'
                : { type: 'function', function: { name: ((_d = config.toolCalls) === null || _d === void 0 ? void 0 : _d.toolChoice).name } };
            await modelProvider.sendMessageStream(chatMessages, (chunk) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                // Buffer tool_call deltas if configured
                const allowStreamingToolCalls = !!((_b = (_a = config.toolCalls) === null || _a === void 0 ? void 0 : _a.streaming) === null || _b === void 0 ? void 0 : _b.enabled);
                if (allowStreamingToolCalls && chunk.raw && ((_e = (_d = (_c = chunk.raw.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.tool_calls)) {
                    try {
                        const deltas = chunk.raw.choices[0].delta.tool_calls;
                        for (const d of deltas) {
                            const id = String(d.id || d.index || '0');
                            if (!pendingToolCalls[id])
                                pendingToolCalls[id] = { argumentsText: '' };
                            if ((_f = d.function) === null || _f === void 0 ? void 0 : _f.name)
                                pendingToolCalls[id].name = d.function.name;
                            if (typeof ((_g = d.function) === null || _g === void 0 ? void 0 : _g.arguments) === 'string')
                                pendingToolCalls[id].argumentsText += d.function.arguments;
                        }
                    }
                    catch (_m) { }
                    return;
                }
                // Hide loading dots as soon as first chunk arrives
                if (isFirstChunk && chunk.content) {
                    setIsLoading(false);
                    isFirstChunk = false;
                }
                setMessages((m) => {
                    const updated = m.map(msg => msg.id === responseId
                        ? Object.assign(Object.assign({}, msg), { content: msg.content + (chunk.content || '') }) : msg);
                    // As content grows, try to parse choices without being too aggressive
                    const target = updated.find(msg => msg.id === responseId);
                    if (target) {
                        const parsed = parseChoicesFromText(target.content);
                        target.content = parsed.remainingText;
                        target.choices = parsed.choices || undefined;
                    }
                    return [...updated];
                });
                // Keep this for backwards compatibility/fallback
                if (chunk.isComplete) {
                    setIsLoading(false);
                    // If we buffered tool_calls, finalize and invoke them
                    const allowStreamingToolCalls = !!((_j = (_h = config.toolCalls) === null || _h === void 0 ? void 0 : _h.streaming) === null || _j === void 0 ? void 0 : _j.enabled);
                    const route = (_k = config.toolCalls) === null || _k === void 0 ? void 0 : _k.route;
                    const transport = ((_l = config.toolCalls) === null || _l === void 0 ? void 0 : _l.transport) || 'sse';
                    if (allowStreamingToolCalls && route) {
                        const buffered = Object.values(pendingToolCalls).filter(tc => tc.name);
                        if (debugEnabled) {
                            try {
                                console.debug('[Copilot][tool_calls][buffered]', buffered);
                            }
                            catch (_o) { }
                        }
                        for (const tc of buffered) {
                            try {
                                const args = (() => { try {
                                    return JSON.parse(tc.argumentsText || '{}');
                                }
                                catch (_a) {
                                    return {};
                                } })();
                                const tool = ((options === null || options === void 0 ? void 0 : options.tools) || []).find(t => {
                                    const sanitize = (s) => String(s).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_');
                                    return sanitize(t.id) === tc.name || sanitize(t.name) === tc.name;
                                });
                                if (!tool)
                                    continue;
                                const effectiveTool = Object.assign(Object.assign({}, tool), { route, transport });
                                if (debugEnabled) {
                                    try {
                                        console.debug('[Copilot][tool_calls][invoke]', { name: tc.name, args, route, transport });
                                    }
                                    catch (_p) { }
                                }
                                const result = await callRuntimeTool(effectiveTool, args);
                                if (debugEnabled) {
                                    try {
                                        console.debug('[Copilot][tool_calls][result]', result);
                                    }
                                    catch (_q) { }
                                }
                            }
                            catch (e) {
                                if (debugEnabled) {
                                    try {
                                        console.debug('[Copilot][tool_calls][error]', e);
                                    }
                                    catch (_r) { }
                                }
                            }
                        }
                    }
                }
            }, await buildSystemPromptWithContext(), options === null || options === void 0 ? void 0 : options.tools, toolChoice, debugEnabled);
        }
        catch (error) {
            console.error('Error streaming message:', error);
            const errorMessage = config.fallbackMessage || "Sorry, I encountered an error. Please try again.";
            setMessages((m) => m.map(msg => msg.id === responseId
                ? Object.assign(Object.assign({}, msg), { content: errorMessage }) : msg));
            setIsLoading(false);
        }
    };
    // Tool invocation: POST HTTP or SSE streaming
    const callRuntimeTool = async (tool, parameters) => {
        const contextPayload = await resolveToolContext();
        const body = {
            toolId: tool.id,
            parameters,
            context: contextPayload || {}
        };
        if (tool.transport === 'http') {
            const resp = await fetch(tool.route, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!resp.ok)
                throw new Error(`Tool HTTP ${resp.status}`);
            return await resp.json();
        }
        // SSE default
        const resp = await fetch(tool.route, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!resp.body)
            throw new Error('No SSE stream');
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let final = null;
        let assistantMsgId = null;
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(l => l.trim());
                for (const line of lines) {
                    const dataLine = line.startsWith('data: ') ? line.slice(6) : line;
                    if (dataLine.trim() === '[DONE]') {
                        break;
                    }
                    try {
                        const data = JSON.parse(dataLine);
                        const content = typeof data === 'string' ? data : (data.delta || data.content || '');
                        if (content) {
                            // create placeholder if needed
                            if (!assistantMsgId) {
                                assistantMsgId = crypto.randomUUID();
                                setMessages(m => [...m, { id: assistantMsgId, content: '', sender: 'assistant', timestamp: new Date() }]);
                            }
                            const idToUpdate = assistantMsgId;
                            setMessages(m => m.map(msg => msg.id === idToUpdate ? Object.assign(Object.assign({}, msg), { content: msg.content + content }) : msg));
                        }
                        if (data.final)
                            final = data.final;
                    }
                    catch (_a) { }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        return final;
    };
    return {
        messages,
        input,
        setInput,
        sendMsg: ((_a = config.performance) === null || _a === void 0 ? void 0 : _a.streamingEnabled) ? sendMsgStream : sendMsg,
        sendMsgStream,
        isLoading,
        callRuntimeTool,
        // Provider information
        providerStatus: shouldUseProvider ? {
            isReady: modelProvider.isReady,
            currentProvider: (_b = modelProvider.currentProvider) === null || _b === void 0 ? void 0 : _b.name,
            availableProviders: modelProvider.availableProviders,
            error: modelProvider.error,
            metrics: modelProvider.metrics
        } : null,
        // Provider controls
        switchProvider: shouldUseProvider ? modelProvider.switchProvider : undefined,
        refreshProvider: shouldUseProvider ? modelProvider.refreshProviderHealth : undefined
    };
}
// Legacy compatibility function
export function useLegacyCopilotChat(initialMessage, onSendMessage) {
    const [messages, setMessages] = useState([
        {
            id: "1",
            content: initialMessage,
            sender: "assistant",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const sendMsg = async () => {
        if (!input.trim() || isLoading)
            return;
        const outgoing = {
            id: crypto.randomUUID(),
            content: input.trim(),
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((m) => [...m, outgoing]);
        const userMessage = input.trim();
        setInput("");
        setIsLoading(true);
        try {
            let responseContent;
            if (onSendMessage) {
                responseContent = await onSendMessage(userMessage);
            }
            else {
                // Default fallback response
                responseContent = "I can help you with that! What specific area would you like to focus on?";
            }
            setTimeout(() => {
                setMessages((m) => [
                    ...m,
                    {
                        id: crypto.randomUUID(),
                        content: responseContent,
                        sender: "assistant",
                        timestamp: new Date(),
                    },
                ]);
                setIsLoading(false);
            }, 800);
        }
        catch (error) {
            console.error('Error sending message:', error);
            setMessages((m) => [
                ...m,
                {
                    id: crypto.randomUUID(),
                    content: "Sorry, I encountered an error. Please try again.",
                    sender: "assistant",
                    timestamp: new Date(),
                },
            ]);
            setIsLoading(false);
        }
    };
    return {
        messages,
        input,
        setInput,
        sendMsg,
        isLoading
    };
}
export default useCopilotChat;
