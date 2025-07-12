import { useState } from 'react';
import { useModelProvider } from './useModelProvider';
// Convert Message to ChatMessage format
function messageToProviderFormat(message) {
    return {
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.content,
        timestamp: message.timestamp
    };
}
// Enhanced hook with provider abstraction
export function useCopilotChat(config, onSendMessage) {
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
            if (shouldUseProvider && modelProvider.isReady) {
                // Use AI provider abstraction
                const chatMessages = messages.map(messageToProviderFormat);
                chatMessages.push(messageToProviderFormat(outgoing));
                const response = await modelProvider.sendMessage(chatMessages, config.systemPrompt);
                responseContent = response.content;
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
            await modelProvider.sendMessageStream(chatMessages, (chunk) => {
                // Hide loading dots as soon as first chunk arrives
                if (isFirstChunk && chunk.content) {
                    setIsLoading(false);
                    isFirstChunk = false;
                }
                setMessages((m) => m.map(msg => msg.id === responseId
                    ? Object.assign(Object.assign({}, msg), { content: msg.content + chunk.content }) : msg));
                // Keep this for backwards compatibility/fallback
                if (chunk.isComplete) {
                    setIsLoading(false);
                }
            }, config.systemPrompt);
        }
        catch (error) {
            console.error('Error streaming message:', error);
            const errorMessage = config.fallbackMessage || "Sorry, I encountered an error. Please try again.";
            setMessages((m) => m.map(msg => msg.id === responseId
                ? Object.assign(Object.assign({}, msg), { content: errorMessage }) : msg));
            setIsLoading(false);
        }
    };
    return {
        messages,
        input,
        setInput,
        sendMsg: ((_a = config.performance) === null || _a === void 0 ? void 0 : _a.streamingEnabled) ? sendMsgStream : sendMsg,
        sendMsgStream,
        isLoading,
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
