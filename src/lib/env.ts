/**
 * Centralized Environment Detection and Variable Management
 * Framework-agnostic utility for handling environment variables across Next.js, Vite, and other frameworks
 */

export type FrameworkType = 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown'

export interface EnvironmentConfig {
  apiKey: string
  defaultModel: string
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

// Types for environment debugging
interface EnvironmentDebugInfo {
  attemptedSources: string[]
  availableKeys: string[]
  framework: FrameworkType
  environment: string
  directAccess: Record<string, boolean>
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
 * Safely access import.meta.env (Vite environments)
 */
function getImportMetaEnv(): Record<string, string | undefined> | undefined {
  try {
    return (globalThis as any).import?.meta?.env as Record<string, string | undefined>
  } catch {
    return undefined
  }
}

/**
 * Enhanced framework detection with multiple Next.js indicators
 */
export function detectFramework(): FrameworkType {
  const processEnv = getProcessEnv()
  
  // Enhanced Next.js detection
  if (typeof window !== 'undefined') {
    // Client-side detection
    if ((window as any).__NEXT_DATA__) return 'nextjs'
    if ((window as any).next) return 'nextjs'
  } else {
    // Server-side detection with multiple indicators
    if (processEnv.NEXT_RUNTIME) return 'nextjs'
    if (processEnv.__NEXT_DEV_SCRIPT) return 'nextjs'
    if (processEnv.NEXT_TELEMETRY_DISABLED !== undefined) return 'nextjs'
    // Check for Next.js build indicators
    if (processEnv.npm_package_dependencies_next) return 'nextjs'
  }

  // Check for Vite with better detection
  const importMetaEnv = getImportMetaEnv()
  if (importMetaEnv) {
    // Vite-specific indicators
    if ((importMetaEnv as any).VITE !== undefined) return 'vite'
    if (typeof (globalThis as any).import?.meta?.hot !== 'undefined') return 'vite'
    return 'vite' // Any import.meta.env presence usually indicates Vite
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
 * Enhanced environment variable detection with direct access patterns and debugging
 */
function getEnvironmentVariable(key: string): { value: string | undefined, debugInfo: EnvironmentDebugInfo } {
  const attemptedSources: string[] = []
  const directAccess: Record<string, boolean> = {}
  let foundValue: string | undefined

  // 1. Try direct process.env access first (most reliable)
  if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
    foundValue = (process.env as any)[key]
    attemptedSources.push(`process.env.${key}`)
    directAccess[`process.env.${key}`] = true
  }

  // 2. Try Next.js public pattern directly  
  if (!foundValue && typeof process !== 'undefined' && process.env && (process.env as any)[`NEXT_PUBLIC_${key}`]) {
    foundValue = (process.env as any)[`NEXT_PUBLIC_${key}`]
    attemptedSources.push(`process.env.NEXT_PUBLIC_${key}`)
    directAccess[`process.env.NEXT_PUBLIC_${key}`] = true
  }

  // 3. Try client-side patterns with multiple access methods
  if (!foundValue && typeof window !== 'undefined') {
    const clientSources = [
      { source: 'window.process?.env', value: (window as any).process?.env?.[key] },
      { source: 'window.env', value: (window as any).env?.[key] },
      { source: 'globalThis.process?.env', value: (globalThis as any).process?.env?.[key] }
    ]

    for (const { source, value } of clientSources) {
      attemptedSources.push(`${source}.${key}`)
      if (value) {
        foundValue = value
        directAccess[`${source}.${key}`] = true
        break
      } else {
        directAccess[`${source}.${key}`] = false
      }
    }
  }

  // 4. Try Vite patterns
  if (!foundValue && typeof (globalThis as any).import?.meta?.env !== 'undefined') {
    const env = (globalThis as any).import.meta.env
    const viteKey = `VITE_${key}`
    
    attemptedSources.push(`import.meta.env.VITE_${key}`)
    attemptedSources.push(`import.meta.env.${key}`)
    
    if (env[viteKey]) {
      foundValue = env[viteKey]
      directAccess[`import.meta.env.VITE_${key}`] = true
    } else if (env[key]) {
      foundValue = env[key]
      directAccess[`import.meta.env.${key}`] = true
    } else {
      directAccess[`import.meta.env.VITE_${key}`] = false
      directAccess[`import.meta.env.${key}`] = false
    }
  }

  // 5. Fall back to the original getProcessEnv() method
  if (!foundValue) {
    const processEnv = getProcessEnv()
    const sources = [
      { key: key, source: `getProcessEnv().${key}` },
      { key: `NEXT_PUBLIC_${key}`, source: `getProcessEnv().NEXT_PUBLIC_${key}` }
    ]

    for (const { key: envKey, source } of sources) {
      attemptedSources.push(source)
      if (processEnv[envKey]) {
        foundValue = processEnv[envKey]
        directAccess[source] = true
        break
      } else {
        directAccess[source] = false
      }
    }
  }

  // 6. Try window-based environment variables (if injected)
  if (!foundValue && typeof window !== 'undefined' && (window as any).env) {
    attemptedSources.push(`window.env.${key}`)
    if ((window as any).env[key]) {
      foundValue = (window as any).env[key]
      directAccess[`window.env.${key}`] = true
    } else {
      directAccess[`window.env.${key}`] = false
    }
  }

  // Collect debug information
  const processEnv = getProcessEnv()
  const availableKeys = Object.keys(processEnv).filter(k => k.includes('OPENAI') || k.includes('API'))
  
  const debugInfo: EnvironmentDebugInfo = {
    attemptedSources,
    availableKeys,
    framework: detectFramework(),
    environment: typeof window !== 'undefined' ? 'client-side' : 'server-side',
    directAccess
  }

  return { value: foundValue, debugInfo }
}

/**
 * Unified API key resolution that checks config first, then environment
 * This fixes the architectural design flaw where provided config was ignored
 */
export function getApiKeyWithConfig(providedConfig?: { apiKey?: string }): string {
  // First, try the provided config (from environmentConfig)
  if (providedConfig?.apiKey) {
    return providedConfig.apiKey
  }
  
  // Fall back to environment detection
  return getApiKey()
}

/**
 * Gets the OpenAI API key with comprehensive framework support and enhanced debugging
 * @throws {Error} When API key is not found (critical error)
 */
export function getApiKey(): string {
  const framework = detectFramework()
  const isClientSide = typeof window !== 'undefined'
  
  // Try multiple API key patterns with enhanced tracking
  const patterns = [
    'OPENAI_API_KEY',
    'OPENAI_KEY',
    'AI_API_KEY'
  ]

  let allDebugInfo: EnvironmentDebugInfo | null = null

  for (const pattern of patterns) {
    const { value: apiKey, debugInfo } = getEnvironmentVariable(pattern)
    allDebugInfo = debugInfo // Keep last debug info for error reporting
    
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

  // Enhanced error message with comprehensive debugging info
  const frameworkGuide = getFrameworkSpecificGuide(framework)
  const debugDetails = allDebugInfo ? `
Debug Information:
- Attempted sources: ${allDebugInfo.attemptedSources.join(', ')}
- Available environment keys: ${allDebugInfo.availableKeys.join(', ') || 'none'}
- Framework detected: ${allDebugInfo.framework}
- Environment: ${allDebugInfo.environment}
- Direct access results: ${JSON.stringify(allDebugInfo.directAccess, null, 2)}` : ''
  
  throw new Error(`OpenAI API key not found. ${frameworkGuide}${debugDetails}`)
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
    const { value: model } = getEnvironmentVariable(pattern)
    if (model) return model
  }

  // Default fallback
  return 'gpt-4o-latest'
}

/**
 * Provides framework-specific environment variable setup guidance with enhanced options
 */
function getFrameworkSpecificGuide(framework: FrameworkType): string {
  const baseMessage = `Add one of the following to your environment:\n\n`
  
  switch (framework) {
    case 'nextjs':
      return baseMessage + `For Next.js:
      Server-side: OPENAI_API_KEY=your-key-here
      Client-side: NEXT_PUBLIC_OPENAI_API_KEY=your-key-here
      Add to .env.local file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`
      
    case 'vite':
      return baseMessage + `For Vite:
      VITE_OPENAI_API_KEY=your-key-here
      Add to .env.local file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`
      
    case 'nuxt':
      return baseMessage + `For Nuxt:
      NUXT_OPENAI_API_KEY=your-key-here
      NUXT_PUBLIC_OPENAI_API_KEY=your-key-here (for client-side)
      Add to .env file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`
      
    case 'sveltekit':
      return baseMessage + `For SvelteKit:
      OPENAI_API_KEY=your-key-here
      PUBLIC_OPENAI_API_KEY=your-key-here (for client-side)
      Add to .env file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`
      
    case 'remix':
      return baseMessage + `For Remix:
      OPENAI_API_KEY=your-key-here
      Add to .env file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`
      
    case 'unknown':
      return baseMessage + `Framework could not be detected. Try:
      1. OPENAI_API_KEY=your-key-here (standard)
      2. NEXT_PUBLIC_OPENAI_API_KEY=your-key-here (Next.js client)
      3. VITE_OPENAI_API_KEY=your-key-here (Vite)
      4. Use environmentConfig() method: .environmentConfig({ apiKey: 'your-key-here' })
      5. Manual framework override: .environmentConfig({ framework: 'nextjs' })
      6. Check if your framework is supported and environment variables are accessible`
      
    default:
      return baseMessage + `Generic setup:
      OPENAI_API_KEY=your-key-here
      VITE_OPENAI_API_KEY=your-key-here (for Vite-based tools)
      NEXT_PUBLIC_OPENAI_API_KEY=your-key-here (for Next.js client-side)
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`
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
    const { value: directApiKey } = getEnvironmentVariable('OPENAI_API_KEY')
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
  const { value: nodeEnv } = getEnvironmentVariable('NODE_ENV')
  const isProduction = nodeEnv === 'production'
  
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
  const { value } = getEnvironmentVariable(name)
  return value
} 