/**
 * Centralized Environment Detection and Variable Management
 * Framework-agnostic utility for handling environment variables across Next.js, Vite, and other frameworks
 */

export type FrameworkType = 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown'

export interface EnvironmentConfig {
  apiKey: string
  defaultModel?: string
  isClientSide: boolean
  framework: FrameworkType
  isProduction: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  framework: FrameworkType
  hasApiKey: boolean
  environmentInfo: {
    isClient: boolean
    isServer: boolean
    hasProcessEnv: boolean
    hasImportMeta: boolean
  }
}

/**
 * Safely access import.meta.env
 */
function getImportMetaEnv(): Record<string, any> | undefined {
  try {
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
      return (window as any).import.meta.env
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Safely access process.env with proper typing
 */
function getProcessEnv(): Record<string, string | undefined> {
  if (typeof process !== 'undefined' && process.env) {
    return process.env as Record<string, string | undefined>
  }
  return {}
}

/**
 * Detects the current framework/build system being used
 */
export function detectFramework(): FrameworkType {
  const processEnv = getProcessEnv()
  
  // Check for Next.js
  if (typeof window !== 'undefined') {
    // Client-side detection
    if ((window as any).__NEXT_DATA__) return 'nextjs'
  } else {
    // Server-side detection
    if (processEnv.NEXT_RUNTIME) return 'nextjs'
  }

  // Check for Vite
  const importMetaEnv = getImportMetaEnv()
  if (importMetaEnv) {
    return 'vite'
  }

  // Check for Nuxt
  const hasNuxtEnv = Object.keys(processEnv).some(key => key.startsWith('NUXT_'))
  if (hasNuxtEnv) {
    return 'nuxt'
  }

  // Check for SvelteKit
  if (processEnv.SVELTEKIT) {
    return 'sveltekit'
  }

  // Check for Remix
  if (processEnv.REMIX_DEV_SERVER_WS_PORT) {
    return 'remix'
  }

  // Check for Astro
  if (importMetaEnv && (importMetaEnv as any).ASTRO) {
    return 'astro'
  }

  return 'unknown'
}

/**
 * Safely attempts to get an environment variable with comprehensive fallback chain
 */
function getEnvironmentVariable(key: string): string | undefined {
  const processEnv = getProcessEnv()
  
  // Try server-side environment variables first (most secure)
  if (processEnv[key]) return processEnv[key]
  
  // Next.js client-side public variables
  const nextPublicKey = `NEXT_PUBLIC_${key}`
  if (processEnv[nextPublicKey]) return processEnv[nextPublicKey]

  // Try client-side environment variables (Vite, etc.)
  const importMetaEnv = getImportMetaEnv()
  if (importMetaEnv) {
    // Vite environment variables
    const viteKey = `VITE_${key}`
    if (importMetaEnv[viteKey]) return importMetaEnv[viteKey]
    
    // Direct environment variable access in Vite
    if (importMetaEnv[key]) return importMetaEnv[key]
  }

  // Try window-based environment variables (if injected)
  if (typeof window !== 'undefined' && (window as any).env) {
    if ((window as any).env[key]) return (window as any).env[key]
  }

  return undefined
}

/**
 * Gets the OpenAI API key with comprehensive framework support
 * @throws {Error} When API key is not found (critical error)
 */
export function getApiKey(): string {
  const framework = detectFramework()
  const isClientSide = typeof window !== 'undefined'
  
  // Try multiple API key patterns
  const patterns = [
    'OPENAI_API_KEY',
    'OPENAI_KEY',
    'AI_API_KEY'
  ]

  for (const pattern of patterns) {
    const apiKey = getEnvironmentVariable(pattern)
    if (apiKey) {
      // Warn about client-side API key exposure (security warning)
      if (isClientSide && !pattern.includes('PUBLIC')) {
        console.warn(
          `⚠️  API key detected in client environment. Consider using server-side configuration for better security.\n` +
          `Framework: ${framework}\n` +
          `Pattern: ${pattern}\n` +
          `Recommendation: Use server-side API routes or ensure the key is prefixed properly (NEXT_PUBLIC_, VITE_, etc.)`
        )
      }
      
      return apiKey
    }
  }

  // Critical error - API key not found
  const frameworkGuide = getFrameworkSpecificGuide(framework)
  throw new Error(`OpenAI API key not found. Add one of the following to your environment:\n\n${frameworkGuide}\n\nCurrent framework detected: ${framework}\nEnvironment: ${isClientSide ? 'client-side' : 'server-side'}`)
}

/**
 * Gets the default model with fallback patterns
 */
export function getDefaultModel(): string {
  const patterns = [
    'OPENAI_DEFAULT_MODEL',
    'OPENAI_MODEL',
    'AI_MODEL'
  ]

  for (const pattern of patterns) {
    const model = getEnvironmentVariable(pattern)
    if (model) return model
  }

  // Default fallback
  return 'gpt-4o-latest'
}

/**
 * Provides framework-specific environment variable setup guidance
 */
function getFrameworkSpecificGuide(framework: FrameworkType): string {
  switch (framework) {
    case 'nextjs':
      return `For Next.js:
      Server-side: OPENAI_API_KEY=your-key-here
      Client-side: NEXT_PUBLIC_OPENAI_API_KEY=your-key-here
      Add to .env.local file`
      
    case 'vite':
      return `For Vite:
      VITE_OPENAI_API_KEY=your-key-here
      Add to .env.local file`
      
    case 'nuxt':
      return `For Nuxt:
      NUXT_OPENAI_API_KEY=your-key-here
      NUXT_PUBLIC_OPENAI_API_KEY=your-key-here (for client-side)
      Add to .env file`
      
    case 'sveltekit':
      return `For SvelteKit:
      OPENAI_API_KEY=your-key-here
      PUBLIC_OPENAI_API_KEY=your-key-here (for client-side)
      Add to .env file`
      
    case 'remix':
      return `For Remix:
      OPENAI_API_KEY=your-key-here
      Add to .env file`
      
    default:
      return `Generic setup:
      OPENAI_API_KEY=your-key-here
      VITE_OPENAI_API_KEY=your-key-here (for Vite-based tools)
      NEXT_PUBLIC_OPENAI_API_KEY=your-key-here (for Next.js client-side)`
  }
}

/**
 * Validates the current environment configuration
 */
export function validateEnvironment(): ValidationResult {
  const framework = detectFramework()
  const isClientSide = typeof window !== 'undefined'
  const isServerSide = typeof process !== 'undefined'
  const hasProcessEnv = Object.keys(getProcessEnv()).length > 0
  const hasImportMeta = !!getImportMetaEnv()
  
  const errors: string[] = []
  const warnings: string[] = []
  let hasApiKey = false
  
  // Check for API key
  try {
    getApiKey()
    hasApiKey = true
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }

  // Framework-specific validations
  if (framework === 'unknown') {
    warnings.push('Framework could not be detected. Environment variable detection may be limited.')
  }

  // Client-side security warnings
  if (isClientSide && hasApiKey) {
    const directApiKey = getEnvironmentVariable('OPENAI_API_KEY')
    if (directApiKey) {
      warnings.push('API key detected in client environment without framework-specific prefix. Consider using server-side configuration.')
    }
  }

  // Environment capability warnings
  if (!hasProcessEnv && !hasImportMeta) {
    warnings.push('No environment variable access detected. Ensure your build system supports environment variables.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    framework,
    hasApiKey,
    environmentInfo: {
      isClient: isClientSide,
      isServer: isServerSide,
      hasProcessEnv,
      hasImportMeta
    }
  }
}

/**
 * Attempts to auto-detect and return complete environment configuration
 * @param options.requireApiKey - Whether to throw error if API key is missing
 */
export function detectEnvironment(options: { requireApiKey?: boolean } = {}): EnvironmentConfig {
  const framework = detectFramework()
  const isClientSide = typeof window !== 'undefined'
  const isProduction = getEnvironmentVariable('NODE_ENV') === 'production'
  
  let apiKey: string
  
  if (options.requireApiKey !== false) {
    try {
      apiKey = getApiKey()
    } catch (error) {
      if (options.requireApiKey === true) {
        throw error
      }
      apiKey = '' // Permissive mode
    }
  } else {
    try {
      apiKey = getApiKey()
    } catch {
      apiKey = '' // Permissive mode
    }
  }
  
  return {
    apiKey,
    defaultModel: getDefaultModel(),
    isClientSide,
    framework,
    isProduction
  }
}

/**
 * Helper function for backward compatibility with existing getEnvVar patterns
 * @deprecated Use getApiKey() or getDefaultModel() instead
 */
export function getEnvVar(name: string): string | undefined {
  console.warn(`getEnvVar() is deprecated. Use specific functions like getApiKey() or getDefaultModel() instead.`)
  return getEnvironmentVariable(name)
} 