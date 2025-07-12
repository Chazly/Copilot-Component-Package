/**
 * Test utilities for mocking different framework environments
 * Allows testing environment detection across various frameworks
 */
export class EnvironmentMocker {
    constructor() {
        var _a;
        // Store original values
        this.originalWindow = typeof window !== 'undefined' ? window : undefined;
        this.originalProcess = typeof process !== 'undefined' ? process : undefined;
        this.originalImportMeta = (_a = globalThis.import) === null || _a === void 0 ? void 0 : _a.meta;
        this.originalGlobalThis = globalThis;
    }
    /**
     * Mock a Next.js environment
     */
    mockNextJS(config = {}) {
        const { isClient = false, apiKey, model } = config;
        if (isClient) {
            // Mock Next.js client-side
            ;
            globalThis.window = {
                __NEXT_DATA__: { page: '/' }
            };
            globalThis.process = {
                env: {
                    NEXT_PUBLIC_OPENAI_API_KEY: apiKey,
                    NEXT_PUBLIC_OPENAI_DEFAULT_MODEL: model,
                    NODE_ENV: 'development'
                }
            };
        }
        else {
            // Mock Next.js server-side
            delete globalThis.window;
            globalThis.process = {
                env: {
                    NEXT_RUNTIME: 'nodejs',
                    OPENAI_API_KEY: apiKey,
                    OPENAI_DEFAULT_MODEL: model,
                    NODE_ENV: 'development'
                }
            };
        }
        // Remove import.meta
        delete globalThis.import;
    }
    /**
     * Mock a Vite environment
     */
    mockVite(config = {}) {
        const { apiKey, model } = config;
        globalThis.window = {};
        globalThis.import = {
            meta: {
                env: {
                    VITE_OPENAI_API_KEY: apiKey,
                    VITE_OPENAI_DEFAULT_MODEL: model,
                    NODE_ENV: 'development'
                }
            }
        };
        // Remove process for pure client-side
        delete globalThis.process;
    }
    /**
     * Mock a Nuxt environment
     */
    mockNuxt(config = {}) {
        const { apiKey, model } = config;
        delete globalThis.window;
        globalThis.process = {
            env: {
                NUXT_OPENAI_API_KEY: apiKey,
                NUXT_PUBLIC_OPENAI_API_KEY: apiKey,
                NUXT_OPENAI_DEFAULT_MODEL: model,
                NODE_ENV: 'development'
            },
            server: true
        };
        delete globalThis.import;
    }
    /**
     * Mock a SvelteKit environment
     */
    mockSvelteKit(config = {}) {
        const { apiKey, model } = config;
        delete globalThis.window;
        globalThis.process = {
            env: {
                SVELTEKIT: 'true',
                OPENAI_API_KEY: apiKey,
                PUBLIC_OPENAI_API_KEY: apiKey,
                OPENAI_DEFAULT_MODEL: model,
                NODE_ENV: 'development'
            }
        };
        delete globalThis.import;
    }
    /**
     * Mock a Remix environment
     */
    mockRemix(config = {}) {
        const { apiKey, model } = config;
        delete globalThis.window;
        globalThis.process = {
            env: {
                REMIX_DEV_SERVER_WS_PORT: '8002',
                OPENAI_API_KEY: apiKey,
                OPENAI_DEFAULT_MODEL: model,
                NODE_ENV: 'development'
            }
        };
        delete globalThis.import;
    }
    /**
     * Mock an Astro environment
     */
    mockAstro(config = {}) {
        const { apiKey, model } = config;
        globalThis.window = {};
        globalThis.import = {
            meta: {
                env: {
                    ASTRO: true,
                    VITE_OPENAI_API_KEY: apiKey,
                    VITE_OPENAI_DEFAULT_MODEL: model,
                    NODE_ENV: 'development'
                }
            }
        };
        delete globalThis.process;
    }
    /**
     * Mock an unknown/generic environment
     */
    mockUnknown(config = {}) {
        const { apiKey, model } = config;
        delete globalThis.window;
        globalThis.process = {
            env: {
                OPENAI_API_KEY: apiKey,
                OPENAI_DEFAULT_MODEL: model,
                NODE_ENV: 'development'
            }
        };
        delete globalThis.import;
    }
    /**
     * Mock a missing API key scenario
     */
    mockMissingApiKey() {
        delete globalThis.window;
        globalThis.process = {
            env: {
                NODE_ENV: 'development'
                // No API key variables
            }
        };
        delete globalThis.import;
    }
    /**
     * Mock client-side API key exposure (security warning scenario)
     */
    mockClientSideApiKeyExposure(apiKey) {
        ;
        globalThis.window = {};
        globalThis.process = {
            env: {
                OPENAI_API_KEY: apiKey, // Exposed on client - should trigger warning
                NODE_ENV: 'development'
            }
        };
        delete globalThis.import;
    }
    /**
     * Reset environment to original state
     */
    restore() {
        // Restore original globals
        if (this.originalWindow !== undefined) {
            ;
            globalThis.window = this.originalWindow;
        }
        else {
            delete globalThis.window;
        }
        if (this.originalProcess !== undefined) {
            ;
            globalThis.process = this.originalProcess;
        }
        else {
            delete globalThis.process;
        }
        if (this.originalImportMeta !== undefined) {
            ;
            globalThis.import = { meta: this.originalImportMeta };
        }
        else {
            delete globalThis.import;
        }
    }
    /**
     * Get current environment state for debugging
     */
    getCurrentState() {
        var _a, _b, _c, _d;
        return {
            hasWindow: typeof window !== 'undefined',
            hasProcess: typeof process !== 'undefined',
            hasImportMeta: !!((_b = (_a = globalThis.import) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.env),
            processEnv: typeof process !== 'undefined' ? process.env : undefined,
            importMetaEnv: (_d = (_c = globalThis.import) === null || _c === void 0 ? void 0 : _c.meta) === null || _d === void 0 ? void 0 : _d.env
        };
    }
}
/**
 * Helper function to create a new environment mocker
 */
export function createEnvironmentMocker() {
    return new EnvironmentMocker();
}
/**
 * Helper function to run a test with a specific environment
 */
export async function withMockedEnvironment(environmentType, config = {}, testFunction) {
    const mocker = createEnvironmentMocker();
    try {
        // Setup environment
        switch (environmentType) {
            case 'nextjs':
                mocker.mockNextJS(config);
                break;
            case 'vite':
                mocker.mockVite(config);
                break;
            case 'nuxt':
                mocker.mockNuxt(config);
                break;
            case 'sveltekit':
                mocker.mockSvelteKit(config);
                break;
            case 'remix':
                mocker.mockRemix(config);
                break;
            case 'astro':
                mocker.mockAstro(config);
                break;
            case 'unknown':
                mocker.mockUnknown(config);
                break;
        }
        // Run test
        return await testFunction();
    }
    finally {
        // Always restore
        mocker.restore();
    }
}
/**
 * Test data for common scenarios
 */
export const testScenarios = {
    nextjsServer: {
        framework: 'nextjs',
        config: { isClient: false, apiKey: 'test-server-key', model: 'gpt-4' }
    },
    nextjsClient: {
        framework: 'nextjs',
        config: { isClient: true, apiKey: 'test-client-key', model: 'gpt-4' }
    },
    vite: {
        framework: 'vite',
        config: { apiKey: 'test-vite-key', model: 'gpt-3.5-turbo' }
    },
    missingApiKey: {
        framework: 'unknown',
        config: {}
    },
    clientSideExposure: {
        framework: 'unknown',
        config: { apiKey: 'exposed-key' }
    }
};
