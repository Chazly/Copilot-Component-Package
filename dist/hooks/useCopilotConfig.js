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
        layout: 'chatbox',
        composer: {
            supportedElements: ['choices'],
            onChoiceSelectBehavior: 'sendKey',
            multiSelect: false,
            selectionLimit: undefined,
            submitLabel: 'Submit',
            sendOnSelect: true
        }
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
            layout: 'chatbox',
            composer: {
                supportedElements: ['choices'],
                onChoiceSelectBehavior: 'sendKey',
                multiSelect: false,
                selectionLimit: undefined,
                submitLabel: 'Submit',
                sendOnSelect: true
            }
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61;
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
                layout: ((_k = migrated.uiConfig) === null || _k === void 0 ? void 0 : _k.layout) || DEFAULT_AI_CONFIG.uiConfig.layout,
                composer: {
                    supportedElements: ((_m = (_l = migrated.uiConfig) === null || _l === void 0 ? void 0 : _l.composer) === null || _m === void 0 ? void 0 : _m.supportedElements) || DEFAULT_AI_CONFIG.uiConfig.composer.supportedElements,
                    onChoiceSelectBehavior: ((_p = (_o = migrated.uiConfig) === null || _o === void 0 ? void 0 : _o.composer) === null || _p === void 0 ? void 0 : _p.onChoiceSelectBehavior) || DEFAULT_AI_CONFIG.uiConfig.composer.onChoiceSelectBehavior,
                    multiSelect: ((_r = (_q = migrated.uiConfig) === null || _q === void 0 ? void 0 : _q.composer) === null || _r === void 0 ? void 0 : _r.multiSelect) !== undefined ? migrated.uiConfig.composer.multiSelect : DEFAULT_AI_CONFIG.uiConfig.composer.multiSelect,
                    selectionLimit: ((_t = (_s = migrated.uiConfig) === null || _s === void 0 ? void 0 : _s.composer) === null || _t === void 0 ? void 0 : _t.selectionLimit) !== undefined ? migrated.uiConfig.composer.selectionLimit : DEFAULT_AI_CONFIG.uiConfig.composer.selectionLimit,
                    submitLabel: ((_v = (_u = migrated.uiConfig) === null || _u === void 0 ? void 0 : _u.composer) === null || _v === void 0 ? void 0 : _v.submitLabel) || DEFAULT_AI_CONFIG.uiConfig.composer.submitLabel,
                    sendOnSelect: ((_x = (_w = migrated.uiConfig) === null || _w === void 0 ? void 0 : _w.composer) === null || _x === void 0 ? void 0 : _x.sendOnSelect) !== undefined ? migrated.uiConfig.composer.sendOnSelect : DEFAULT_AI_CONFIG.uiConfig.composer.sendOnSelect
                }
            }, security: {
                dataRetention: ((_y = migrated.security) === null || _y === void 0 ? void 0 : _y.dataRetention) || DEFAULT_AI_CONFIG.security.dataRetention,
                encryptAtRest: ((_z = migrated.security) === null || _z === void 0 ? void 0 : _z.encryptAtRest) !== undefined ? migrated.security.encryptAtRest : DEFAULT_AI_CONFIG.security.encryptAtRest,
                auditLogging: ((_0 = migrated.security) === null || _0 === void 0 ? void 0 : _0.auditLogging) !== undefined ? migrated.security.auditLogging : DEFAULT_AI_CONFIG.security.auditLogging,
                compliance: ((_1 = migrated.security) === null || _1 === void 0 ? void 0 : _1.compliance) || DEFAULT_AI_CONFIG.security.compliance
            }, performance: {
                rateLimiting: ((_2 = migrated.performance) === null || _2 === void 0 ? void 0 : _2.rateLimiting) || DEFAULT_AI_CONFIG.performance.rateLimiting,
                caching: ((_3 = migrated.performance) === null || _3 === void 0 ? void 0 : _3.caching) || DEFAULT_AI_CONFIG.performance.caching,
                streamingEnabled: ((_4 = migrated.performance) === null || _4 === void 0 ? void 0 : _4.streamingEnabled) !== undefined ? migrated.performance.streamingEnabled : DEFAULT_AI_CONFIG.performance.streamingEnabled
            }, analytics: {
                trackConversations: ((_5 = migrated.analytics) === null || _5 === void 0 ? void 0 : _5.trackConversations) !== undefined ? migrated.analytics.trackConversations : DEFAULT_AI_CONFIG.analytics.trackConversations,
                trackActions: ((_6 = migrated.analytics) === null || _6 === void 0 ? void 0 : _6.trackActions) !== undefined ? migrated.analytics.trackActions : DEFAULT_AI_CONFIG.analytics.trackActions,
                customEvents: ((_7 = migrated.analytics) === null || _7 === void 0 ? void 0 : _7.customEvents) || DEFAULT_AI_CONFIG.analytics.customEvents,
                provider: ((_8 = migrated.analytics) === null || _8 === void 0 ? void 0 : _8.provider) || DEFAULT_AI_CONFIG.analytics.provider
            }, integrations: {
                webhooks: ((_9 = migrated.integrations) === null || _9 === void 0 ? void 0 : _9.webhooks) || DEFAULT_AI_CONFIG.integrations.webhooks,
                contextProviders: ((_10 = migrated.integrations) === null || _10 === void 0 ? void 0 : _10.contextProviders) || DEFAULT_AI_CONFIG.integrations.contextProviders
            }, features: {
                messageReactions: ((_11 = migrated.features) === null || _11 === void 0 ? void 0 : _11.messageReactions) !== undefined ? migrated.features.messageReactions : DEFAULT_AI_CONFIG.features.messageReactions,
                conversationRating: ((_12 = migrated.features) === null || _12 === void 0 ? void 0 : _12.conversationRating) !== undefined ? migrated.features.conversationRating : DEFAULT_AI_CONFIG.features.conversationRating,
                fileUpload: ((_13 = migrated.features) === null || _13 === void 0 ? void 0 : _13.fileUpload) || DEFAULT_AI_CONFIG.features.fileUpload,
                voiceInput: ((_14 = migrated.features) === null || _14 === void 0 ? void 0 : _14.voiceInput) !== undefined ? migrated.features.voiceInput : DEFAULT_AI_CONFIG.features.voiceInput,
                conversationExport: ((_15 = migrated.features) === null || _15 === void 0 ? void 0 : _15.conversationExport) !== undefined ? migrated.features.conversationExport : DEFAULT_AI_CONFIG.features.conversationExport
            }, development: {
                mockMode: ((_16 = migrated.development) === null || _16 === void 0 ? void 0 : _16.mockMode) !== undefined ? migrated.development.mockMode : DEFAULT_AI_CONFIG.development.mockMode,
                debugMode: ((_17 = migrated.development) === null || _17 === void 0 ? void 0 : _17.debugMode) !== undefined ? migrated.development.debugMode : DEFAULT_AI_CONFIG.development.debugMode,
                testPersonas: ((_18 = migrated.development) === null || _18 === void 0 ? void 0 : _18.testPersonas) || DEFAULT_AI_CONFIG.development.testPersonas
            }, metadata: migrated.metadata || DEFAULT_AI_CONFIG.metadata, isLegacyConfig: true, legacyConfig: config });
    }
    else {
        // Handle AI config
        return Object.assign(Object.assign({}, config), { 
            // Apply defaults for any missing properties
            description: config.description || '', model: config.model || DEFAULT_AI_CONFIG.model, tools: config.tools || DEFAULT_AI_CONFIG.tools, contextSources: config.contextSources || DEFAULT_AI_CONFIG.contextSources, persona: {
                voiceStyle: ((_19 = config.persona) === null || _19 === void 0 ? void 0 : _19.voiceStyle) || DEFAULT_AI_CONFIG.persona.voiceStyle,
                tone: ((_20 = config.persona) === null || _20 === void 0 ? void 0 : _20.tone) || DEFAULT_AI_CONFIG.persona.tone,
                emojiStyle: ((_21 = config.persona) === null || _21 === void 0 ? void 0 : _21.emojiStyle) !== undefined ? config.persona.emojiStyle : DEFAULT_AI_CONFIG.persona.emojiStyle,
                avatarUrl: ((_22 = config.persona) === null || _22 === void 0 ? void 0 : _22.avatarUrl) || DEFAULT_AI_CONFIG.persona.avatarUrl || ''
            }, visibility: {
                rolesAllowed: ((_23 = config.visibility) === null || _23 === void 0 ? void 0 : _23.rolesAllowed) || DEFAULT_AI_CONFIG.visibility.rolesAllowed,
                isPublic: ((_24 = config.visibility) === null || _24 === void 0 ? void 0 : _24.isPublic) !== undefined ? config.visibility.isPublic : DEFAULT_AI_CONFIG.visibility.isPublic
            }, onboardingSteps: config.onboardingSteps || DEFAULT_AI_CONFIG.onboardingSteps, actions: config.actions || DEFAULT_AI_CONFIG.actions, fallbackMessage: config.fallbackMessage || DEFAULT_AI_CONFIG.fallbackMessage, memoryScope: config.memoryScope || DEFAULT_AI_CONFIG.memoryScope, uiConfig: {
                theme: ((_25 = config.uiConfig) === null || _25 === void 0 ? void 0 : _25.theme) || DEFAULT_AI_CONFIG.uiConfig.theme,
                showAvatar: ((_26 = config.uiConfig) === null || _26 === void 0 ? void 0 : _26.showAvatar) !== undefined ? config.uiConfig.showAvatar : DEFAULT_AI_CONFIG.uiConfig.showAvatar,
                floatingButton: ((_27 = config.uiConfig) === null || _27 === void 0 ? void 0 : _27.floatingButton) !== undefined ? config.uiConfig.floatingButton : DEFAULT_AI_CONFIG.uiConfig.floatingButton,
                layout: ((_28 = config.uiConfig) === null || _28 === void 0 ? void 0 : _28.layout) || DEFAULT_AI_CONFIG.uiConfig.layout,
                composer: {
                    supportedElements: ((_30 = (_29 = config.uiConfig) === null || _29 === void 0 ? void 0 : _29.composer) === null || _30 === void 0 ? void 0 : _30.supportedElements) || DEFAULT_AI_CONFIG.uiConfig.composer.supportedElements,
                    onChoiceSelectBehavior: ((_32 = (_31 = config.uiConfig) === null || _31 === void 0 ? void 0 : _31.composer) === null || _32 === void 0 ? void 0 : _32.onChoiceSelectBehavior) || DEFAULT_AI_CONFIG.uiConfig.composer.onChoiceSelectBehavior,
                    multiSelect: ((_34 = (_33 = config.uiConfig) === null || _33 === void 0 ? void 0 : _33.composer) === null || _34 === void 0 ? void 0 : _34.multiSelect) !== undefined ? config.uiConfig.composer.multiSelect : DEFAULT_AI_CONFIG.uiConfig.composer.multiSelect,
                    selectionLimit: ((_36 = (_35 = config.uiConfig) === null || _35 === void 0 ? void 0 : _35.composer) === null || _36 === void 0 ? void 0 : _36.selectionLimit) !== undefined ? config.uiConfig.composer.selectionLimit : DEFAULT_AI_CONFIG.uiConfig.composer.selectionLimit,
                    submitLabel: ((_38 = (_37 = config.uiConfig) === null || _37 === void 0 ? void 0 : _37.composer) === null || _38 === void 0 ? void 0 : _38.submitLabel) || DEFAULT_AI_CONFIG.uiConfig.composer.submitLabel,
                    sendOnSelect: ((_40 = (_39 = config.uiConfig) === null || _39 === void 0 ? void 0 : _39.composer) === null || _40 === void 0 ? void 0 : _40.sendOnSelect) !== undefined ? config.uiConfig.composer.sendOnSelect : DEFAULT_AI_CONFIG.uiConfig.composer.sendOnSelect
                }
            }, security: {
                dataRetention: ((_41 = config.security) === null || _41 === void 0 ? void 0 : _41.dataRetention) || DEFAULT_AI_CONFIG.security.dataRetention,
                encryptAtRest: ((_42 = config.security) === null || _42 === void 0 ? void 0 : _42.encryptAtRest) !== undefined ? config.security.encryptAtRest : DEFAULT_AI_CONFIG.security.encryptAtRest,
                auditLogging: ((_43 = config.security) === null || _43 === void 0 ? void 0 : _43.auditLogging) !== undefined ? config.security.auditLogging : DEFAULT_AI_CONFIG.security.auditLogging,
                compliance: ((_44 = config.security) === null || _44 === void 0 ? void 0 : _44.compliance) || DEFAULT_AI_CONFIG.security.compliance
            }, performance: {
                rateLimiting: ((_45 = config.performance) === null || _45 === void 0 ? void 0 : _45.rateLimiting) || DEFAULT_AI_CONFIG.performance.rateLimiting,
                caching: ((_46 = config.performance) === null || _46 === void 0 ? void 0 : _46.caching) || DEFAULT_AI_CONFIG.performance.caching,
                streamingEnabled: ((_47 = config.performance) === null || _47 === void 0 ? void 0 : _47.streamingEnabled) !== undefined ? config.performance.streamingEnabled : DEFAULT_AI_CONFIG.performance.streamingEnabled
            }, analytics: {
                trackConversations: ((_48 = config.analytics) === null || _48 === void 0 ? void 0 : _48.trackConversations) !== undefined ? config.analytics.trackConversations : DEFAULT_AI_CONFIG.analytics.trackConversations,
                trackActions: ((_49 = config.analytics) === null || _49 === void 0 ? void 0 : _49.trackActions) !== undefined ? config.analytics.trackActions : DEFAULT_AI_CONFIG.analytics.trackActions,
                customEvents: ((_50 = config.analytics) === null || _50 === void 0 ? void 0 : _50.customEvents) || DEFAULT_AI_CONFIG.analytics.customEvents,
                provider: ((_51 = config.analytics) === null || _51 === void 0 ? void 0 : _51.provider) || DEFAULT_AI_CONFIG.analytics.provider
            }, integrations: {
                webhooks: ((_52 = config.integrations) === null || _52 === void 0 ? void 0 : _52.webhooks) || DEFAULT_AI_CONFIG.integrations.webhooks,
                contextProviders: ((_53 = config.integrations) === null || _53 === void 0 ? void 0 : _53.contextProviders) || DEFAULT_AI_CONFIG.integrations.contextProviders
            }, features: {
                messageReactions: ((_54 = config.features) === null || _54 === void 0 ? void 0 : _54.messageReactions) !== undefined ? config.features.messageReactions : DEFAULT_AI_CONFIG.features.messageReactions,
                conversationRating: ((_55 = config.features) === null || _55 === void 0 ? void 0 : _55.conversationRating) !== undefined ? config.features.conversationRating : DEFAULT_AI_CONFIG.features.conversationRating,
                fileUpload: ((_56 = config.features) === null || _56 === void 0 ? void 0 : _56.fileUpload) || DEFAULT_AI_CONFIG.features.fileUpload,
                voiceInput: ((_57 = config.features) === null || _57 === void 0 ? void 0 : _57.voiceInput) !== undefined ? config.features.voiceInput : DEFAULT_AI_CONFIG.features.voiceInput,
                conversationExport: ((_58 = config.features) === null || _58 === void 0 ? void 0 : _58.conversationExport) !== undefined ? config.features.conversationExport : DEFAULT_AI_CONFIG.features.conversationExport
            }, development: {
                mockMode: ((_59 = config.development) === null || _59 === void 0 ? void 0 : _59.mockMode) !== undefined ? config.development.mockMode : DEFAULT_AI_CONFIG.development.mockMode,
                debugMode: ((_60 = config.development) === null || _60 === void 0 ? void 0 : _60.debugMode) !== undefined ? config.development.debugMode : DEFAULT_AI_CONFIG.development.debugMode,
                testPersonas: ((_61 = config.development) === null || _61 === void 0 ? void 0 : _61.testPersonas) || DEFAULT_AI_CONFIG.development.testPersonas
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
