/**
 * Centralized Environment Detection and Variable Management
 * Framework-agnostic utility for handling environment variables across Next.js, Vite, and other frameworks
 */
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
 * Safely access import.meta.env (Vite environments)
 */
function getImportMetaEnv() {
    var _a, _b;
    try {
        return (_b = (_a = globalThis.import) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.env;
    }
    catch (_c) {
        return undefined;
    }
}
/**
 * Enhanced framework detection with multiple Next.js indicators
 */
export function detectFramework() {
    var _a, _b;
    const processEnv = getProcessEnv();
    // Enhanced Next.js detection
    if (typeof window !== 'undefined') {
        // Client-side detection
        if (window.__NEXT_DATA__)
            return 'nextjs';
        if (window.next)
            return 'nextjs';
    }
    else {
        // Server-side detection with multiple indicators
        if (processEnv.NEXT_RUNTIME)
            return 'nextjs';
        if (processEnv.__NEXT_DEV_SCRIPT)
            return 'nextjs';
        if (processEnv.NEXT_TELEMETRY_DISABLED !== undefined)
            return 'nextjs';
        // Check for Next.js build indicators
        if (processEnv.npm_package_dependencies_next)
            return 'nextjs';
    }
    // Check for Vite with better detection
    const importMetaEnv = getImportMetaEnv();
    if (importMetaEnv) {
        // Vite-specific indicators
        if (importMetaEnv.VITE !== undefined)
            return 'vite';
        if (typeof ((_b = (_a = globalThis.import) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.hot) !== 'undefined')
            return 'vite';
        return 'vite'; // Any import.meta.env presence usually indicates Vite
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
 * Enhanced environment variable detection with direct access patterns and debugging
 */
function getEnvironmentVariable(key) {
    var _a, _b, _c, _d, _e, _f, _g;
    const attemptedSources = [];
    const directAccess = {};
    let foundValue;
    // 1. Try direct process.env access first (most reliable)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        foundValue = process.env[key];
        attemptedSources.push(`process.env.${key}`);
        directAccess[`process.env.${key}`] = true;
    }
    // 2. Try Next.js public pattern directly  
    if (!foundValue && typeof process !== 'undefined' && process.env && process.env[`NEXT_PUBLIC_${key}`]) {
        foundValue = process.env[`NEXT_PUBLIC_${key}`];
        attemptedSources.push(`process.env.NEXT_PUBLIC_${key}`);
        directAccess[`process.env.NEXT_PUBLIC_${key}`] = true;
    }
    // 3. Try client-side patterns with multiple access methods
    if (!foundValue && typeof window !== 'undefined') {
        const clientSources = [
            { source: 'window.process?.env', value: (_b = (_a = window.process) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b[key] },
            { source: 'window.env', value: (_c = window.env) === null || _c === void 0 ? void 0 : _c[key] },
            { source: 'globalThis.process?.env', value: (_e = (_d = globalThis.process) === null || _d === void 0 ? void 0 : _d.env) === null || _e === void 0 ? void 0 : _e[key] }
        ];
        for (const { source, value } of clientSources) {
            attemptedSources.push(`${source}.${key}`);
            if (value) {
                foundValue = value;
                directAccess[`${source}.${key}`] = true;
                break;
            }
            else {
                directAccess[`${source}.${key}`] = false;
            }
        }
    }
    // 4. Try Vite patterns
    if (!foundValue && typeof ((_g = (_f = globalThis.import) === null || _f === void 0 ? void 0 : _f.meta) === null || _g === void 0 ? void 0 : _g.env) !== 'undefined') {
        const env = globalThis.import.meta.env;
        const viteKey = `VITE_${key}`;
        attemptedSources.push(`import.meta.env.VITE_${key}`);
        attemptedSources.push(`import.meta.env.${key}`);
        if (env[viteKey]) {
            foundValue = env[viteKey];
            directAccess[`import.meta.env.VITE_${key}`] = true;
        }
        else if (env[key]) {
            foundValue = env[key];
            directAccess[`import.meta.env.${key}`] = true;
        }
        else {
            directAccess[`import.meta.env.VITE_${key}`] = false;
            directAccess[`import.meta.env.${key}`] = false;
        }
    }
    // 5. Fall back to the original getProcessEnv() method
    if (!foundValue) {
        const processEnv = getProcessEnv();
        const sources = [
            { key: key, source: `getProcessEnv().${key}` },
            { key: `NEXT_PUBLIC_${key}`, source: `getProcessEnv().NEXT_PUBLIC_${key}` }
        ];
        for (const { key: envKey, source } of sources) {
            attemptedSources.push(source);
            if (processEnv[envKey]) {
                foundValue = processEnv[envKey];
                directAccess[source] = true;
                break;
            }
            else {
                directAccess[source] = false;
            }
        }
    }
    // 6. Try window-based environment variables (if injected)
    if (!foundValue && typeof window !== 'undefined' && window.env) {
        attemptedSources.push(`window.env.${key}`);
        if (window.env[key]) {
            foundValue = window.env[key];
            directAccess[`window.env.${key}`] = true;
        }
        else {
            directAccess[`window.env.${key}`] = false;
        }
    }
    // Collect debug information
    const processEnv = getProcessEnv();
    const availableKeys = Object.keys(processEnv).filter(k => k.includes('OPENAI') || k.includes('API'));
    const debugInfo = {
        attemptedSources,
        availableKeys,
        framework: detectFramework(),
        environment: typeof window !== 'undefined' ? 'client-side' : 'server-side',
        directAccess
    };
    return { value: foundValue, debugInfo };
}
/**
 * Unified API key resolution that checks config first, then environment
 * This fixes the architectural design flaw where provided config was ignored
 */
export function getApiKeyWithConfig(providedConfig) {
    // First, try the provided config (from environmentConfig)
    if (providedConfig === null || providedConfig === void 0 ? void 0 : providedConfig.apiKey) {
        return providedConfig.apiKey;
    }
    // Fall back to environment detection
    return getApiKey();
}
/**
 * Gets the OpenAI API key with comprehensive framework support and enhanced debugging
 * @throws {Error} When API key is not found (critical error)
 */
export function getApiKey() {
    const framework = detectFramework();
    const isClientSide = typeof window !== 'undefined';
    // Try multiple API key patterns with enhanced tracking
    const patterns = [
        'OPENAI_API_KEY',
        'OPENAI_KEY',
        'AI_API_KEY'
    ];
    let allDebugInfo = null;
    for (const pattern of patterns) {
        const { value: apiKey, debugInfo } = getEnvironmentVariable(pattern);
        allDebugInfo = debugInfo; // Keep last debug info for error reporting
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
    // Enhanced error message with comprehensive debugging info
    const frameworkGuide = getFrameworkSpecificGuide(framework);
    const debugDetails = allDebugInfo ? `
Debug Information:
- Attempted sources: ${allDebugInfo.attemptedSources.join(', ')}
- Available environment keys: ${allDebugInfo.availableKeys.join(', ') || 'none'}
- Framework detected: ${allDebugInfo.framework}
- Environment: ${allDebugInfo.environment}
- Direct access results: ${JSON.stringify(allDebugInfo.directAccess, null, 2)}` : '';
    throw new Error(`OpenAI API key not found. ${frameworkGuide}${debugDetails}`);
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
        const { value: model } = getEnvironmentVariable(pattern);
        if (model)
            return model;
    }
    // Default fallback
    return 'gpt-4o-latest';
}
/**
 * Provides framework-specific environment variable setup guidance with enhanced options
 */
function getFrameworkSpecificGuide(framework) {
    const baseMessage = `Add one of the following to your environment:\n\n`;
    switch (framework) {
        case 'nextjs':
            return baseMessage + `For Next.js:
      Server-side: OPENAI_API_KEY=your-key-here
      Client-side: NEXT_PUBLIC_OPENAI_API_KEY=your-key-here
      Add to .env.local file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`;
        case 'vite':
            return baseMessage + `For Vite:
      VITE_OPENAI_API_KEY=your-key-here
      Add to .env.local file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`;
        case 'nuxt':
            return baseMessage + `For Nuxt:
      NUXT_OPENAI_API_KEY=your-key-here
      NUXT_PUBLIC_OPENAI_API_KEY=your-key-here (for client-side)
      Add to .env file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`;
        case 'sveltekit':
            return baseMessage + `For SvelteKit:
      OPENAI_API_KEY=your-key-here
      PUBLIC_OPENAI_API_KEY=your-key-here (for client-side)
      Add to .env file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`;
        case 'remix':
            return baseMessage + `For Remix:
      OPENAI_API_KEY=your-key-here
      Add to .env file
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`;
        case 'unknown':
            return baseMessage + `Framework could not be detected. Try:
      1. OPENAI_API_KEY=your-key-here (standard)
      2. NEXT_PUBLIC_OPENAI_API_KEY=your-key-here (Next.js client)
      3. VITE_OPENAI_API_KEY=your-key-here (Vite)
      4. Use environmentConfig() method: .environmentConfig({ apiKey: 'your-key-here' })
      5. Manual framework override: .environmentConfig({ framework: 'nextjs' })
      6. Check if your framework is supported and environment variables are accessible`;
        default:
            return baseMessage + `Generic setup:
      OPENAI_API_KEY=your-key-here
      VITE_OPENAI_API_KEY=your-key-here (for Vite-based tools)
      NEXT_PUBLIC_OPENAI_API_KEY=your-key-here (for Next.js client-side)
      
      Alternative: Use environmentConfig() method:
      .environmentConfig({ apiKey: 'your-key-here' })`;
    }
}
/**
 * Validates the current environment configuration
 */
export function validateEnvironment(providedConfig) {
    const framework = detectFramework();
    const isClientSide = typeof window !== 'undefined';
    const isServerSide = typeof process !== 'undefined';
    const hasProcessEnv = Object.keys(getProcessEnv()).length > 0;
    const hasImportMeta = !!getImportMetaEnv();
    const errors = [];
    const warnings = [];
    let hasApiKey = false;
    // Check for API key using unified function
    try {
        getApiKeyWithConfig(providedConfig);
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
        const { value: directApiKey } = getEnvironmentVariable('OPENAI_API_KEY');
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
 * @param options.providedConfig - Optional config with API key to use instead of environment detection
 */
export function detectEnvironment(options = {}) {
    const framework = detectFramework();
    const isClientSide = typeof window !== 'undefined';
    const { value: nodeEnv } = getEnvironmentVariable('NODE_ENV');
    const isProduction = nodeEnv === 'production';
    let apiKey;
    if (options.requireApiKey !== false) {
        try {
            apiKey = getApiKeyWithConfig(options.providedConfig);
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
            apiKey = getApiKeyWithConfig(options.providedConfig);
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
    const { value } = getEnvironmentVariable(name);
    return value;
}
