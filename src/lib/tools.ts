export const sanitizeToolName = (value: string): string => String(value).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_')

export const unsanitizeToolName = (value: string): string => String(value).replace(/_/g, ' ')

export type ToolRunner<TInput = any, TOutput = any> = (args: TInput) => Promise<TOutput>

// Compile-time contract helper ensuring runner returns string | Json-serializable
export type JsonSerializable = string | number | boolean | null | JsonSerializable[] | { [key: string]: JsonSerializable }

// Wrap tool runners with context injection and result normalization policy
export function wrapToolRunners<T extends Record<string, ToolRunner<any, any>>>(opts: {
  runners: T
  contextProvider?: () => Promise<{ businessId?: string; sessionId?: string; userId?: string } | undefined>
  normalize?: (value: any) => string
}): T {
  const out: Record<string, any> = {}
  for (const [name, runner] of Object.entries(opts.runners)) {
    out[name] = async (args: any) => {
      const ctx = opts.contextProvider ? await opts.contextProvider() : undefined
      if (!ctx?.businessId) throw new Error('Select a business to continue')
      const result = await runner(args)
      return opts.normalize ? opts.normalize(result) : result
    }
  }
  return out as T
}


