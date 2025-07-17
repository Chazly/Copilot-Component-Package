import { ConfigValidationError } from '../types/utils';
import { validateEnvironment, detectFramework, getApiKeyWithConfig, getDefaultModel } from '../lib/env';
import { validateConfig } from '../validation/ConfigValidator';
export class CopilotConfigBuilder {
    constructor(initialConfig) {
        this.state = {
            config: {},
            validationErrors: {},
            appliedPresets: [],
            buildAttempts: 0
        };
        if (initialConfig) {
            this.state.config = Object.assign({}, initialConfig);
        }
    }
    // Core configuration methods
    basic(name, slug, firstMessage) {
        this.state.config.name = name;
        this.state.config.slug = this.sanitizeSlug(slug);
        this.state.config.firstMessage = firstMessage;
        return this;
    }
    // Model configuration
    model(provider, model) {
        this.state.config.modelProvider = provider;
        if (model) {
            this.state.config.model = model;
        }
        return this;
    }
    // System prompt configuration
    systemPrompt(prompt) {
        this.state.config.systemPrompt = prompt;
        return this;
    }
    // Storage configuration  
    storage(databasePath, embedLocation) {
        this.state.config.databasePath = databasePath;
        this.state.config.embedLocation = embedLocation;
        return this;
    }
    // Description and metadata
    description(desc) {
        this.state.config.description = desc;
        return this;
    }
    // Tools configuration
    tools(tools) {
        this.state.config.tools = [...tools];
        return this;
    }
    addTool(tool) {
        if (!this.state.config.tools) {
            this.state.config.tools = [];
        }
        this.state.config.tools.push(tool);
        return this;
    }
    // Context sources
    contextSources(sources) {
        this.state.config.contextSources = [...sources];
        return this;
    }
    addContextSource(source) {
        if (!this.state.config.contextSources) {
            this.state.config.contextSources = [];
        }
        this.state.config.contextSources.push(source);
        return this;
    }
    // Persona configuration
    persona(config) {
        this.state.config.persona = Object.assign(Object.assign({}, this.state.config.persona), config);
        return this;
    }
    // Visibility settings
    visibility(config) {
        this.state.config.visibility = Object.assign(Object.assign({}, this.state.config.visibility), config);
        return this;
    }
    // UI configuration
    ui(config) {
        this.state.config.uiConfig = Object.assign(Object.assign({}, this.state.config.uiConfig), config);
        return this;
    }
    // Security configuration
    security(config) {
        this.state.config.security = Object.assign(Object.assign({}, this.state.config.security), config);
        return this;
    }
    // Performance configuration
    performance(config) {
        this.state.config.performance = Object.assign(Object.assign({}, this.state.config.performance), config);
        return this;
    }
    // Analytics configuration
    analytics(config) {
        this.state.config.analytics = Object.assign(Object.assign({}, this.state.config.analytics), config);
        return this;
    }
    // Enterprise security features - provides defaults for required fields
    enterpriseSecurity(config) {
        const defaults = {
            enabled: true,
            threatDetection: {
                enabled: false,
                sensitivity: 'medium',
                realTimeMonitoring: false
            },
            policies: {
                dataAccess: [],
                userPermissions: {},
                complianceFramework: []
            },
            audit: {
                enabled: false,
                retention: 30,
                realTimeAlerts: false
            },
            piiProtection: {
                enabled: false,
                autoDetection: false,
                maskingRules: []
            }
        };
        this.state.config.enterpriseSecurity = Object.assign(Object.assign(Object.assign({}, defaults), this.state.config.enterpriseSecurity), config);
        return this;
    }
    // Enterprise performance features - provides defaults for required fields
    enterprisePerformance(config) {
        const defaults = {
            monitoring: {
                enabled: false,
                metricsCollection: false,
                realTimeDashboard: false
            },
            optimization: {
                enabled: false,
                autoScaling: false,
                caching: false
            },
            alerts: {
                enabled: false,
                thresholds: {
                    responseTime: 1000,
                    errorRate: 0.05,
                    resourceUsage: 0.8
                }
            },
            analytics: {
                enabled: false,
                userJourneyTracking: false,
                customMetrics: false
            }
        };
        this.state.config.enterprisePerformance = Object.assign(Object.assign(Object.assign({}, defaults), this.state.config.enterprisePerformance), config);
        return this;
    }
    // Enterprise memory features - provides defaults for required fields
    enterpriseMemory(config) {
        const defaults = {
            scopes: {
                enabled: ['session', 'user'],
                default: 'user'
            },
            encryption: {
                enabled: false,
                algorithm: 'AES-256-GCM'
            },
            synchronization: {
                enabled: false,
                crossDevice: false,
                conflictResolution: 'last-write-wins'
            },
            retention: {
                policies: {},
                compression: false
            }
        };
        this.state.config.enterpriseMemory = Object.assign(Object.assign(Object.assign({}, defaults), this.state.config.enterpriseMemory), config);
        return this;
    }
    // Enterprise features - provides defaults for required fields
    enterprise(config) {
        const defaults = {
            dashboard: {
                enabled: false,
                realTimeUpdates: false,
                customWidgets: false
            },
            reporting: {
                enabled: false,
                schedule: 'weekly',
                recipients: []
            },
            integrations: {
                webhooks: [],
                sso: {
                    enabled: false,
                    provider: 'oauth',
                    settings: {}
                },
                api: {
                    enabled: false,
                    version: '1.0.0',
                    rateLimit: {
                        requests: 1000,
                        window: 3600
                    },
                    authentication: {
                        required: false,
                        methods: ['apikey']
                    }
                }
            },
            compliance: {
                enabled: false,
                frameworks: [],
                autoRemediation: false
            }
        };
        this.state.config.enterprise = Object.assign(Object.assign(Object.assign({}, defaults), this.state.config.enterprise), config);
        return this;
    }
    // Actions configuration
    actions(actions) {
        this.state.config.actions = [...actions];
        return this;
    }
    addAction(action) {
        if (!this.state.config.actions) {
            this.state.config.actions = [];
        }
        this.state.config.actions.push(action);
        return this;
    }
    // Features configuration
    features(config) {
        this.state.config.features = Object.assign(Object.assign({}, this.state.config.features), config);
        return this;
    }
    // Development configuration
    development(config) {
        this.state.config.development = Object.assign(Object.assign({}, this.state.config.development), config);
        return this;
    }
    // Environment configuration and validation methods
    /**
     * Explicit environment configuration method
     * Allows manual override of environment detection and configuration
     */
    environmentConfig(config) {
        // Store environment config in metadata
        if (!this.state.config.metadata) {
            this.state.config.metadata = {};
        }
        this.state.config.metadata.environmentConfig = config;
        // Apply configuration immediately if provided
        if (config.framework) {
            this.frameworkSpecific(config.framework === 'nextjs' || config.framework === 'vite' ? config.framework : 'auto');
        }
        if (config.model && !this.state.config.model) {
            this.state.config.model = config.model;
        }
        if (config.requireApiKey !== undefined) {
            this.state.config.metadata.requireApiKey = config.requireApiKey;
        }
        if (config.validateOnBuild !== undefined) {
            this.state.config.metadata.validateEnvironmentOnBuild = config.validateOnBuild;
        }
        return this;
    }
    /**
     * Auto-detects and configures environment-specific settings
     */
    autoDetectEnvironment() {
        const framework = detectFramework();
        // Set framework-aware defaults
        if (framework === 'nextjs') {
            this.development({
                debugMode: false, // More conservative for Next.js
                mockMode: false
            });
        }
        else if (framework === 'vite') {
            this.development({
                debugMode: true, // Vite is often used for development
                mockMode: false
            });
        }
        // Set default model if not already set and API key is available
        if (!this.state.config.model) {
            try {
                this.state.config.model = getDefaultModel();
            }
            catch (_a) {
                // Ignore if default model can't be determined
            }
        }
        return this;
    }
    /**
     * Validates environment configuration
     */
    validateEnvironment() {
        var _a;
        const envConfig = (_a = this.state.config.metadata) === null || _a === void 0 ? void 0 : _a.environmentConfig;
        const envValidation = validateEnvironment(envConfig);
        if (!envValidation.isValid) {
            // Store environment validation errors
            this.state.validationErrors.environment = envValidation.errors;
            // Add warnings as well
            if (envValidation.warnings.length > 0) {
                this.state.validationErrors.environmentWarnings = envValidation.warnings;
            }
        }
        return this;
    }
    /**
     * Requires API key to be present (throws on build if missing)
     */
    requireApiKey() {
        this.state.config.metadata = Object.assign(Object.assign({}, this.state.config.metadata), { requireApiKey: true });
        return this;
    }
    /**
     * Sets up framework-specific configuration
     */
    frameworkSpecific(framework) {
        const detectedFramework = framework === 'auto' || !framework ? detectFramework() : framework;
        switch (detectedFramework) {
            case 'nextjs':
                this.performance({
                    streamingEnabled: true, // Next.js handles streaming well
                    rateLimiting: {
                        maxRequestsPerMinute: 60,
                        maxRequestsPerHour: 1000
                    }
                });
                break;
            case 'vite':
                this.performance({
                    streamingEnabled: true,
                    rateLimiting: {
                        maxRequestsPerMinute: 30, // More conservative for dev environments
                        maxRequestsPerHour: 500
                    }
                });
                break;
        }
        return this;
    }
    // Preset configurations
    preset(type) {
        this.state.appliedPresets.push(type);
        switch (type) {
            case 'basic':
                return this.basicPreset();
            case 'enterprise':
                return this.enterprisePreset();
            case 'development':
                return this.developmentPreset();
            case 'production':
                return this.productionPreset();
            case 'compliance-gdpr':
                return this.gdprPreset();
            case 'compliance-hipaa':
                return this.hipaaPreset();
            case 'high-performance':
                return this.highPerformancePreset();
            case 'secure':
                return this.securePreset();
            default:
                return this;
        }
    }
    // Preset implementations
    basicPreset() {
        return this
            .autoDetectEnvironment()
            .frameworkSpecific('auto')
            .ui({
            theme: 'auto',
            layout: 'chatbox',
            showAvatar: true,
            floatingButton: false
        })
            .security({
            compliance: 'none',
            encryptAtRest: false,
            auditLogging: false,
            dataRetention: 7
        });
    }
    enterprisePreset() {
        return this
            .autoDetectEnvironment()
            .requireApiKey()
            .validateEnvironment()
            .security({
            compliance: 'gdpr',
            encryptAtRest: true,
            auditLogging: true,
            dataRetention: 90
        })
            .enterpriseSecurity({
            enabled: true,
            threatDetection: {
                enabled: true,
                sensitivity: 'medium',
                realTimeMonitoring: true
            },
            audit: {
                enabled: true,
                retention: 365,
                realTimeAlerts: true
            },
            piiProtection: {
                enabled: true,
                autoDetection: true,
                maskingRules: ['email', 'phone', 'ssn']
            }
        })
            .enterprisePerformance({
            monitoring: {
                enabled: true,
                metricsCollection: true,
                realTimeDashboard: true
            },
            optimization: {
                enabled: true,
                autoScaling: false,
                caching: true
            },
            analytics: {
                enabled: true,
                userJourneyTracking: true,
                customMetrics: true
            }
        })
            .enterprise({
            dashboard: {
                enabled: true,
                realTimeUpdates: true,
                customWidgets: true
            },
            compliance: {
                enabled: true,
                frameworks: ['gdpr', 'sox'],
                autoRemediation: false
            }
        });
    }
    developmentPreset() {
        return this
            .autoDetectEnvironment()
            .environmentConfig({
            validateOnBuild: true,
            requireApiKey: false // More permissive for development
        })
            .development({
            mockMode: true,
            debugMode: true
        })
            .ui({
            theme: 'dark'
        })
            .security({
            compliance: 'none',
            encryptAtRest: false
        })
            .performance({
            rateLimiting: {
                maxRequestsPerMinute: 100,
                maxRequestsPerHour: 1000
            }
        });
    }
    productionPreset() {
        return this
            .autoDetectEnvironment()
            .requireApiKey()
            .validateEnvironment()
            .development({
            mockMode: false,
            debugMode: false
        })
            .security({
            encryptAtRest: true,
            auditLogging: true,
            dataRetention: 30
        })
            .performance({
            streamingEnabled: true,
            caching: { enabled: true, ttl: 600 },
            rateLimiting: {
                maxRequestsPerMinute: 60,
                maxRequestsPerHour: 1000
            }
        });
    }
    gdprPreset() {
        return this
            .security({
            compliance: 'gdpr',
            encryptAtRest: true,
            auditLogging: true,
            dataRetention: 30
        })
            .enterpriseSecurity({
            enabled: true,
            piiProtection: {
                enabled: true,
                autoDetection: true,
                maskingRules: ['email', 'name', 'address']
            }
        });
    }
    hipaaPreset() {
        return this
            .security({
            compliance: 'hipaa',
            encryptAtRest: true,
            auditLogging: true,
            dataRetention: 180
        })
            .enterpriseSecurity({
            enabled: true,
            threatDetection: {
                enabled: true,
                sensitivity: 'high',
                realTimeMonitoring: true
            },
            piiProtection: {
                enabled: true,
                autoDetection: true,
                maskingRules: ['ssn', 'medical_record', 'insurance']
            }
        });
    }
    highPerformancePreset() {
        return this
            .performance({
            streamingEnabled: true,
            caching: { enabled: true, ttl: 900 },
            rateLimiting: {
                maxRequestsPerMinute: 120,
                maxRequestsPerHour: 5000
            }
        })
            .enterprisePerformance({
            monitoring: {
                enabled: true,
                metricsCollection: true,
                realTimeDashboard: true
            },
            optimization: {
                enabled: true,
                autoScaling: true,
                caching: true
            }
        });
    }
    securePreset() {
        return this
            .security({
            encryptAtRest: true,
            auditLogging: true,
            compliance: 'gdpr',
            dataRetention: 90
        })
            .enterpriseSecurity({
            enabled: true,
            threatDetection: {
                enabled: true,
                sensitivity: 'high',
                realTimeMonitoring: true
            },
            audit: {
                enabled: true,
                retention: 365,
                realTimeAlerts: true
            },
            piiProtection: {
                enabled: true,
                autoDetection: true,
                maskingRules: []
            }
        });
    }
    // Utility methods
    sanitizeSlug(slug) {
        return slug
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    applyDefaults() {
        const config = this.state.config;
        // Apply minimal required defaults
        if (!config.model && config.modelProvider === 'openai') {
            config.model = 'gpt-3.5-turbo';
        }
        if (!config.tools)
            config.tools = [];
        if (!config.contextSources)
            config.contextSources = [];
        if (!config.actions)
            config.actions = [];
        if (!config.fallbackMessage) {
            config.fallbackMessage = 'I apologize, but I encountered an error. Please try again.';
        }
        if (!config.memoryScope)
            config.memoryScope = 'session';
        return config;
    }
    // Validation method using the full ConfigValidator
    validateBasic() {
        var _a, _b;
        try {
            const configToValidate = this.applyDefaults();
            const fullValidation = validateConfig(configToValidate);
            return {
                isValid: fullValidation.isValid,
                errors: fullValidation.errors,
                warnings: fullValidation.warnings
            };
        }
        catch (error) {
            // Fallback to basic validation if full validation fails
            const errors = [];
            const warnings = [];
            // Type-safe string validation
            if (typeof this.state.config.name !== 'string' || !this.state.config.name.trim()) {
                errors.push('name is required');
            }
            if (typeof this.state.config.slug !== 'string' || !this.state.config.slug.trim()) {
                errors.push('slug is required');
            }
            if (typeof this.state.config.firstMessage !== 'string' || !this.state.config.firstMessage.trim()) {
                errors.push('firstMessage is required');
            }
            if (typeof this.state.config.databasePath !== 'string' || !this.state.config.databasePath.trim()) {
                errors.push('databasePath is required');
            }
            if (typeof this.state.config.embedLocation !== 'string' || !this.state.config.embedLocation.trim()) {
                errors.push('embedLocation is required');
            }
            if (typeof this.state.config.modelProvider !== 'string' || !this.state.config.modelProvider.trim()) {
                errors.push('modelProvider is required');
            }
            if (typeof this.state.config.systemPrompt !== 'string' || !this.state.config.systemPrompt.trim()) {
                errors.push('systemPrompt is required');
            }
            // Environment validation for critical configurations
            if (this.state.config.modelProvider === 'openai') {
                try {
                    // Use the new unified function that checks config first, then environment
                    const envConfig = (_a = this.state.config.metadata) === null || _a === void 0 ? void 0 : _a.environmentConfig;
                    getApiKeyWithConfig(envConfig);
                }
                catch (apiError) {
                    // Only error if API key is explicitly required
                    if ((_b = this.state.config.metadata) === null || _b === void 0 ? void 0 : _b.requireApiKey) {
                        errors.push(`OpenAI API key is required but not found: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
                    }
                    else {
                        // Add as warning instead of error if not required
                        warnings.push(`OpenAI API key not found: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
                    }
                }
            }
            // Include any environment validation errors stored during validateEnvironment()
            if (this.state.validationErrors.environment) {
                errors.push(...this.state.validationErrors.environment);
            }
            return {
                isValid: errors.length === 0,
                errors: { general: errors },
                warnings: warnings
            };
        }
    }
    // Build methods
    build() {
        this.state.buildAttempts++;
        const validation = this.validateBasic();
        if (!validation.isValid) {
            // Create a descriptive error message from the validation results
            const errorMessages = Object.entries(validation.errors)
                .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                .join('; ');
            throw new ConfigValidationError(validation.errors, validation.warnings, `Configuration validation failed after ${this.state.buildAttempts} attempts. ${errorMessages}`);
        }
        const config = this.applyDefaults();
        return config;
    }
    // Build without throwing (returns validation result)
    tryBuild() {
        var _a;
        try {
            // Run environment validation if requested
            if (((_a = this.state.config.metadata) === null || _a === void 0 ? void 0 : _a.validateEnvironmentOnBuild) !== false) {
                this.validateEnvironment();
            }
            const config = this.build();
            return { success: true, config };
        }
        catch (error) {
            if (error instanceof ConfigValidationError) {
                const flatErrors = [];
                Object.values(error.errors).forEach(errorArray => {
                    flatErrors.push(...errorArray);
                });
                return {
                    success: false,
                    errors: flatErrors
                };
            }
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    // Get current state
    getState() {
        return Object.assign({}, this.state);
    }
    // Reset builder
    reset() {
        this.state = {
            config: {},
            validationErrors: {},
            appliedPresets: [],
            buildAttempts: 0
        };
        return this;
    }
    // Clone builder
    clone() {
        const cloned = new CopilotConfigBuilder();
        cloned.state = {
            config: Object.assign({}, this.state.config),
            validationErrors: Object.assign({}, this.state.validationErrors),
            appliedPresets: [...this.state.appliedPresets],
            buildAttempts: this.state.buildAttempts
        };
        return cloned;
    }
}
// Factory functions
export const createCopilotConfig = (initialConfig) => new CopilotConfigBuilder(initialConfig);
export const createBasicConfig = (name, message) => createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('basic');
export const createEnterpriseConfig = (name, message) => createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('enterprise');
export const createDevelopmentConfig = (name, message) => createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('development');
export const createProductionConfig = (name, message) => createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('production');
// Preset-specific builders
export const createSecureConfig = (name, message) => createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('secure');
export const createHighPerformanceConfig = (name, message) => createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('high-performance');
export const createComplianceConfig = (name, message, framework) => createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset(framework === 'gdpr' ? 'compliance-gdpr' : 'compliance-hipaa');
