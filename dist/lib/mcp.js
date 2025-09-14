// MCP helpers: SSE aggregation and result envelope
export async function aggregateSseToPromise(stream, onProgress) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            const payload = line.startsWith('data: ') ? line.slice(6) : line;
            if (!payload.trim())
                continue;
            if (payload.trim() === '[DONE]')
                return;
            try {
                const evt = JSON.parse(payload);
                if (evt.type === 'progress' && onProgress)
                    onProgress(evt.data);
                if (evt.type === 'data')
                    return evt.data;
                if (evt.type === 'error')
                    throw new Error(evt.message || 'MCP error');
            }
            catch (_a) {
                // ignore parse errors and continue
            }
        }
    }
    return undefined;
}
export function ok(data) { return { ok: true, data }; }
export function fail(message, details, code) { return { ok: false, error: { code, message, details } }; }
