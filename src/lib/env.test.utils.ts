/**
 * Test utilities for mocking different framework environments
 * Allows testing environment detection across various frameworks
 */

export interface MockEnvironmentConfig {
  framework: 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown'
  isClient?: boolean
  envVars?: Record<string, string>
  windowGlobals?: Record<string, any>
  processGlobals?: Record<string, any>
}

export class EnvironmentMocker {
  private originalWindow: any
  private originalProcess: any
  private originalImportMeta: any
  private originalGlobalThis: any

  constructor() {
    // Store original values
    this.originalWindow = typeof window !== 'undefined' ? window : undefined
    this.originalProcess = typeof process !== 'undefined' ? process : undefined
    this.originalImportMeta = (globalThis as any).import?.meta
    this.originalGlobalThis = globalThis
  }

  /**
   * Mock a Next.js environment
   */
  mockNextJS(config: { isClient?: boolean; apiKey?: string; model?: string } = {}): void {
    const { isClient = false, apiKey, model } = config

    if (isClient) {
      // Mock Next.js client-side
      ;(globalThis as any).window = {
        __NEXT_DATA__: { page: '/' }
      }
      ;(globalThis as any).process = {
        env: {
          NEXT_PUBLIC_OPENAI_API_KEY: apiKey,
          NEXT_PUBLIC_OPENAI_DEFAULT_MODEL: model,
          NODE_ENV: 'development'
        }
      }
    } else {
      // Mock Next.js server-side
      delete (globalThis as any).window
      ;(globalThis as any).process = {
        env: {
          NEXT_RUNTIME: 'nodejs',
          OPENAI_API_KEY: apiKey,
          OPENAI_DEFAULT_MODEL: model,
          NODE_ENV: 'development'
        }
      }
    }

    // Remove import.meta
    delete (globalThis as any).import
  }

  /**
   * Mock a Vite environment
   */
  mockVite(config: { apiKey?: string; model?: string } = {}): void {
    const { apiKey, model } = config

    // Mock Vite client-side
    ;(globalThis as any).window = {}
    ;(globalThis as any).import = {
      meta: {
        env: {
          VITE_OPENAI_API_KEY: apiKey,
          VITE_OPENAI_DEFAULT_MODEL: model,
          NODE_ENV: 'development'
        }
      }
    }

    // Remove process for pure client-side
    delete (globalThis as any).process
  }

  /**
   * Mock a Nuxt environment
   */
  mockNuxt(config: { apiKey?: string; model?: string } = {}): void {
    const { apiKey, model } = config

    delete (globalThis as any).window
    ;(globalThis as any).process = {
      env: {
        NUXT_OPENAI_API_KEY: apiKey,
        NUXT_PUBLIC_OPENAI_API_KEY: apiKey,
        NUXT_OPENAI_DEFAULT_MODEL: model,
        NODE_ENV: 'development'
      },
      server: true
    }

    delete (globalThis as any).import
  }

  /**
   * Mock a SvelteKit environment
   */
  mockSvelteKit(config: { apiKey?: string; model?: string } = {}): void {
    const { apiKey, model } = config

    delete (globalThis as any).window
    ;(globalThis as any).process = {
      env: {
        SVELTEKIT: 'true',
        OPENAI_API_KEY: apiKey,
        PUBLIC_OPENAI_API_KEY: apiKey,
        OPENAI_DEFAULT_MODEL: model,
        NODE_ENV: 'development'
      }
    }

    delete (globalThis as any).import
  }

  /**
   * Mock a Remix environment
   */
  mockRemix(config: { apiKey?: string; model?: string } = {}): void {
    const { apiKey, model } = config

    delete (globalThis as any).window
    ;(globalThis as any).process = {
      env: {
        REMIX_DEV_SERVER_WS_PORT: '8002',
        OPENAI_API_KEY: apiKey,
        OPENAI_DEFAULT_MODEL: model,
        NODE_ENV: 'development'
      }
    }

    delete (globalThis as any).import
  }

  /**
   * Mock an Astro environment
   */
  mockAstro(config: { apiKey?: string; model?: string } = {}): void {
    const { apiKey, model } = config

    ;(globalThis as any).window = {}
    ;(globalThis as any).import = {
      meta: {
        env: {
          ASTRO: true,
          VITE_OPENAI_API_KEY: apiKey,
          VITE_OPENAI_DEFAULT_MODEL: model,
          NODE_ENV: 'development'
        }
      }
    }

    delete (globalThis as any).process
  }

