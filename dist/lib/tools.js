export const sanitizeToolName = (value) => String(value).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_');
export const unsanitizeToolName = (value) => String(value).replace(/_/g, ' ');
