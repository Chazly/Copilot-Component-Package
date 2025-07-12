/**
 * Centralized Environment Detection and Variable Management
 * Framework-agnostic utility for handling environment variables across Next.js, Vite, and other frameworks
 */
/**
 * Safely access import.meta.env
 */
function getImportMetaEnv() {
    var _a, _b;
    try {
        if (typeof window !== 'undefined' && ((_b = (_a = window.import) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.env)) {
            return window.import.meta.env;
        }
        return undefined;
    }
    catch (_c) {
        return undefined;
    }
}
/**
 * Safely access process.env with proper typing
 */
function getProcessEnv() {
    if (typeof process !== 'undefined' && process.env) {
        return process.env;
    }
    return {};
}
/**
 * Detects the current framework/build system being used
 */
export function detectFramework() {
    const processEnv = getProcessEnv();
    // Check for Next.js
    if (typeof window !== 'undefined') {
        // Client-side detection
        if (window.__NEXT_DATA__)
            return 'nextjs';
    }
    else {
        // Server-side detection
        if (processEnv.NEXT_RUNTIME)
            return 'nextjs';
    }
    // Check for Vite
    const importMetaEnv = getImportMetaEnv();
    if (importMetaEnv) {
        return 'vite';
    }
    // Check for Nuxt
    const hasNuxtEnv = Object.keys(processEnv).some(key => key.startsWith('NUXT_'));
    if (hasNuxtEnv) {
        return 'nuxt';
    }
    // Check for SvelteKit
    if (processEnv.SVELTEKIT) {
        return 'sveltekit';
    }
    // Check for Remix
    if (processEnv.REMIX_DEV_SERVER_WS_PORT) {
        return 'remix';
    }
    // Check for Astro
    if (importMetaEnv && importMetaEnv.ASTRO) {
        return 'astro';
    }
    return 'unknown';
}
/**
 * Safely attempts to get an environment variable with comprehensive fallback chain
 */
function getEnvironmentVariable(key) {
    const processEnv = getProcessEnv();
    // Try server-side environment variables first (most secure)
    if (processEnv[key])
        return processEnv[key];
    // Next.js client-side public variables
    const nextPublicKey = `NEXT_PUBLIC_${key}`;
    if (processEnv[nextPublicKey])
        return processEnv[nextPublicKey];
    // Try client-side environment variables (Vite, etc.)
    const importMetaEnv = getImportMetaEnv();
    if (importMetaEnv) {
        // Vite environment variables
        const viteKey = `VITE_${key}`;
        if (importMetaEnv[viteKey])
            return importMetaEnv[viteKey];
        // Direct environment variable access in Vite
        if (importMetaEnv[key])
            return importMetaEnv[key];
    }
    // Try window-based environment variables (if injected)
    if (typeof window !== 'undefined' && window.env) {
        if (window.env[key])
            return window.env[key];
    }
    return undefined;
}
/**
 * Gets the OpenAI API key with comprehensive framework support
 * @throws {Error} When API key is not found (critical error)
 */
export function getApiKey() {
    const framework = detectFramework();
    const isClientSide = typeof window !== 'undefined';
    // Try multiple API key patterns
    const patterns = [
        'OPENAI_API_KEY',
        'OPENAI_KEY',
        'AI_API_KEY'
    ];
    for (const pattern of patterns) {
        const apiKey = getEnvironmentVariable(pattern);
        if (apiKey) {
            // Warn about client-side API key exposure (security warning)
            if (isClientSide && !pattern.includes('PUBLIC')) {
                console.warn(`⚠️  API key detected in client environment. Consider using server-side configuration for better security.\n` +
                    `Framework: ${framework}\n` +
                    `Pattern: ${pattern}\n` +
                    `Recommendation: Use server-side API routes or ensure the key is prefixed properly (NEXT_PUBLIC_, VITE_, etc.)`);
            }
            return apiKey;
        }
    }
    // Critical error - API key not found
    const frameworkGuide = getFrameworkSpecificGuide(framework);
    throw new Error(`OpenAI API key not found. Add one of the following to your environment:\n\n${frameworkGuide}\n\nCurrent framework detected: ${framework}\nEnvironment: ${isClientSide ? 'client-side' : 'server-side'}`);
}
/**
 * Gets the default model with fallback patterns
 */
export function getDefaultModel() {
    const patterns = [
        'OPENAI_DEFAULT_MODEL',
        'OPENAI_MODEL',
        'AI_MODEL'
    ];
    for (const pattern of patterns) {
        const model = getEnvironmentVariable(pattern);
        if (model)
            return model;
    }
    // Default fallback
    return 'gpt-4o-latest';
}
/**
 * Provides framework-specific environment variable setup guidance
 */
function getFrameworkSpecificGuide(framework) {
    switch (framework) {
        case 'nextjs':
            return `For Next.js:
      Server-side: OPENAI_API_KEY=your-key-here
      Client-side: NEXT_PUBLIC_OPENAI_API_KEY=your-key-here
      Add to .env.local file`;
        case 'vite':
            return `For Vite:
      VITE_OPENAI_API_KEY=your-key-here
      Add to .env.local file`;
        case 'nuxt':
            return `For Nuxt:
      NUXT_OPENAI_API_KEY=your-key-here
      NUXT_PUBLIC_OPENAI_API_KEY=your-key-here (for client-side)
      Add to .env file`;
        case 'sveltekit':
            return `For SvelteKit:
      OPENAI_API_KEY=your-key-here
      PUBLIC_OPENAI_API_KEY=your-key-here (for client-side)
      Add to .env file`;
        case 'remix':
            return `For Remix:
      OPENAI_API_KEY=your-key-here
      Add to .env file`;
        default:
            return `Generic setup:
      OPENAI_API_KEY=your-key-here
      VITE_OPENAI_API_KEY=your-key-here (for Vite-based tools)
      NEXT_PUBLIC_OPENAI_API_KEY=your-key-here (for Next.js client-side)`;
    }
}
/**
 * Validates the current environment configuration
 */
export function validateEnvironment() {
    const framework = detectFramework();
    const isClientSide = typeof window !== 'undefined';
    const isServerSide = typeof process !== 'undefined';
    const hasProcessEnv = Object.keys(getProcessEnv()).length > 0;
    const hasImportMeta = !!getImportMetaEnv();
    const errors = [];
    const warnings = [];
    let hasApiKey = false;
    // Check for API key
    try {
        getApiKey();
        hasApiKey = true;
    }
    catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
    }
    // Framework-specific validations
    if (framework === 'unknown') {
        warnings.push('Framework could not be detected. Environment variable detection may be limited.');
    }
    // Client-side security warnings
    if (isClientSide && hasApiKey) {
        const directApiKey = getEnvironmentVariable('OPENAI_API_KEY');
        if (directApiKey) {
            warnings.push('API key detected in client environment without framework-specific prefix. Consider using server-side configuration.');
        }
    }
    // Environment capability warnings
    if (!hasProcessEnv && !hasImportMeta) {
        warnings.push('No environment variable access detected. Ensure your build system supports environment variables.');
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
    };
}
/**
 * Attempts to auto-detect and return complete environment configuration
 * @param options.requireApiKey - Whether to throw error if API key is missing
 */
export function detectEnvironment(options = {}) {
    const framework = detectFramework();
    const isClientSide = typeof window !== 'undefined';
    const isProduction = getEnvironmentVariable('NODE_ENV') === 'production';
    let apiKey;
    if (options.requireApiKey !== false) {
        try {
            apiKey = getApiKey();
        }
        catch (error) {
            if (options.requireApiKey === true) {
                throw error;
            }
            apiKey = ''; // Permissive mode
        }
    }
    else {
        try {
            apiKey = getApiKey();
        }
        catch (_a) {
            apiKey = ''; // Permissive mode
        }
    }
    return {
        apiKey,
        defaultModel: getDefaultModel(),
        isClientSide,
        framework,
        isProduction
    };
}
/**
 * Helper function for backward compatibility with existing getEnvVar patterns
 * @deprecated Use getApiKey() or getDefaultModel() instead
 */
export function getEnvVar(name) {
    console.warn(`getEnvVar() is deprecated. Use specific functions like getApiKey() or getDefaultModel() instead.`);
    return getEnvironmentVariable(name);
}
