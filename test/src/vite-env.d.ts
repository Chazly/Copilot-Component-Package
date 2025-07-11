/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_OPENAI_DEFAULT_MODEL?: string
  readonly VITE_OPENAI_FALLBACK_MODEL?: string
  readonly VITE_OPENAI_AVAILABLE_MODELS?: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 