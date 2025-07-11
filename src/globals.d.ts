// Global type definitions for Node.js environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'test'
    OPENAI_API_KEY?: string
    OPENAI_DEFAULT_MODEL?: string
    OPENAI_FALLBACK_MODEL?: string
    OPENAI_AVAILABLE_MODELS?: string
  }
}

// Global process declaration for browser environment
declare const process: {
  env: {
    NODE_ENV?: 'development' | 'production' | 'test'
    OPENAI_API_KEY?: string
    OPENAI_DEFAULT_MODEL?: string
    OPENAI_FALLBACK_MODEL?: string
    OPENAI_AVAILABLE_MODELS?: string
  }
}

// Vite environment variables (browser accessible)
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_OPENAI_DEFAULT_MODEL?: string
  readonly VITE_OPENAI_FALLBACK_MODEL?: string
  readonly VITE_OPENAI_AVAILABLE_MODELS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 