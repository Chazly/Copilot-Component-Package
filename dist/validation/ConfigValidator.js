import { isAICopilotConfig, isLegacyCopilotConfig } from '../types';
import { detectConfigPhase, hasEnterpriseFeatures } from '../types/utils';
export class ConfigValidator {
    constructor() {
        this.validModelProviders = ['openai', 'anthropic', 'mistral', 'local'];
        this.validMemoryScopes = ['session', 'user', 'org', 'ephemeral'];
        this.validLayouts = ['chatbox', 'sidebar', 'fullpage'];
        this.validThemes = ['dark', 'light', 'auto'];
        this.validCompliance = ['gdpr', 'hipaa', 'sox', 'none'];
        this.validTones = ['professional', 'casual', 'witty', 'empathetic', 'neutral'];
    }
    validate(config) {
        const errors = {};
        const warnings = [];
        const suggestions = [];
        let score = 100;
        // Required field validation
        this.validateRequiredFields(config, errors);
        // Type-specific validation
        if (isAICopilotConfig(config)) {
            this.validateAIConfig(config, errors, warnings, suggestions);
            score = this.calculateQualityScore(config);
        }
        else if (isLegacyCopilotConfig(config)) {
            this.validateLegacyConfig(config, errors, warnings, suggestions);
            score = this.calculateLegacyScore(config);
        }
        else {
            errors.general = ['Invalid configuration format - must be either CopilotConfig or AICopilotConfig'];
            score = 0;
        }
        // Cross-field validation
        this.validateCrossFields(config, errors, warnings);
        // Security validation
        this.validateSecurity(config, warnings, suggestions);
        // Performance validation  
        this.validatePerformance(config, warnings, suggestions);
        // Generate quality suggestions
        this.generateQualitySuggestions(config, suggestions);
        // Add migration suggestions for legacy configs
        if (isLegacyCopilotConfig(config)) {
            suggestions.push({
                type: 'migration',
                message: 'Consider migrating to AICopilotConfig for advanced features and enterprise capabilities',
                action: 'migrateToAI',
                impact: 'high',
                autoFixable: true
            });
        }
        return {
            config,
            isValid: Object.keys(errors).length === 0,
            errors,
            warnings,
            suggestions,
            phase: detectConfigPhase(config),
            score: Math.max(0, score - (Object.keys(errors).length * 20) - (warnings.length * 5)),
            recommendations: this.generateRecommendations(config, suggestions)
        };
    }
    validateRequiredFields(config, errors) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (isAICopilotConfig(config)) {
            if (!((_a = config.name) === null || _a === void 0 ? void 0 : _a.trim())) {
                errors.name = ['Name is required and cannot be empty'];
            }
            if (!((_b = config.slug) === null || _b === void 0 ? void 0 : _b.trim())) {
                errors.slug = ['Slug is required and cannot be empty'];
            }
            else if (!/^[a-z0-9-]+$/.test(config.slug)) {
                errors.slug = ['Slug must contain only lowercase letters, numbers, and hyphens'];
            }
            if (!((_c = config.firstMessage) === null || _c === void 0 ? void 0 : _c.trim())) {
                errors.firstMessage = ['First message is required and cannot be empty'];
            }
            if (!((_d = config.databasePath) === null || _d === void 0 ? void 0 : _d.trim())) {
                errors.databasePath = ['Database path is required and cannot be empty'];
            }
            if (!((_e = config.embedLocation) === null || _e === void 0 ? void 0 : _e.trim())) {
                errors.embedLocation = ['Embed location is required and cannot be empty'];
            }
            if (!((_f = config.modelProvider) === null || _f === void 0 ? void 0 : _f.trim())) {
                errors.modelProvider = ['Model provider is required and cannot be empty'];
            }
            if (!((_g = config.systemPrompt) === null || _g === void 0 ? void 0 : _g.trim())) {
                errors.systemPrompt = ['System prompt is required and cannot be empty'];
            }
        }
        else if (isLegacyCopilotConfig(config)) {
            if (!((_h = config.title) === null || _h === void 0 ? void 0 : _h.trim())) {
                errors.title = ['Title is required and cannot be empty'];
            }
            if (!((_j = config.subtitle) === null || _j === void 0 ? void 0 : _j.trim())) {
                errors.subtitle = ['Subtitle is required and cannot be empty'];
            }
            if (!((_k = config.initialMessage) === null || _k === void 0 ? void 0 : _k.trim())) {
                errors.initialMessage = ['Initial message is required and cannot be empty'];
            }
            if (!config.color) {
                errors.color = ['Color is required'];
            }
        }
    }
    validateAIConfig(config, errors, warnings, suggestions) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        // Model provider validation
        if (config.modelProvider && !this.validModelProviders.includes(config.modelProvider) && !config.modelProvider.startsWith('custom:')) {
            warnings.push(`Unrecognized model provider: ${config.modelProvider}`);
            suggestions.push({
                type: 'usability',
                message: 'Consider using a well-supported model provider for better reliability',
                impact: 'medium',
                autoFixable: false
            });
        }
        // Memory scope validation
        if (config.memoryScope && !this.validMemoryScopes.includes(config.memoryScope)) {
            errors.memoryScope = [`Invalid memory scope: ${config.memoryScope}. Must be one of: ${this.validMemoryScopes.join(', ')}`];
        }
        // UI validation
        if (((_a = config.uiConfig) === null || _a === void 0 ? void 0 : _a.layout) && !this.validLayouts.includes(config.uiConfig.layout)) {
            errors['uiConfig.layout'] = [`Invalid layout: ${config.uiConfig.layout}. Must be one of: ${this.validLayouts.join(', ')}`];
        }
        if (((_b = config.uiConfig) === null || _b === void 0 ? void 0 : _b.theme) && !this.validThemes.includes(config.uiConfig.theme)) {
            errors['uiConfig.theme'] = [`Invalid theme: ${config.uiConfig.theme}. Must be one of: ${this.validThemes.join(', ')}`];
        }
        // Persona validation
        if (((_c = config.persona) === null || _c === void 0 ? void 0 : _c.tone) && !this.validTones.includes(config.persona.tone)) {
            errors['persona.tone'] = [`Invalid tone: ${config.persona.tone}. Must be one of: ${this.validTones.join(', ')}`];
        }
        // Security validation
        if (((_d = config.security) === null || _d === void 0 ? void 0 : _d.compliance) && !this.validCompliance.includes(config.security.compliance)) {
            errors['security.compliance'] = [`Invalid compliance setting: ${config.security.compliance}. Must be one of: ${this.validCompliance.join(', ')}`];
        }
        // Enterprise validation
        if (((_e = config.enterpriseSecurity) === null || _e === void 0 ? void 0 : _e.enabled) && !((_f = config.security) === null || _f === void 0 ? void 0 : _f.auditLogging)) {
            warnings.push('Enterprise security is enabled but basic audit logging is disabled');
            suggestions.push({
                type: 'security',
                message: 'Enable audit logging when using enterprise security features',
                action: 'enableAuditLogging',
                impact: 'medium',
                autoFixable: true
            });
        }
        // Performance validation
        if ((_g = config.performance) === null || _g === void 0 ? void 0 : _g.rateLimiting) {
            if (config.performance.rateLimiting.maxRequestsPerMinute > config.performance.rateLimiting.maxRequestsPerHour) {
                errors['performance.rateLimiting'] = ['Max requests per minute cannot exceed max requests per hour'];
            }
        }
        // Features validation
        if ((_j = (_h = config.features) === null || _h === void 0 ? void 0 : _h.fileUpload) === null || _j === void 0 ? void 0 : _j.enabled) {
            if (!config.features.fileUpload.maxFileSize || config.features.fileUpload.maxFileSize <= 0) {
                errors['features.fileUpload.maxFileSize'] = ['Max file size must be greater than 0 when file upload is enabled'];
            }
            if (!config.features.fileUpload.allowedTypes || config.features.fileUpload.allowedTypes.length === 0) {
                warnings.push('File upload is enabled but no allowed file types are specified');
            }
        }
        // Development mode warnings
        if ((_k = config.development) === null || _k === void 0 ? void 0 : _k.debugMode) {
            warnings.push('Debug mode is enabled - remember to disable in production');
        }
        if ((_l = config.development) === null || _l === void 0 ? void 0 : _l.mockMode) {
            warnings.push('Mock mode is enabled - AI responses will be simulated');
        }
    }
    validateLegacyConfig(config, errors, warnings, suggestions) {
        const validColors = ['blue', 'green', 'purple', 'emerald', 'cyan', 'amber', 'teal', 'slate', 'indigo'];
        if (config.color && !validColors.includes(config.color)) {
            errors.color = [`Invalid color: ${config.color}. Must be one of: ${validColors.join(', ')}`];
        }
        warnings.push('Using legacy CopilotConfig - consider migrating to AICopilotConfig for advanced features');
        suggestions.push({
            type: 'migration',
            message: 'Upgrade to AICopilotConfig to access enterprise features, better security, and performance monitoring',
            action: 'migrateToAI',
            impact: 'high',
            autoFixable: true
        });
    }
    validateCrossFields(config, errors, warnings) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (isAICopilotConfig(config)) {
            // Validate consistency between related fields
            if (((_a = config.enterpriseSecurity) === null || _a === void 0 ? void 0 : _a.enabled) && ((_b = config.security) === null || _b === void 0 ? void 0 : _b.compliance) === 'none') {
                warnings.push('Enterprise security is enabled but compliance framework is set to none');
            }
            if (((_d = (_c = config.enterprisePerformance) === null || _c === void 0 ? void 0 : _c.monitoring) === null || _d === void 0 ? void 0 : _d.enabled) && !((_e = config.performance) === null || _e === void 0 ? void 0 : _e.streamingEnabled)) {
                warnings.push('Performance monitoring is enabled but streaming is disabled - some metrics may be limited');
            }
            if (((_f = config.visibility) === null || _f === void 0 ? void 0 : _f.isPublic) === false && (!config.visibility.rolesAllowed || config.visibility.rolesAllowed.length === 0)) {
                warnings.push('Copilot is private but no roles are specified - no users will have access');
            }
            // Validate enterprise memory with security
            if (((_h = (_g = config.enterpriseMemory) === null || _g === void 0 ? void 0 : _g.encryption) === null || _h === void 0 ? void 0 : _h.enabled) && !((_j = config.enterpriseSecurity) === null || _j === void 0 ? void 0 : _j.enabled)) {
                warnings.push('Memory encryption is enabled but enterprise security is disabled');
            }
        }
    }
    validateSecurity(config, warnings, suggestions) {
        var _a, _b, _c;
        if (isAICopilotConfig(config)) {
            // Basic security recommendations
            if (!((_a = config.security) === null || _a === void 0 ? void 0 : _a.encryptAtRest)) {
                suggestions.push({
                    type: 'security',
                    message: 'Enable encryption at rest for better data protection',
                    action: 'enableEncryption',
                    impact: 'medium',
                    autoFixable: true
                });
            }
            if (!((_b = config.security) === null || _b === void 0 ? void 0 : _b.auditLogging)) {
                suggestions.push({
                    type: 'security',
                    message: 'Enable audit logging for compliance and debugging',
                    action: 'enableAuditLogging',
                    impact: 'medium',
                    autoFixable: true
                });
            }
            // Enterprise security recommendations
            if (!hasEnterpriseFeatures(config)) {
                suggestions.push({
                    type: 'security',
                    message: 'Consider enabling enterprise security features for production environments',
                    impact: 'high',
                    autoFixable: false
                });
            }
            else if (config.enterpriseSecurity && !((_c = config.enterpriseSecurity.threatDetection) === null || _c === void 0 ? void 0 : _c.enabled)) {
                suggestions.push({
                    type: 'security',
                    message: 'Enable threat detection for real-time security monitoring',
                    action: 'enableThreatDetection',
                    impact: 'high',
                    autoFixable: true
                });
            }
        }
    }
    validatePerformance(config, warnings, suggestions) {
        var _a, _b, _c, _d;
        if (isAICopilotConfig(config)) {
            // Caching recommendations
            if (!((_b = (_a = config.performance) === null || _a === void 0 ? void 0 : _a.caching) === null || _b === void 0 ? void 0 : _b.enabled)) {
                suggestions.push({
                    type: 'performance',
                    message: 'Enable caching to improve response times',
                    action: 'enableCaching',
                    impact: 'medium',
                    autoFixable: true
                });
            }
            // Streaming recommendations
            if (!((_c = config.performance) === null || _c === void 0 ? void 0 : _c.streamingEnabled)) {
                suggestions.push({
                    type: 'performance',
                    message: 'Enable streaming for better user experience with long responses',
                    action: 'enableStreaming',
                    impact: 'low',
                    autoFixable: true
                });
            }
            // Rate limiting validation
            if ((_d = config.performance) === null || _d === void 0 ? void 0 : _d.rateLimiting) {
                const { maxRequestsPerMinute, maxRequestsPerHour } = config.performance.rateLimiting;
                if (maxRequestsPerMinute && maxRequestsPerHour && maxRequestsPerMinute * 60 > maxRequestsPerHour) {
                    warnings.push('Rate limiting configuration may be too restrictive - per-minute limit exceeds hourly capacity');
                }
            }
        }
    }
    generateQualitySuggestions(config, suggestions) {
        var _a;
        if (isAICopilotConfig(config)) {
            // Onboarding suggestions
            if (!config.onboardingSteps || config.onboardingSteps.length === 0) {
                suggestions.push({
                    type: 'usability',
                    message: 'Add onboarding steps to improve user experience',
                    impact: 'medium',
                    autoFixable: false
                });
            }
            // Actions suggestions
            if (!config.actions || config.actions.length === 0) {
                suggestions.push({
                    type: 'usability',
                    message: 'Add action buttons to provide quick user interactions',
                    impact: 'low',
                    autoFixable: false
                });
            }
            // Tools suggestions
            if (!config.tools || config.tools.length === 0) {
                suggestions.push({
                    type: 'usability',
                    message: 'Configure tools to extend copilot capabilities',
                    impact: 'low',
                    autoFixable: false
                });
            }
            // Analytics suggestions
            if (!((_a = config.analytics) === null || _a === void 0 ? void 0 : _a.trackConversations)) {
                suggestions.push({
                    type: 'usability',
                    message: 'Enable conversation tracking for usage insights',
                    action: 'enableAnalytics',
                    impact: 'low',
                    autoFixable: true
                });
            }
        }
    }
    calculateQualityScore(config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        let score = 100;
        // Deduct points for missing optional but recommended features
        if (!config.description)
            score -= 5;
        if (!((_a = config.persona) === null || _a === void 0 ? void 0 : _a.tone))
            score -= 5;
        if (!((_b = config.persona) === null || _b === void 0 ? void 0 : _b.avatarUrl))
            score -= 3;
        if (!config.onboardingSteps || config.onboardingSteps.length === 0)
            score -= 10;
        if (!config.actions || config.actions.length === 0)
            score -= 8;
        if (!config.tools || config.tools.length === 0)
            score -= 8;
        if (!((_c = config.security) === null || _c === void 0 ? void 0 : _c.encryptAtRest))
            score -= 10;
        if (!((_d = config.security) === null || _d === void 0 ? void 0 : _d.auditLogging))
            score -= 8;
        if (!((_f = (_e = config.performance) === null || _e === void 0 ? void 0 : _e.caching) === null || _f === void 0 ? void 0 : _f.enabled))
            score -= 5;
        if (!((_g = config.analytics) === null || _g === void 0 ? void 0 : _g.trackConversations))
            score -= 5;
        if (!hasEnterpriseFeatures(config))
            score -= 15;
        // Add points for advanced features
        if ((_h = config.enterpriseSecurity) === null || _h === void 0 ? void 0 : _h.enabled)
            score += 10;
        if ((_k = (_j = config.enterprisePerformance) === null || _j === void 0 ? void 0 : _j.monitoring) === null || _k === void 0 ? void 0 : _k.enabled)
            score += 8;
        if ((_m = (_l = config.enterpriseMemory) === null || _l === void 0 ? void 0 : _l.encryption) === null || _m === void 0 ? void 0 : _m.enabled)
            score += 5;
        if ((_o = config.features) === null || _o === void 0 ? void 0 : _o.conversationRating)
            score += 3;
        if ((_p = config.features) === null || _p === void 0 ? void 0 : _p.messageReactions)
            score += 2;
        return Math.max(0, Math.min(100, score));
    }
    calculateLegacyScore(config) {
        let score = 50; // Start lower for legacy configs
        if (config.title && config.title.length > 3)
            score += 10;
        if (config.subtitle && config.subtitle.length > 5)
            score += 10;
        if (config.initialMessage && config.initialMessage.length > 10)
            score += 15;
        if (config.color)
            score += 15;
        return Math.max(0, Math.min(100, score));
    }
    generateRecommendations(config, suggestions) {
        const recommendations = [];
        // High-impact suggestions become recommendations
        const highImpactSuggestions = suggestions.filter(s => s.impact === 'high');
        highImpactSuggestions.forEach(suggestion => {
            recommendations.push(suggestion.message);
        });
        // Add general recommendations based on config type
        if (isLegacyCopilotConfig(config)) {
            recommendations.push('Migrate to AICopilotConfig for access to advanced features');
        }
        else if (isAICopilotConfig(config)) {
            if (!hasEnterpriseFeatures(config)) {
                recommendations.push('Consider enabling enterprise features for production deployments');
            }
            if (detectConfigPhase(config) < 5) {
                recommendations.push('Upgrade to Phase 5 for the latest security and performance features');
            }
        }
        return recommendations;
    }
    // Auto-fix common issues
    autoFix(config) {
        const fixed = Object.assign({}, config);
        if (isAICopilotConfig(fixed)) {
            // Fix slug format
            if (fixed.slug) {
                fixed.slug = fixed.slug
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            }
            // Fix missing database path
            if (!fixed.databasePath && fixed.slug) {
                fixed.databasePath = `./data/${fixed.slug}.db`;
            }
            // Fix missing embed location
            if (!fixed.embedLocation) {
                fixed.embedLocation = 'copilot-container';
            }
            // Fix model defaults
            if (!fixed.model && fixed.modelProvider === 'openai') {
                fixed.model = 'gpt-3.5-turbo';
            }
            // Fix fallback message
            if (!fixed.fallbackMessage) {
                fixed.fallbackMessage = 'I apologize, but I encountered an error. Please try again.';
            }
        }
        return fixed;
    }
    // Suggest improvements based on current configuration
    generateImprovementPlan(config) {
        var _a, _b, _c;
        const improvements = [];
        if (isLegacyCopilotConfig(config)) {
            improvements.push({
                type: 'migration',
                message: 'Migrate to AICopilotConfig to unlock advanced capabilities',
                action: 'migrateToAI',
                impact: 'high',
                autoFixable: true
            });
        }
        else if (isAICopilotConfig(config)) {
            const phase = detectConfigPhase(config);
            if (phase < 5) {
                improvements.push({
                    type: 'migration',
                    message: `Upgrade from Phase ${phase} to Phase 5 for latest features`,
                    action: 'upgradeToPhase5',
                    impact: 'high',
                    autoFixable: true
                });
            }
            if (!((_a = config.enterpriseSecurity) === null || _a === void 0 ? void 0 : _a.enabled)) {
                improvements.push({
                    type: 'security',
                    message: 'Enable enterprise security for production-grade protection',
                    action: 'enableEnterpriseSecurity',
                    impact: 'high',
                    autoFixable: true
                });
            }
            if (!((_c = (_b = config.enterprisePerformance) === null || _b === void 0 ? void 0 : _b.monitoring) === null || _c === void 0 ? void 0 : _c.enabled)) {
                improvements.push({
                    type: 'performance',
                    message: 'Enable performance monitoring for insights and optimization',
                    action: 'enablePerformanceMonitoring',
                    impact: 'medium',
                    autoFixable: true
                });
            }
        }
        return improvements;
    }
}
// Singleton instance
export const configValidator = new ConfigValidator();
// Convenience functions
export const validateConfig = (config) => configValidator.validate(config);
export const autoFixConfig = (config) => configValidator.autoFix(config);
export const getImprovementPlan = (config) => configValidator.generateImprovementPlan(config);
