/**
 * Centralized Environment Detection and Variable Management
 * Framework-agnostic utility for handling environment variables across Next.js, Vite, and other frameworks
 */
export type FrameworkType = 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown';
export interface EnvironmentConfig {
    apiKey: string;
    defaultModel: string;
    isClientSide: boolean;
    framework: FrameworkType;
    isProduction: boolean;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    framework: FrameworkType;
    hasApiKey: boolean;
    environmentInfo: {
        isClient: boolean;
        isServer: boolean;
        hasProcessEnv: boolean;
        hasImportMeta: boolean;
    };
}
/**
 * Enhanced framework detection with multiple Next.js indicators
 */
export declare function detectFramework(): FrameworkType;
/**
 * Unified API key resolution that checks config first, then environment
 * This fixes the architectural design flaw where provided config was ignored
 */
export declare function getApiKeyWithConfig(providedConfig?: {
    apiKey?: string;
}): string;
/**
 * Gets the OpenAI API key with comprehensive framework support and enhanced debugging
 * @throws {Error} When API key is not found (critical error)
 */
export declare function getApiKey(): string;
/**
 * Gets the default model with fallback patterns
 */
export declare function getDefaultModel(): string;
/**
 * Validates the current environment configuration
 */
export declare function validateEnvironment(providedConfig?: {
    apiKey?: string;
}): ValidationResult;
/**
 * Attempts to auto-detect and return complete environment configuration
 * @param options.requireApiKey - Whether to throw error if API key is missing
 * @param options.providedConfig - Optional config with API key to use instead of environment detection
 */
export declare function detectEnvironment(options?: {
    requireApiKey?: boolean;
    providedConfig?: {
        apiKey?: string;
    };
}): EnvironmentConfig;
/**
 * Helper function for backward compatibility with existing getEnvVar patterns
 * @deprecated Use getApiKey() or getDefaultModel() instead
 */
export declare function getEnvVar(name: string): string | undefined;
