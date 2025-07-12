import { isAICopilotConfig, isLegacyCopilotConfig } from '../types';
import { MigrationError, detectConfigPhase, hasEnterpriseFeatures } from '../types/utils';
export class MigrationAssistant {
    /**
     * Migrate from legacy CopilotConfig to AICopilotConfig
     */
    migrateToAI(legacyConfig) {
        try {
            const slug = this.generateSlug(legacyConfig.title);
            const migratedConfig = Object.assign(Object.assign({ 
                // Core required fields
                name: legacyConfig.title, slug: slug, description: legacyConfig.subtitle, firstMessage: legacyConfig.initialMessage, databasePath: `./data/${slug}.db`, embedLocation: 'copilot-container', modelProvider: 'openai', model: 'gpt-3.5-turbo', systemPrompt: `You are ${legacyConfig.title}. ${legacyConfig.subtitle} Be helpful and professional.`, 
                // Migrate UI configuration
                uiConfig: {
                    theme: 'auto',
                    showAvatar: true,
                    floatingButton: false,
                    layout: 'chatbox'
                } }, this.getDefaultAIConfig()), { 
                // Preserve any custom metadata
                metadata: {
                    migratedFrom: 'legacy',
                    migrationDate: new Date().toISOString(),
                    originalConfig: legacyConfig
                } });
            return migratedConfig;
        }
        catch (error) {
            throw new MigrationError('migrateToAI', error instanceof Error ? error.message : 'Unknown error', 'Failed to migrate legacy configuration to AI configuration');
        }
    }
    /**
     * Migrate any configuration to the latest phase (Phase 5)
     */
    migrateToLatest(config) {
        let aiConfig;
        // First ensure we have an AI config
        if (isLegacyCopilotConfig(config)) {
            aiConfig = this.migrateToAI(config);
        }
        else {
            aiConfig = Object.assign({}, config);
        }
        // Then upgrade to Phase 5 if needed
        const currentPhase = detectConfigPhase(aiConfig);
        if (currentPhase < 5) {
            aiConfig = this.upgradeToPhase5(aiConfig);
        }
        return aiConfig;
    }
    /**
     * Upgrade an AI config to Phase 5 enterprise features
     */
    upgradeToPhase5(config) {
        const upgraded = Object.assign({}, config);
        // Add Phase 5 enterprise features if missing
        if (!upgraded.enterpriseSecurity) {
            upgraded.enterpriseSecurity = this.getDefaultEnterpriseSecurityConfig();
        }
        if (!upgraded.enterprisePerformance) {
            upgraded.enterprisePerformance = this.getDefaultEnterprisePerformanceConfig();
        }
        if (!upgraded.enterpriseMemory) {
            upgraded.enterpriseMemory = this.getDefaultEnterpriseMemoryConfig();
        }
        if (!upgraded.enterprise) {
            upgraded.enterprise = this.getDefaultEnterpriseFeaturesConfig();
        }
        // Enhance security settings for enterprise
        if (!upgraded.security) {
            upgraded.security = {};
        }
        upgraded.security = Object.assign({ dataRetention: 90, encryptAtRest: true, auditLogging: true, compliance: 'gdpr' }, upgraded.security);
        // Enhance performance settings
        if (!upgraded.performance) {
            upgraded.performance = {};
        }
        upgraded.performance = Object.assign({ rateLimiting: {
                maxRequestsPerMinute: 60,
                maxRequestsPerHour: 1000
            }, caching: {
                enabled: true,
                ttl: 300
            }, streamingEnabled: true }, upgraded.performance);
        // Add migration metadata
        upgraded.metadata = Object.assign(Object.assign({}, upgraded.metadata), { upgradedToPhase5: new Date().toISOString(), previousPhase: detectConfigPhase(config) });
        return upgraded;
    }
    /**
     * Generate a comprehensive migration plan
     */
    getMigrationPlan(fromConfig, targetPhase) {
        const currentPhase = detectConfigPhase(fromConfig);
        const target = targetPhase || 5;
        const steps = [];
        let totalTime = 0;
        let hasBreakingChanges = false;
        // Step 1: Legacy to AI migration if needed
        if (isLegacyCopilotConfig(fromConfig)) {
            steps.push({
                step: 1,
                title: 'Migrate to AICopilotConfig',
                description: 'Convert legacy CopilotConfig to advanced AICopilotConfig format',
                action: 'migrateToAI',
                impact: 'Unlocks advanced features, better type safety, and enterprise capabilities',
                required: true,
                estimatedTime: 5
            });
            totalTime += 5;
        }
        // Step 2: Phase upgrades
        if (currentPhase < target) {
            for (let phase = Math.max(currentPhase + 1, 2); phase <= target; phase++) {
                const step = this.getPhaseUpgradeStep(phase, steps.length + 1);
                steps.push(step);
                totalTime += step.estimatedTime;
                if (step.impact.includes('breaking')) {
                    hasBreakingChanges = true;
                }
            }
        }
        // Step 3: Enterprise features if targeting Phase 5
        if (target >= 5 && !hasEnterpriseFeatures(fromConfig)) {
            steps.push({
                step: steps.length + 1,
                title: 'Enable Enterprise Features',
                description: 'Add Phase 5 enterprise security, performance, and memory management',
                action: 'addEnterpriseFeatures',
                impact: 'Adds enterprise-grade security, performance monitoring, and advanced memory management',
                required: false,
                estimatedTime: 10
            });
            totalTime += 10;
        }
        return {
            fromPhase: currentPhase,
            toPhase: target,
            steps,
            totalTime,
            breakingChanges: hasBreakingChanges,
            benefits: this.getMigrationBenefits(currentPhase, target)
        };
    }
    /**
     * Execute migration step by step with validation
     */
    executeMigration(config, plan) {
        let currentConfig = config;
        let result;
        try {
            for (const step of plan.steps) {
                switch (step.action) {
                    case 'migrateToAI':
                        if (isLegacyCopilotConfig(currentConfig)) {
                            result = this.migrateToAI(currentConfig);
                            currentConfig = result;
                        }
                        break;
                    case 'upgradeToPhase5':
                    case 'addEnterpriseFeatures':
                        if (isAICopilotConfig(currentConfig)) {
                            result = this.upgradeToPhase5(currentConfig);
                            currentConfig = result;
                        }
                        break;
                    default:
                        throw new MigrationError(step.action, `Unknown migration action: ${step.action}`, `Failed to execute step ${step.step}: ${step.title}`);
                }
            }
            if (!isAICopilotConfig(currentConfig)) {
                throw new MigrationError('final_validation', 'Migration did not result in valid AICopilotConfig', 'Migration execution failed');
            }
            return currentConfig;
        }
        catch (error) {
            if (error instanceof MigrationError) {
                throw error;
            }
            throw new MigrationError('execution', error instanceof Error ? error.message : 'Unknown error', 'Migration execution failed');
        }
    }
    /**
     * Preview migration changes without applying them
     */
    previewMigration(config) {
        const migrated = this.migrateToLatest(config);
        const changes = [];
        const newFeatures = [];
        if (isLegacyCopilotConfig(config)) {
            changes.push('Configuration format upgraded to AICopilotConfig');
            changes.push(`Title "${config.title}" → Name "${migrated.name}"`);
            changes.push(`Subtitle "${config.subtitle}" → Description "${migrated.description}"`);
            changes.push(`Initial message → First message`);
            newFeatures.push('Advanced model configuration');
            newFeatures.push('System prompt customization');
            newFeatures.push('Tool integration capabilities');
            newFeatures.push('Enhanced security options');
        }
        if (!hasEnterpriseFeatures(config)) {
            newFeatures.push('Enterprise security features');
            newFeatures.push('Performance monitoring');
            newFeatures.push('Advanced memory management');
            newFeatures.push('Compliance frameworks');
            newFeatures.push('Real-time dashboard');
        }
        return {
            current: config,
            migrated,
            changes,
            newFeatures
        };
    }
    /**
     * Validate migration compatibility
     */
    validateMigration(config) {
        const issues = [];
        const warnings = [];
        const recommendations = [];
        if (isLegacyCopilotConfig(config)) {
            // Check for potential migration issues
            if (!config.title || config.title.trim().length === 0) {
                issues.push('Title is required for migration');
            }
            if (config.title && config.title.length > 50) {
                warnings.push('Title is very long - consider shortening for better UX');
            }
            if (!config.subtitle || config.subtitle.trim().length === 0) {
                warnings.push('Subtitle is empty - will result in empty description');
            }
            recommendations.push('Review generated slug and adjust if needed');
            recommendations.push('Customize system prompt for better AI behavior');
            recommendations.push('Configure model provider and model');
        }
        else if (isAICopilotConfig(config)) {
            const phase = detectConfigPhase(config);
            if (phase < 5) {
                recommendations.push(`Upgrade from Phase ${phase} to Phase 5 for latest features`);
            }
            if (!config.enterpriseSecurity) {
                recommendations.push('Enable enterprise security for production deployments');
            }
            if (!config.enterprisePerformance) {
                recommendations.push('Enable performance monitoring for optimization insights');
            }
        }
        return {
            canMigrate: issues.length === 0,
            issues,
            warnings,
            recommendations
        };
    }
    // Private helper methods
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .slice(0, 50); // Limit length
    }
    getDefaultAIConfig() {
        return {
            tools: [],
            contextSources: [],
            persona: {
                voiceStyle: 'helpful',
                tone: 'professional',
                emojiStyle: false
            },
            visibility: {
                rolesAllowed: [],
                isPublic: true
            },
            onboardingSteps: [],
            actions: [],
            fallbackMessage: 'I apologize, but I encountered an error. Please try again.',
            memoryScope: 'session',
            security: {
                dataRetention: 30,
                encryptAtRest: false,
                auditLogging: false,
                compliance: 'none'
            },
            performance: {
                rateLimiting: {
                    maxRequestsPerMinute: 60,
                    maxRequestsPerHour: 1000
                },
                caching: {
                    enabled: true,
                    ttl: 300
                },
                streamingEnabled: true
            },
            analytics: {
                trackConversations: false,
                trackActions: false,
                customEvents: [],
                provider: 'custom'
            },
            integrations: {
                webhooks: {},
                contextProviders: {}
            },
            features: {
                messageReactions: false,
                conversationRating: false,
                fileUpload: {
                    enabled: false,
                    maxFileSize: 10,
                    allowedTypes: ['txt', 'pdf', 'doc', 'docx']
                },
                voiceInput: false,
                conversationExport: false
            },
            development: {
                mockMode: false,
                debugMode: false,
                testPersonas: []
            }
        };
    }
    getDefaultEnterpriseSecurityConfig() {
        return {
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
                maskingRules: ['email', 'phone', 'ssn']
            }
        };
    }
    getDefaultEnterprisePerformanceConfig() {
        return {
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
        };
    }
    getDefaultEnterpriseMemoryConfig() {
        return {
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
                conflictResolution: 'last-write-wins'
            },
            retention: {
                policies: {
                    session: { maxAge: 24 * 60 * 60 * 1000, maxSize: 50 * 1024 * 1024 },
                    user: { maxAge: 30 * 24 * 60 * 60 * 1000, maxSize: 200 * 1024 * 1024 },
                    organization: { maxAge: 90 * 24 * 60 * 60 * 1000, maxSize: 1024 * 1024 * 1024 }
                },
                compression: true
            }
        };
    }
    getDefaultEnterpriseFeaturesConfig() {
        return {
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
        };
    }
    getPhaseUpgradeStep(phase, stepNumber) {
        const phaseSteps = {
            2: {
                title: 'Upgrade to Phase 2',
                description: 'Add basic security and performance configurations',
                action: 'upgradeToPhase2',
                impact: 'Adds security settings and performance optimizations',
                required: false,
                estimatedTime: 3
            },
            3: {
                title: 'Upgrade to Phase 3',
                description: 'Add analytics and integration capabilities',
                action: 'upgradeToPhase3',
                impact: 'Enables analytics tracking and external integrations',
                required: false,
                estimatedTime: 4
            },
            4: {
                title: 'Upgrade to Phase 4',
                description: 'Add advanced features and development tools',
                action: 'upgradeToPhase4',
                impact: 'Adds advanced features like file upload, voice input, and development tools',
                required: false,
                estimatedTime: 5
            },
            5: {
                title: 'Upgrade to Phase 5',
                description: 'Enable enterprise features and advanced capabilities',
                action: 'upgradeToPhase5',
                impact: 'Adds enterprise-grade security, performance monitoring, and memory management',
                required: false,
                estimatedTime: 10
            }
        };
        const stepData = phaseSteps[phase];
        if (!stepData) {
            throw new Error(`Unknown phase: ${phase}`);
        }
        return Object.assign({ step: stepNumber }, stepData);
    }
    getMigrationBenefits(fromPhase, toPhase) {
        const benefits = [];
        if (fromPhase === 1) {
            benefits.push('Modern TypeScript configuration with better type safety');
            benefits.push('Advanced model configuration and system prompts');
            benefits.push('Extensible tool and integration system');
        }
        if (toPhase >= 2 && fromPhase < 2) {
            benefits.push('Enhanced security with encryption and audit logging');
            benefits.push('Performance optimizations and caching');
        }
        if (toPhase >= 3 && fromPhase < 3) {
            benefits.push('Analytics and user journey tracking');
            benefits.push('External service integrations');
        }
        if (toPhase >= 4 && fromPhase < 4) {
            benefits.push('Advanced features like file upload and voice input');
            benefits.push('Development tools and debugging capabilities');
        }
        if (toPhase >= 5 && fromPhase < 5) {
            benefits.push('Enterprise-grade security with threat detection');
            benefits.push('Real-time performance monitoring and optimization');
            benefits.push('Advanced memory management with encryption');
            benefits.push('Compliance framework support (GDPR, HIPAA, etc.)');
            benefits.push('Executive dashboard and reporting');
        }
        return benefits;
    }
}
// Singleton instance
export const migrationAssistant = new MigrationAssistant();
// Convenience functions
export const migrateToAI = (config) => migrationAssistant.migrateToAI(config);
export const migrateToLatest = (config) => migrationAssistant.migrateToLatest(config);
export const getMigrationPlan = (config, targetPhase) => migrationAssistant.getMigrationPlan(config, targetPhase);
export const previewMigration = (config) => migrationAssistant.previewMigration(config);
export const validateMigration = (config) => migrationAssistant.validateMigration(config);
