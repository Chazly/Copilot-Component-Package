export const sanitizeToolName = (value: string): string => String(value).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_')

export const unsanitizeToolName = (value: string): string => String(value).replace(/_/g, ' ')


