// Core types
export * from './types';
// Initialize providers
import './providers/openai';
// Hooks
export { useCopilotChat } from './hooks/useCopilotChat';
export { useCopilotConfig, migrateConfig } from './hooks/useCopilotConfig';
export { useModelProvider } from './hooks/useModelProvider';
export { useTools } from './hooks/useTools';
// Components
export { CopilotChat, RESIZABLE_PANEL_CLASSNAME } from './components/CopilotChat';
export { CopilotProvider, useCopilotContext, withCopilot } from './components/CopilotProvider';
export { FloatingCopilot } from './components/FloatingCopilot';
export { ResizableLayout } from './components/ResizableLayout';
export { OnboardingFlow } from './components/OnboardingFlow';
export { ActionButtons } from './components/ActionButtons';
// Services
export { BaseProvider, ProviderRegistry } from './services/BaseProvider';
export { OllamaProvider } from './services/OllamaProvider';
export { CustomProvider, createCustomProvider } from './services/CustomProvider';
// Providers
export { OPENAI_MODELS, createOpenAIConfig } from './providers/openai';
// Phase 6: Builder pattern exports
export { CopilotConfigBuilder, createCopilotConfig, createBasicConfig, createEnterpriseConfig as createEnterpriseConfigBuilder, createDevelopmentConfig, createProductionConfig, createSecureConfig, createHighPerformanceConfig, createComplianceConfig } from './builders/ConfigBuilder';
// Phase 6: Enhanced validation exports
export { ConfigValidator, configValidator, validateConfig as validateConfigStrict, autoFixConfig, getImprovementPlan } from './validation/ConfigValidator';
// Phase 6: Migration utilities
export { MigrationAssistant, migrationAssistant, migrateToAI, migrateToLatest as migrateToLatestPhase, getMigrationPlan, previewMigration, validateMigration } from './migration/MigrationAssistant';
// Type utilities
export { isAICopilotConfig, isLegacyCopilotConfig } from './types';
// Phase 5 Components
export { default as EnterpriseDashboard } from './components/EnterpriseDashboard';
// UI Components
export { Button } from './components/ui/button';
export { Input } from './components/ui/input';
export { ScrollArea } from './components/ui/scroll_area';
// Phase 5 Hooks
export { useMemoryScope } from './hooks/useMemoryScope';
export { useSecurityPolicy } from './hooks/useSecurityPolicy';
// Environment Detection Utilities
export { detectFramework, getApiKey, getDefaultModel, validateEnvironment, detectEnvironment, getEnvVar } from './lib/env';
// Version helpers
export { COPILOT_VERSION as COPILOT_LIB_VERSION, COPILOT_COMMIT, getVersion } from './lib/version';
// Utilities and Constants
export const COPILOT_VERSION = '1.0.0-phase5';
// Enterprise utilities
export const createEnterpriseConfig = (baseConfig) => (Object.assign(Object.assign({}, baseConfig), { enterpriseSecurity: {
        enabled: true,
        threatDetection: {
            enabled: true,
            sensitivity: 'medium',
            realTimeMonitoring: true
        },
        policies: {
            dataAccess: [],
            userPermissions: {},
            complianceFramework: ['gdpr']
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
    }, enterprisePerformance: {
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
        alerts: {
            enabled: true,
            thresholds: {
                responseTime: 1000,
                errorRate: 0.05,
                resourceUsage: 0.8
            }
        },
        analytics: {
            enabled: true,
            userJourneyTracking: true,
            customMetrics: true
        }
    }, enterpriseMemory: {
        scopes: {
            enabled: ['session', 'user', 'organization'],
            default: 'user'
        },
        encryption: {
            enabled: true,
            algorithm: 'AES-256-GCM'
        },
        synchronization: {
            enabled: true,
            crossDevice: true,
            conflictResolution: 'timestamp-based'
        },
        retention: {
            policies: {
                session: { maxAge: 24 * 60 * 60 * 1000, maxSize: 50 * 1024 * 1024 },
                user: { maxAge: 30 * 24 * 60 * 60 * 1000, maxSize: 200 * 1024 * 1024 },
                organization: { maxAge: 90 * 24 * 60 * 60 * 1000, maxSize: 1024 * 1024 * 1024 }
            },
            compression: true
        }
    }, enterprise: {
        dashboard: {
            enabled: true,
            realTimeUpdates: true,
            customWidgets: true
        },
        reporting: {
            enabled: true,
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
                enabled: true,
                version: '1.0.0',
                rateLimit: {
                    requests: 1000,
                    window: 3600
                },
                authentication: {
                    required: true,
                    methods: ['apikey', 'bearer']
                }
            }
        },
        compliance: {
            enabled: true,
            frameworks: ['gdpr'],
            autoRemediation: false
        }
    } }));
