/**
 * Test utilities for mocking different framework environments
 * Allows testing environment detection across various frameworks
 */
export interface MockEnvironmentConfig {
    framework: 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown';
    isClient?: boolean;
    envVars?: Record<string, string>;
    windowGlobals?: Record<string, any>;
    processGlobals?: Record<string, any>;
}
export declare class EnvironmentMocker {
    private originalWindow;
    private originalProcess;
    private originalImportMeta;
    private originalGlobalThis;
    constructor();
    /**
     * Mock a Next.js environment
     */
    mockNextJS(config?: {
        isClient?: boolean;
        apiKey?: string;
        model?: string;
    }): void;
    /**
     * Mock a Vite environment
     */
    mockVite(config?: {
        apiKey?: string;
        model?: string;
    }): void;
    /**
     * Mock a Nuxt environment
     */
    mockNuxt(config?: {
        apiKey?: string;
        model?: string;
    }): void;
    /**
     * Mock a SvelteKit environment
     */
    mockSvelteKit(config?: {
        apiKey?: string;
        model?: string;
    }): void;
    /**
     * Mock a Remix environment
     */
    mockRemix(config?: {
        apiKey?: string;
        model?: string;
    }): void;
    /**
     * Mock an Astro environment
     */
    mockAstro(config?: {
        apiKey?: string;
        model?: string;
    }): void;
    /**
     * Mock an unknown/generic environment
     */
    mockUnknown(config?: {
        apiKey?: string;
        model?: string;
    }): void;
    /**
     * Mock a missing API key scenario
     */
    mockMissingApiKey(): void;
    /**
     * Mock client-side API key exposure (security warning scenario)
     */
    mockClientSideApiKeyExposure(apiKey: string): void;
    /**
     * Reset environment to original state
     */
    restore(): void;
    /**
     * Get current environment state for debugging
     */
    getCurrentState(): {
        hasWindow: boolean;
        hasProcess: boolean;
        hasImportMeta: boolean;
        processEnv?: Record<string, any>;
        importMetaEnv?: Record<string, any>;
    };
}
/**
 * Helper function to create a new environment mocker
 */
export declare function createEnvironmentMocker(): EnvironmentMocker;
/**
 * Helper function to run a test with a specific environment
 */
export declare function withMockedEnvironment<T>(environmentType: MockEnvironmentConfig['framework'], config: {
    apiKey?: string;
    model?: string;
    isClient?: boolean;
} | undefined, testFunction: () => T | Promise<T>): Promise<T>;
/**
 * Test data for common scenarios
 */
export declare const testScenarios: {
    readonly nextjsServer: {
        readonly framework: "nextjs";
        readonly config: {
            readonly isClient: false;
            readonly apiKey: "test-server-key";
            readonly model: "gpt-4";
        };
    };
    readonly nextjsClient: {
        readonly framework: "nextjs";
        readonly config: {
            readonly isClient: true;
            readonly apiKey: "test-client-key";
            readonly model: "gpt-4";
        };
    };
    readonly vite: {
        readonly framework: "vite";
        readonly config: {
            readonly apiKey: "test-vite-key";
            readonly model: "gpt-3.5-turbo";
        };
    };
    readonly missingApiKey: {
        readonly framework: "unknown";
        readonly config: {};
    };
    readonly clientSideExposure: {
        readonly framework: "unknown";
        readonly config: {
            readonly apiKey: "exposed-key";
        };
    };
};
