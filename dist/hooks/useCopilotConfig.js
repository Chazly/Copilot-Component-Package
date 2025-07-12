import { useState, useMemo, useCallback } from 'react';
import { isAICopilotConfig, isLegacyCopilotConfig } from '../types';
// Default values for AICopilotConfig
const DEFAULT_AI_CONFIG = {
    model: 'gpt-3.5-turbo',
    tools: [],
    contextSources: [],
    persona: {
        voiceStyle: 'helpful',
        tone: 'professional',
        emojiStyle: false,
        avatarUrl: ''
    },
    visibility: {
        rolesAllowed: [],
        isPublic: true
    },
    onboardingSteps: [],
    actions: [],
    fallbackMessage: 'I apologize, but I encountered an error. Please try again.',
    memoryScope: 'session',
    uiConfig: {
        theme: 'auto',
        showAvatar: true,
        floatingButton: false,
        layout: 'chatbox'
    },
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
    },
    metadata: {}
};
// Migration function from legacy config to new config
export function migrateConfig(legacyConfig) {
    const migrated = Object.assign({ name: legacyConfig.title, slug: legacyConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: legacyConfig.subtitle, firstMessage: legacyConfig.initialMessage, databasePath: `./data/${legacyConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-sessions`, embedLocation: 'main-chat-container', modelProvider: 'openai', systemPrompt: `You are ${legacyConfig.title}, ${legacyConfig.subtitle}. Be helpful and professional.`, uiConfig: {
            theme: 'auto',
            showAvatar: true,
            floatingButton: false,
            layout: 'chatbox'
        } }, DEFAULT_AI_CONFIG);
    return migrated;
}
// Validation function
function validateConfig(config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const errors = [];
    const warnings = [];
    if (isAICopilotConfig(config)) {
        // Validate required fields
        if (!((_a = config.name) === null || _a === void 0 ? void 0 : _a.trim()))
            errors.push('name is required');
        if (!((_b = config.slug) === null || _b === void 0 ? void 0 : _b.trim()))
            errors.push('slug is required');
        if (!((_c = config.firstMessage) === null || _c === void 0 ? void 0 : _c.trim()))
            errors.push('firstMessage is required');
        if (!((_d = config.databasePath) === null || _d === void 0 ? void 0 : _d.trim()))
            errors.push('databasePath is required');
        if (!((_e = config.embedLocation) === null || _e === void 0 ? void 0 : _e.trim()))
            errors.push('embedLocation is required');
        if (!((_f = config.modelProvider) === null || _f === void 0 ? void 0 : _f.trim()))
            errors.push('modelProvider is required');
        if (!((_g = config.systemPrompt) === null || _g === void 0 ? void 0 : _g.trim()))
            errors.push('systemPrompt is required');
        // Validate slug format
        if (config.slug && !/^[a-z0-9-]+$/.test(config.slug)) {
            errors.push('slug must contain only lowercase letters, numbers, and hyphens');
        }
        // Validate model provider
        const validProviders = ['openai', 'anthropic', 'mistral', 'local'];
        if (config.modelProvider && validProviders.indexOf(config.modelProvider) === -1 && config.modelProvider.indexOf('custom:') !== 0) {
            warnings.push(`Unrecognized model provider: ${config.modelProvider}`);
        }
        // Validate memory scope
        const validMemoryScopes = ['session', 'user', 'org', 'ephemeral'];
        if (config.memoryScope && validMemoryScopes.indexOf(config.memoryScope) === -1) {
            errors.push(`Invalid memoryScope: ${config.memoryScope}`);
        }
        // Validate UI layout
        const validLayouts = ['chatbox', 'sidebar', 'fullpage'];
        if (((_h = config.uiConfig) === null || _h === void 0 ? void 0 : _h.layout) && validLayouts.indexOf(config.uiConfig.layout) === -1) {
            errors.push(`Invalid layout: ${config.uiConfig.layout}`);
        }
        // Validate compliance settings
        const validCompliance = ['gdpr', 'hipaa', 'sox', 'none'];
        if (((_j = config.security) === null || _j === void 0 ? void 0 : _j.compliance) && validCompliance.indexOf(config.security.compliance) === -1) {
            errors.push(`Invalid compliance setting: ${config.security.compliance}`);
        }
        // Warnings for development mode
        if ((_k = config.development) === null || _k === void 0 ? void 0 : _k.debugMode) {
            warnings.push('Debug mode is enabled - remember to disable in production');
        }
        if ((_l = config.development) === null || _l === void 0 ? void 0 : _l.mockMode) {
            warnings.push('Mock mode is enabled - AI responses will be simulated');
        }
    }
    else if (isLegacyCopilotConfig(config)) {
        // Legacy config validation
        if (!((_m = config.title) === null || _m === void 0 ? void 0 : _m.trim()))
            errors.push('title is required');
        if (!((_o = config.subtitle) === null || _o === void 0 ? void 0 : _o.trim()))
            errors.push('subtitle is required');
        if (!((_p = config.initialMessage) === null || _p === void 0 ? void 0 : _p.trim()))
            errors.push('initialMessage is required');
        if (!config.color)
            errors.push('color is required');
        warnings.push('Using legacy CopilotConfig - consider migrating to AICopilotConfig for advanced features');
    }
    else {
        errors.push('Invalid configuration format');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
// Normalize config function
function normalizeConfig(config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37;
    if (isLegacyCopilotConfig(config)) {
        // Handle legacy config
        const migrated = migrateConfig(config);
        return Object.assign(Object.assign({}, migrated), { 
            // Apply defaults for any missing properties
            description: migrated.description || '', model: migrated.model || DEFAULT_AI_CONFIG.model, tools: migrated.tools || DEFAULT_AI_CONFIG.tools, contextSources: migrated.contextSources || DEFAULT_AI_CONFIG.contextSources, persona: {
                voiceStyle: ((_a = migrated.persona) === null || _a === void 0 ? void 0 : _a.voiceStyle) || DEFAULT_AI_CONFIG.persona.voiceStyle,
                tone: ((_b = migrated.persona) === null || _b === void 0 ? void 0 : _b.tone) || DEFAULT_AI_CONFIG.persona.tone,
                emojiStyle: ((_c = migrated.persona) === null || _c === void 0 ? void 0 : _c.emojiStyle) !== undefined ? migrated.persona.emojiStyle : DEFAULT_AI_CONFIG.persona.emojiStyle,
                avatarUrl: ((_d = migrated.persona) === null || _d === void 0 ? void 0 : _d.avatarUrl) || DEFAULT_AI_CONFIG.persona.avatarUrl || ''
            }, visibility: {
                rolesAllowed: ((_e = migrated.visibility) === null || _e === void 0 ? void 0 : _e.rolesAllowed) || DEFAULT_AI_CONFIG.visibility.rolesAllowed,
                isPublic: ((_f = migrated.visibility) === null || _f === void 0 ? void 0 : _f.isPublic) !== undefined ? migrated.visibility.isPublic : DEFAULT_AI_CONFIG.visibility.isPublic
            }, onboardingSteps: migrated.onboardingSteps || DEFAULT_AI_CONFIG.onboardingSteps, actions: migrated.actions || DEFAULT_AI_CONFIG.actions, fallbackMessage: migrated.fallbackMessage || DEFAULT_AI_CONFIG.fallbackMessage, memoryScope: migrated.memoryScope || DEFAULT_AI_CONFIG.memoryScope, uiConfig: {
                theme: ((_g = migrated.uiConfig) === null || _g === void 0 ? void 0 : _g.theme) || DEFAULT_AI_CONFIG.uiConfig.theme,
                showAvatar: ((_h = migrated.uiConfig) === null || _h === void 0 ? void 0 : _h.showAvatar) !== undefined ? migrated.uiConfig.showAvatar : DEFAULT_AI_CONFIG.uiConfig.showAvatar,
                floatingButton: ((_j = migrated.uiConfig) === null || _j === void 0 ? void 0 : _j.floatingButton) !== undefined ? migrated.uiConfig.floatingButton : DEFAULT_AI_CONFIG.uiConfig.floatingButton,
                layout: ((_k = migrated.uiConfig) === null || _k === void 0 ? void 0 : _k.layout) || DEFAULT_AI_CONFIG.uiConfig.layout
            }, security: {
                dataRetention: ((_l = migrated.security) === null || _l === void 0 ? void 0 : _l.dataRetention) || DEFAULT_AI_CONFIG.security.dataRetention,
                encryptAtRest: ((_m = migrated.security) === null || _m === void 0 ? void 0 : _m.encryptAtRest) !== undefined ? migrated.security.encryptAtRest : DEFAULT_AI_CONFIG.security.encryptAtRest,
                auditLogging: ((_o = migrated.security) === null || _o === void 0 ? void 0 : _o.auditLogging) !== undefined ? migrated.security.auditLogging : DEFAULT_AI_CONFIG.security.auditLogging,
                compliance: ((_p = migrated.security) === null || _p === void 0 ? void 0 : _p.compliance) || DEFAULT_AI_CONFIG.security.compliance
            }, performance: {
                rateLimiting: ((_q = migrated.performance) === null || _q === void 0 ? void 0 : _q.rateLimiting) || DEFAULT_AI_CONFIG.performance.rateLimiting,
                caching: ((_r = migrated.performance) === null || _r === void 0 ? void 0 : _r.caching) || DEFAULT_AI_CONFIG.performance.caching,
                streamingEnabled: ((_s = migrated.performance) === null || _s === void 0 ? void 0 : _s.streamingEnabled) !== undefined ? migrated.performance.streamingEnabled : DEFAULT_AI_CONFIG.performance.streamingEnabled
            }, analytics: {
                trackConversations: ((_t = migrated.analytics) === null || _t === void 0 ? void 0 : _t.trackConversations) !== undefined ? migrated.analytics.trackConversations : DEFAULT_AI_CONFIG.analytics.trackConversations,
                trackActions: ((_u = migrated.analytics) === null || _u === void 0 ? void 0 : _u.trackActions) !== undefined ? migrated.analytics.trackActions : DEFAULT_AI_CONFIG.analytics.trackActions,
                customEvents: ((_v = migrated.analytics) === null || _v === void 0 ? void 0 : _v.customEvents) || DEFAULT_AI_CONFIG.analytics.customEvents,
                provider: ((_w = migrated.analytics) === null || _w === void 0 ? void 0 : _w.provider) || DEFAULT_AI_CONFIG.analytics.provider
            }, integrations: {
                webhooks: ((_x = migrated.integrations) === null || _x === void 0 ? void 0 : _x.webhooks) || DEFAULT_AI_CONFIG.integrations.webhooks,
                contextProviders: ((_y = migrated.integrations) === null || _y === void 0 ? void 0 : _y.contextProviders) || DEFAULT_AI_CONFIG.integrations.contextProviders
            }, features: {
                messageReactions: ((_z = migrated.features) === null || _z === void 0 ? void 0 : _z.messageReactions) !== undefined ? migrated.features.messageReactions : DEFAULT_AI_CONFIG.features.messageReactions,
                conversationRating: ((_0 = migrated.features) === null || _0 === void 0 ? void 0 : _0.conversationRating) !== undefined ? migrated.features.conversationRating : DEFAULT_AI_CONFIG.features.conversationRating,
                fileUpload: ((_1 = migrated.features) === null || _1 === void 0 ? void 0 : _1.fileUpload) || DEFAULT_AI_CONFIG.features.fileUpload,
                voiceInput: ((_2 = migrated.features) === null || _2 === void 0 ? void 0 : _2.voiceInput) !== undefined ? migrated.features.voiceInput : DEFAULT_AI_CONFIG.features.voiceInput,
                conversationExport: ((_3 = migrated.features) === null || _3 === void 0 ? void 0 : _3.conversationExport) !== undefined ? migrated.features.conversationExport : DEFAULT_AI_CONFIG.features.conversationExport
            }, development: {
                mockMode: ((_4 = migrated.development) === null || _4 === void 0 ? void 0 : _4.mockMode) !== undefined ? migrated.development.mockMode : DEFAULT_AI_CONFIG.development.mockMode,
                debugMode: ((_5 = migrated.development) === null || _5 === void 0 ? void 0 : _5.debugMode) !== undefined ? migrated.development.debugMode : DEFAULT_AI_CONFIG.development.debugMode,
                testPersonas: ((_6 = migrated.development) === null || _6 === void 0 ? void 0 : _6.testPersonas) || DEFAULT_AI_CONFIG.development.testPersonas
            }, metadata: migrated.metadata || DEFAULT_AI_CONFIG.metadata, isLegacyConfig: true, legacyConfig: config });
    }
    else {
        // Handle AI config
        return Object.assign(Object.assign({}, config), { 
            // Apply defaults for any missing properties
            description: config.description || '', model: config.model || DEFAULT_AI_CONFIG.model, tools: config.tools || DEFAULT_AI_CONFIG.tools, contextSources: config.contextSources || DEFAULT_AI_CONFIG.contextSources, persona: {
                voiceStyle: ((_7 = config.persona) === null || _7 === void 0 ? void 0 : _7.voiceStyle) || DEFAULT_AI_CONFIG.persona.voiceStyle,
                tone: ((_8 = config.persona) === null || _8 === void 0 ? void 0 : _8.tone) || DEFAULT_AI_CONFIG.persona.tone,
                emojiStyle: ((_9 = config.persona) === null || _9 === void 0 ? void 0 : _9.emojiStyle) !== undefined ? config.persona.emojiStyle : DEFAULT_AI_CONFIG.persona.emojiStyle,
                avatarUrl: ((_10 = config.persona) === null || _10 === void 0 ? void 0 : _10.avatarUrl) || DEFAULT_AI_CONFIG.persona.avatarUrl || ''
            }, visibility: {
                rolesAllowed: ((_11 = config.visibility) === null || _11 === void 0 ? void 0 : _11.rolesAllowed) || DEFAULT_AI_CONFIG.visibility.rolesAllowed,
                isPublic: ((_12 = config.visibility) === null || _12 === void 0 ? void 0 : _12.isPublic) !== undefined ? config.visibility.isPublic : DEFAULT_AI_CONFIG.visibility.isPublic
            }, onboardingSteps: config.onboardingSteps || DEFAULT_AI_CONFIG.onboardingSteps, actions: config.actions || DEFAULT_AI_CONFIG.actions, fallbackMessage: config.fallbackMessage || DEFAULT_AI_CONFIG.fallbackMessage, memoryScope: config.memoryScope || DEFAULT_AI_CONFIG.memoryScope, uiConfig: {
                theme: ((_13 = config.uiConfig) === null || _13 === void 0 ? void 0 : _13.theme) || DEFAULT_AI_CONFIG.uiConfig.theme,
                showAvatar: ((_14 = config.uiConfig) === null || _14 === void 0 ? void 0 : _14.showAvatar) !== undefined ? config.uiConfig.showAvatar : DEFAULT_AI_CONFIG.uiConfig.showAvatar,
                floatingButton: ((_15 = config.uiConfig) === null || _15 === void 0 ? void 0 : _15.floatingButton) !== undefined ? config.uiConfig.floatingButton : DEFAULT_AI_CONFIG.uiConfig.floatingButton,
                layout: ((_16 = config.uiConfig) === null || _16 === void 0 ? void 0 : _16.layout) || DEFAULT_AI_CONFIG.uiConfig.layout
            }, security: {
                dataRetention: ((_17 = config.security) === null || _17 === void 0 ? void 0 : _17.dataRetention) || DEFAULT_AI_CONFIG.security.dataRetention,
                encryptAtRest: ((_18 = config.security) === null || _18 === void 0 ? void 0 : _18.encryptAtRest) !== undefined ? config.security.encryptAtRest : DEFAULT_AI_CONFIG.security.encryptAtRest,
                auditLogging: ((_19 = config.security) === null || _19 === void 0 ? void 0 : _19.auditLogging) !== undefined ? config.security.auditLogging : DEFAULT_AI_CONFIG.security.auditLogging,
                compliance: ((_20 = config.security) === null || _20 === void 0 ? void 0 : _20.compliance) || DEFAULT_AI_CONFIG.security.compliance
            }, performance: {
                rateLimiting: ((_21 = config.performance) === null || _21 === void 0 ? void 0 : _21.rateLimiting) || DEFAULT_AI_CONFIG.performance.rateLimiting,
                caching: ((_22 = config.performance) === null || _22 === void 0 ? void 0 : _22.caching) || DEFAULT_AI_CONFIG.performance.caching,
                streamingEnabled: ((_23 = config.performance) === null || _23 === void 0 ? void 0 : _23.streamingEnabled) !== undefined ? config.performance.streamingEnabled : DEFAULT_AI_CONFIG.performance.streamingEnabled
            }, analytics: {
                trackConversations: ((_24 = config.analytics) === null || _24 === void 0 ? void 0 : _24.trackConversations) !== undefined ? config.analytics.trackConversations : DEFAULT_AI_CONFIG.analytics.trackConversations,
                trackActions: ((_25 = config.analytics) === null || _25 === void 0 ? void 0 : _25.trackActions) !== undefined ? config.analytics.trackActions : DEFAULT_AI_CONFIG.analytics.trackActions,
                customEvents: ((_26 = config.analytics) === null || _26 === void 0 ? void 0 : _26.customEvents) || DEFAULT_AI_CONFIG.analytics.customEvents,
                provider: ((_27 = config.analytics) === null || _27 === void 0 ? void 0 : _27.provider) || DEFAULT_AI_CONFIG.analytics.provider
            }, integrations: {
                webhooks: ((_28 = config.integrations) === null || _28 === void 0 ? void 0 : _28.webhooks) || DEFAULT_AI_CONFIG.integrations.webhooks,
                contextProviders: ((_29 = config.integrations) === null || _29 === void 0 ? void 0 : _29.contextProviders) || DEFAULT_AI_CONFIG.integrations.contextProviders
            }, features: {
                messageReactions: ((_30 = config.features) === null || _30 === void 0 ? void 0 : _30.messageReactions) !== undefined ? config.features.messageReactions : DEFAULT_AI_CONFIG.features.messageReactions,
                conversationRating: ((_31 = config.features) === null || _31 === void 0 ? void 0 : _31.conversationRating) !== undefined ? config.features.conversationRating : DEFAULT_AI_CONFIG.features.conversationRating,
                fileUpload: ((_32 = config.features) === null || _32 === void 0 ? void 0 : _32.fileUpload) || DEFAULT_AI_CONFIG.features.fileUpload,
                voiceInput: ((_33 = config.features) === null || _33 === void 0 ? void 0 : _33.voiceInput) !== undefined ? config.features.voiceInput : DEFAULT_AI_CONFIG.features.voiceInput,
                conversationExport: ((_34 = config.features) === null || _34 === void 0 ? void 0 : _34.conversationExport) !== undefined ? config.features.conversationExport : DEFAULT_AI_CONFIG.features.conversationExport
            }, development: {
                mockMode: ((_35 = config.development) === null || _35 === void 0 ? void 0 : _35.mockMode) !== undefined ? config.development.mockMode : DEFAULT_AI_CONFIG.development.mockMode,
                debugMode: ((_36 = config.development) === null || _36 === void 0 ? void 0 : _36.debugMode) !== undefined ? config.development.debugMode : DEFAULT_AI_CONFIG.development.debugMode,
                testPersonas: ((_37 = config.development) === null || _37 === void 0 ? void 0 : _37.testPersonas) || DEFAULT_AI_CONFIG.development.testPersonas
            }, metadata: config.metadata || DEFAULT_AI_CONFIG.metadata, isLegacyConfig: false });
    }
}
export function useCopilotConfig(initialConfig) {
    const [config, setConfig] = useState(initialConfig);
    // Memoized normalized config
    const normalizedConfig = useMemo(() => normalizeConfig(config), [config]);
    // Memoized validation
    const validation = useMemo(() => validateConfig(config), [config]);
    // Log warnings and errors in development
    useMemo(() => {
        if (normalizedConfig.development.debugMode || process.env.NODE_ENV === 'development') {
            if (validation.warnings.length > 0) {
                console.warn('Copilot Config Warnings:', validation.warnings);
            }
            if (validation.errors.length > 0) {
                console.error('Copilot Config Errors:', validation.errors);
            }
        }
    }, [validation, normalizedConfig.development.debugMode]);
    // Update config function
    const updateConfig = useCallback((newConfig) => {
        setConfig(prevConfig => {
            if (isAICopilotConfig(prevConfig)) {
                return Object.assign(Object.assign({}, prevConfig), newConfig);
            }
            else {
                // If updating legacy config, migrate first
                const migrated = migrateConfig(prevConfig);
                return Object.assign(Object.assign({}, migrated), newConfig);
            }
        });
    }, []);
    // Reset config function
    const resetConfig = useCallback(() => {
        setConfig(initialConfig);
    }, [initialConfig]);
    // Check if config is ready (valid and no critical errors)
    const isReady = validation.isValid;
    return {
        config: normalizedConfig,
        validation,
        updateConfig,
        resetConfig,
        isReady,
        // Helper functions
        isLegacy: normalizedConfig.isLegacyConfig,
        migrateToAI: useCallback(() => {
            if (isLegacyCopilotConfig(config)) {
                setConfig(migrateConfig(config));
            }
        }, [config])
    };
}
export default useCopilotConfig;