  /**
   * Mock an unknown/generic environment
   */
  mockUnknown(config: { apiKey?: string; model?: string } = {}): void {
    const { apiKey, model } = config

    delete (globalThis as any).window
    ;(globalThis as any).process = {
      env: {
        OPENAI_API_KEY: apiKey,
        OPENAI_DEFAULT_MODEL: model,
        NODE_ENV: 'development'
      }
    }

    delete (globalThis as any).import
  }

  /**
   * Mock a missing API key scenario
   */
  mockMissingApiKey(): void {
    delete (globalThis as any).window
    ;(globalThis as any).process = {
      env: {
        NODE_ENV: 'development'
        // No API key variables
      }
    }

    delete (globalThis as any).import
  }

  /**
   * Mock client-side API key exposure (security warning scenario)
   */
  mockClientSideApiKeyExposure(apiKey: string): void {
    ;(globalThis as any).window = {}
    ;(globalThis as any).process = {
      env: {
        OPENAI_API_KEY: apiKey, // Exposed on client - should trigger warning
        NODE_ENV: 'development'
      }
    }

    delete (globalThis as any).import
  }

  /**
   * Reset environment to original state
   */
  restore(): void {
    // Restore original globals
    if (this.originalWindow !== undefined) {
      ;(globalThis as any).window = this.originalWindow
    } else {
      delete (globalThis as any).window
    }

    if (this.originalProcess !== undefined) {
      ;(globalThis as any).process = this.originalProcess
    } else {
      delete (globalThis as any).process
    }

    if (this.originalImportMeta !== undefined) {
      ;(globalThis as any).import = { meta: this.originalImportMeta }
    } else {
      delete (globalThis as any).import
    }
  }

  /**
   * Get current environment state for debugging
   */
  getCurrentState(): {
    hasWindow: boolean
    hasProcess: boolean
    hasImportMeta: boolean
    processEnv?: Record<string, any>
    importMetaEnv?: Record<string, any>
  } {
    return {
      hasWindow: typeof window !== 'undefined',
      hasProcess: typeof process !== 'undefined',
      hasImportMeta: !!(globalThis as any).import?.meta?.env,
      processEnv: typeof process !== 'undefined' ? (process.env as Record<string, any>) : undefined,
      importMetaEnv: (globalThis as any).import?.meta?.env as Record<string, any> | undefined
    }
  }
}

/**
 * Helper function to create a new environment mocker
 */
export function createEnvironmentMocker(): EnvironmentMocker {
  return new EnvironmentMocker()
}

/**
 * Helper function to run a test with a specific environment
 */
export async function withMockedEnvironment<T>(
  environmentType: MockEnvironmentConfig['framework'],
  config: { apiKey?: string; model?: string; isClient?: boolean } = {},
  testFunction: () => T | Promise<T>
): Promise<T> {
  const mocker = createEnvironmentMocker()
  
  try {
    // Setup environment
    switch (environmentType) {
      case 'nextjs':
        mocker.mockNextJS(config)
        break
      case 'vite':
        mocker.mockVite(config)
        break
      case 'nuxt':
        mocker.mockNuxt(config)
        break
      case 'sveltekit':
        mocker.mockSvelteKit(config)
        break
      case 'remix':
        mocker.mockRemix(config)
        break
      case 'astro':
        mocker.mockAstro(config)
        break
      case 'unknown':
        mocker.mockUnknown(config)
        break
    }

    // Run test
    return await testFunction()
  } finally {
    // Always restore
    mocker.restore()
  }
}

/**
 * Test data for common scenarios
 */
export const testScenarios = {
  nextjsServer: {
    framework: 'nextjs' as const,
    config: { isClient: false, apiKey: 'test-server-key', model: 'gpt-4' }
  },
  nextjsClient: {
    framework: 'nextjs' as const,
    config: { isClient: true, apiKey: 'test-client-key', model: 'gpt-4' }
  },
  vite: {
    framework: 'vite' as const,
    config: { apiKey: 'test-vite-key', model: 'gpt-3.5-turbo' }
  },
  missingApiKey: {
    framework: 'unknown' as const,
    config: {}
  },
  clientSideExposure: {
    framework: 'unknown' as const,
    config: { apiKey: 'exposed-key' }
  }
} as const 