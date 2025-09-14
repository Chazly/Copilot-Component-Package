// MCP helpers: SSE aggregation and result envelope

export type McpSseEvent = { type: 'progress' | 'data' | 'done' | 'error'; data?: any; message?: string }

export async function aggregateSseToPromise(stream: ReadableStream<Uint8Array>, onProgress?: (p: any) => void): Promise<any> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const payload = line.startsWith('data: ') ? line.slice(6) : line
      if (!payload.trim()) continue
      if (payload.trim() === '[DONE]') return
      try {
        const evt: McpSseEvent = JSON.parse(payload)
        if (evt.type === 'progress' && onProgress) onProgress(evt.data)
        if (evt.type === 'data') return evt.data
        if (evt.type === 'error') throw new Error(evt.message || 'MCP error')
      } catch {
        // ignore parse errors and continue
      }
    }
  }
  return undefined
}

export type ToolSuccess<T = any> = { ok: true; data: T; error?: undefined }
export type ToolFailure = { ok: false; error: { code?: string; message: string; details?: any } }
export type ToolResult<T = any> = ToolSuccess<T> | ToolFailure

export function ok<T = any>(data: T): ToolResult<T> { return { ok: true, data } }
export function fail(message: string, details?: any, code?: string): ToolResult<never> { return { ok: false, error: { code, message, details } } }