// Migration utility for upgrading configurations
export const migrateToPhase5 = (legacyConfig) => {
    if ('title' in legacyConfig) {
        // Migrate from legacy CopilotConfig
        return createEnterpriseConfig({
            name: legacyConfig.title,
            slug: legacyConfig.title.toLowerCase().replace(/\s+/g, '-'),
            description: legacyConfig.subtitle || '',
            firstMessage: legacyConfig.initialMessage || 'Hello! How can I help you?',
            databasePath: '/tmp/copilot.db',
            embedLocation: 'body',
            modelProvider: 'openai',
            model: 'gpt-4-turbo',
            systemPrompt: 'You are a helpful AI assistant.',
            uiConfig: {
                theme: 'light',
                showAvatar: true,
                floatingButton: false,
                layout: 'chatbox'
            }
        });
    }
    // Add enterprise features to existing AICopilotConfig
    return createEnterpriseConfig(legacyConfig);
};
// Phase 5 validation
export const validatePhase5Config = (config) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const errors = [];
    const warnings = [];
    if (((_a = config.enterpriseSecurity) === null || _a === void 0 ? void 0 : _a.enabled) && !((_b = config.enterpriseSecurity.audit) === null || _b === void 0 ? void 0 : _b.enabled)) {
        errors.push('Audit trail must be enabled when enterprise security is active');
    }
    if (((_d = (_c = config.enterpriseMemory) === null || _c === void 0 ? void 0 : _c.encryption) === null || _d === void 0 ? void 0 : _d.enabled) && !((_e = config.enterpriseSecurity) === null || _e === void 0 ? void 0 : _e.enabled)) {
        warnings.push('Memory encryption is enabled but enterprise security is disabled');
    }
    if (((_g = (_f = config.enterprise) === null || _f === void 0 ? void 0 : _f.dashboard) === null || _g === void 0 ? void 0 : _g.enabled) && !((_j = (_h = config.enterprisePerformance) === null || _h === void 0 ? void 0 : _h.monitoring) === null || _j === void 0 ? void 0 : _j.enabled)) {
        warnings.push('Enterprise dashboard requires performance monitoring to be enabled');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        recommendations: [
            'Enable all enterprise features for optimal security and monitoring',
            'Configure compliance frameworks based on your industry requirements',
            'Set up webhooks for real-time event notifications'
        ]
    };
};
// Phase 6: Developer experience note
// Use the exported functions directly for building, validating, and migrating configurations
// Example: createBasicConfig('My Bot', 'Hello!') or validateConfigStrict(config)
// =============================
// Agent API (additive exports)
// =============================
export * from './agent/types';
export * from './agent/logger';
export { CopilotAgent } from './agent/CopilotAgent';
export { asTool, createOrchestratorConfig } from './agent/orchestrate';
// Agent UI plug-in and default UI
export { AgentUIRegistry } from './components/agent-ui-registry';
export { AgentChatUI } from './components/AgentChatUI';
export { AgentEnabledCopilot } from './components/AgentEnabledCopilot';
export { AgentCopilotChat } from './components/AgentCopilotChat';
// Optional native tools
export { createPaymentTools } from './tools/payment';
export { createCommunicationTools } from './tools/communications';
// Register default agent UI mapping (side-effect)
import './components/agent-ui-default-register';
