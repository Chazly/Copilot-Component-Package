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

// Standard MCP runner: calls Next.js API (/api/mcp/tools/call) with context
export function createMcpRunner(opts: {
  baseUrl?: string
  contextProvider?: () => Promise<{ businessId?: string; sessionId?: string; userId?: string } | undefined>
} = {}) {
  const baseUrl = opts.baseUrl || '/api/mcp/tools/call'
  return async function run(toolName: string, args: any): Promise<ToolResult<any>> {
    const ctx = opts.contextProvider ? await opts.contextProvider() : undefined
    if (!ctx?.businessId) {
      return fail('Select a business to continue', { reason: 'missing_businessId' }, 'BUSINESS_REQUIRED')
    }
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': String(ctx.sessionId || ''),
          'x-user-id': String(ctx.userId || ''),
          'x-business-id': String(ctx.businessId)
        },
        body: JSON.stringify({ name: toolName, args })
      })
      if (!res.ok) {
        const text = await res.text()
        return fail(`MCP HTTP ${res.status}`, { body: text }, 'MCP_HTTP')
      }
      // Support SSE aggregation when content-type is text/event-stream
      const ctype = res.headers.get('Content-Type') || ''
      if (ctype.includes('text/event-stream') && res.body) {
        const data = await aggregateSseToPromise(res.body)
        return ok(data)
      }
      const data = await res.json().catch(async () => JSON.parse(await res.text()))
      return ok(data)
    } catch (e: any) {
      return fail(e instanceof Error ? e.message : String(e), { stack: e?.stack }, 'MCP_FETCH')
    }
  }
}


