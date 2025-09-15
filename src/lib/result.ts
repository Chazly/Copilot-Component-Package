export type ResultToTextOptions = {
  maxLen?: number
  onFallback?: (info: { reason: 'json_fallback'; length: number }) => void
}

// Normalize any model/tool result into short, UI-safe text
export function resultToText(result: any, options: ResultToTextOptions = {}): string {
  const maxLen = typeof options.maxLen === 'number' && options.maxLen > 0 ? options.maxLen : 4000

  // Prefer direct string
  if (typeof result === 'string') return clamp(result, maxLen)

  // Prefer OpenAI-like choices[0].message.content
  try {
    if (result && result.choices && result.choices[0]) {
      const choice = result.choices[0]
      const content = choice?.message?.content || choice?.text || ''
      if (content) return clamp(String(content), maxLen)
    }
  } catch {}

  // If object or array, provide short JSON code block fallback
  try {
    const body = JSON.stringify(result, null, 2)
    const trimmed = clamp(body, Math.max(512, Math.min(2000, maxLen)))
    if (options.onFallback) options.onFallback({ reason: 'json_fallback', length: trimmed.length })
    return '```json\n' + trimmed + '\n```'
  } catch {}

  // Last resort
  return clamp(String(result ?? ''), maxLen)
}

function clamp(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '…'
}


