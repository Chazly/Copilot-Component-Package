// Error types for better error handling
export class ConfigValidationError extends Error {
    constructor(errors, warnings = [], message) {
        super(message || 'Configuration validation failed');
        this.errors = errors;
        this.warnings = warnings;
        this.name = 'ConfigValidationError';
    }
}
export class MigrationError extends Error {
    constructor(step, reason, message) {
        super(message || `Migration failed at step: ${step}`);
        this.step = step;
        this.reason = reason;
        this.name = 'MigrationError';
    }
}
// Type guard utilities
export const isValidationError = (error) => {
    return error instanceof ConfigValidationError;
};
export const isMigrationError = (error) => {
    return error instanceof MigrationError;
};
// Utility for checking if config has enterprise features
export const hasEnterpriseFeatures = (config) => {
    return 'enterpriseSecurity' in config ||
        'enterprisePerformance' in config ||
        'enterpriseMemory' in config ||
        'enterprise' in config;
};
// Phase detection utility
export const detectConfigPhase = (config) => {
    if ('title' in config && 'subtitle' in config)
        return 1; // Legacy config
    if (!('slug' in config))
        return 1;
    if (!config.security && !config.performance)
        return 2;
    if (!config.analytics && !config.integrations)
        return 3;
    if (!hasEnterpriseFeatures(config))
        return 4;
    return 5; // Phase 5 with enterprise features
};
