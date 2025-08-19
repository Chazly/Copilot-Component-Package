import { useState, useMemo, useCallback } from 'react'
import { 
  CopilotConfigType, 
  AICopilotConfig, 
  CopilotConfig,
  NormalizedCopilotConfig, 
  ConfigValidationResult,
  isAICopilotConfig,
  isLegacyCopilotConfig 
} from '../types'

// Default values for AICopilotConfig
const DEFAULT_AI_CONFIG: Partial<AICopilotConfig> = {
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
}

// Migration function from legacy config to new config
export function migrateConfig(legacyConfig: CopilotConfig): AICopilotConfig {
  const migrated: AICopilotConfig = {
    name: legacyConfig.title,
    slug: legacyConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: legacyConfig.subtitle,
    firstMessage: legacyConfig.initialMessage,
    databasePath: `./data/${legacyConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-sessions`,
    embedLocation: 'main-chat-container',
    modelProvider: 'openai',
    systemPrompt: `You are ${legacyConfig.title}, ${legacyConfig.subtitle}. Be helpful and professional.`,
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
    ...DEFAULT_AI_CONFIG
  }
  
  return migrated
}

// Validation function
function validateConfig(config: CopilotConfigType): ConfigValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (isAICopilotConfig(config)) {
    // Validate required fields
    if (!config.name?.trim()) errors.push('name is required')
    if (!config.slug?.trim()) errors.push('slug is required')
    if (!config.firstMessage?.trim()) errors.push('firstMessage is required')
    if (!config.databasePath?.trim()) errors.push('databasePath is required')
    if (!config.embedLocation?.trim()) errors.push('embedLocation is required')
    if (!config.modelProvider?.trim()) errors.push('modelProvider is required')
    if (!config.systemPrompt?.trim()) errors.push('systemPrompt is required')

    // Validate slug format
    if (config.slug && !/^[a-z0-9-]+$/.test(config.slug)) {
      errors.push('slug must contain only lowercase letters, numbers, and hyphens')
    }

    // Validate model provider
    const validProviders = ['openai', 'anthropic', 'mistral', 'local']
    if (config.modelProvider && validProviders.indexOf(config.modelProvider) === -1 && config.modelProvider.indexOf('custom:') !== 0) {
      warnings.push(`Unrecognized model provider: ${config.modelProvider}`)
    }

    // Validate memory scope
    const validMemoryScopes = ['session', 'user', 'org', 'ephemeral']
    if (config.memoryScope && validMemoryScopes.indexOf(config.memoryScope) === -1) {
      errors.push(`Invalid memoryScope: ${config.memoryScope}`)
    }

    // Validate UI layout
    const validLayouts = ['chatbox', 'sidebar', 'fullpage']
    if (config.uiConfig?.layout && validLayouts.indexOf(config.uiConfig.layout) === -1) {
      errors.push(`Invalid layout: ${config.uiConfig.layout}`)
    }

    // Validate compliance settings
    const validCompliance = ['gdpr', 'hipaa', 'sox', 'none']
    if (config.security?.compliance && validCompliance.indexOf(config.security.compliance) === -1) {
      errors.push(`Invalid compliance setting: ${config.security.compliance}`)
    }

    // Warnings for development mode
    if (config.development?.debugMode) {
      warnings.push('Debug mode is enabled - remember to disable in production')
    }
    if (config.development?.mockMode) {
      warnings.push('Mock mode is enabled - AI responses will be simulated')
    }

  } else if (isLegacyCopilotConfig(config)) {
    // Legacy config validation
    if (!config.title?.trim()) errors.push('title is required')
    if (!config.subtitle?.trim()) errors.push('subtitle is required') 
    if (!config.initialMessage?.trim()) errors.push('initialMessage is required')
    if (!config.color) errors.push('color is required')

    warnings.push('Using legacy CopilotConfig - consider migrating to AICopilotConfig for advanced features')
  } else {
    errors.push('Invalid configuration format')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Normalize config function
function normalizeConfig(config: CopilotConfigType): NormalizedCopilotConfig {
  if (isLegacyCopilotConfig(config)) {
    // Handle legacy config
    const migrated = migrateConfig(config)
    return {
      ...migrated,
      // Apply defaults for any missing properties
      description: migrated.description || '',
      model: migrated.model || DEFAULT_AI_CONFIG.model!,
      tools: migrated.tools || DEFAULT_AI_CONFIG.tools!,
      contextSources: migrated.contextSources || DEFAULT_AI_CONFIG.contextSources!,
      persona: {
        voiceStyle: migrated.persona?.voiceStyle || DEFAULT_AI_CONFIG.persona!.voiceStyle!,
        tone: migrated.persona?.tone || DEFAULT_AI_CONFIG.persona!.tone!,
        emojiStyle: migrated.persona?.emojiStyle !== undefined ? migrated.persona.emojiStyle : DEFAULT_AI_CONFIG.persona!.emojiStyle!,
        avatarUrl: migrated.persona?.avatarUrl || DEFAULT_AI_CONFIG.persona!.avatarUrl || ''
      },
      visibility: {
        rolesAllowed: migrated.visibility?.rolesAllowed || DEFAULT_AI_CONFIG.visibility!.rolesAllowed!,
        isPublic: migrated.visibility?.isPublic !== undefined ? migrated.visibility.isPublic : DEFAULT_AI_CONFIG.visibility!.isPublic!
      },
      onboardingSteps: migrated.onboardingSteps || DEFAULT_AI_CONFIG.onboardingSteps!,
      actions: migrated.actions || DEFAULT_AI_CONFIG.actions!,
      fallbackMessage: migrated.fallbackMessage || DEFAULT_AI_CONFIG.fallbackMessage!,
      memoryScope: migrated.memoryScope || DEFAULT_AI_CONFIG.memoryScope!,
      uiConfig: {
        theme: migrated.uiConfig?.theme || DEFAULT_AI_CONFIG.uiConfig!.theme!,
        showAvatar: migrated.uiConfig?.showAvatar !== undefined ? migrated.uiConfig.showAvatar : DEFAULT_AI_CONFIG.uiConfig!.showAvatar!,
        floatingButton: migrated.uiConfig?.floatingButton !== undefined ? migrated.uiConfig.floatingButton : DEFAULT_AI_CONFIG.uiConfig!.floatingButton!,
        layout: migrated.uiConfig?.layout || DEFAULT_AI_CONFIG.uiConfig!.layout!,
        composer: {
          supportedElements: migrated.uiConfig?.composer?.supportedElements || DEFAULT_AI_CONFIG.uiConfig!.composer!.supportedElements!,
          onChoiceSelectBehavior: migrated.uiConfig?.composer?.onChoiceSelectBehavior || DEFAULT_AI_CONFIG.uiConfig!.composer!.onChoiceSelectBehavior!,
          multiSelect: migrated.uiConfig?.composer?.multiSelect !== undefined ? migrated.uiConfig.composer.multiSelect : DEFAULT_AI_CONFIG.uiConfig!.composer!.multiSelect!,
          selectionLimit: migrated.uiConfig?.composer?.selectionLimit !== undefined ? migrated.uiConfig.composer.selectionLimit : DEFAULT_AI_CONFIG.uiConfig!.composer!.selectionLimit!,
          submitLabel: migrated.uiConfig?.composer?.submitLabel || DEFAULT_AI_CONFIG.uiConfig!.composer!.submitLabel!,
          sendOnSelect: migrated.uiConfig?.composer?.sendOnSelect !== undefined ? migrated.uiConfig.composer.sendOnSelect : DEFAULT_AI_CONFIG.uiConfig!.composer!.sendOnSelect!
        }
      },
      security: {
        dataRetention: migrated.security?.dataRetention || DEFAULT_AI_CONFIG.security!.dataRetention!,
        encryptAtRest: migrated.security?.encryptAtRest !== undefined ? migrated.security.encryptAtRest : DEFAULT_AI_CONFIG.security!.encryptAtRest!,
        auditLogging: migrated.security?.auditLogging !== undefined ? migrated.security.auditLogging : DEFAULT_AI_CONFIG.security!.auditLogging!,
        compliance: migrated.security?.compliance || DEFAULT_AI_CONFIG.security!.compliance!
      },
      performance: {
        rateLimiting: migrated.performance?.rateLimiting || DEFAULT_AI_CONFIG.performance!.rateLimiting!,
        caching: migrated.performance?.caching || DEFAULT_AI_CONFIG.performance!.caching!,
        streamingEnabled: migrated.performance?.streamingEnabled !== undefined ? migrated.performance.streamingEnabled : DEFAULT_AI_CONFIG.performance!.streamingEnabled!
      },
      analytics: {
        trackConversations: migrated.analytics?.trackConversations !== undefined ? migrated.analytics.trackConversations : DEFAULT_AI_CONFIG.analytics!.trackConversations!,
        trackActions: migrated.analytics?.trackActions !== undefined ? migrated.analytics.trackActions : DEFAULT_AI_CONFIG.analytics!.trackActions!,
        customEvents: migrated.analytics?.customEvents || DEFAULT_AI_CONFIG.analytics!.customEvents!,
        provider: migrated.analytics?.provider || DEFAULT_AI_CONFIG.analytics!.provider!
      },
      integrations: {
        webhooks: migrated.integrations?.webhooks || DEFAULT_AI_CONFIG.integrations!.webhooks!,
        contextProviders: migrated.integrations?.contextProviders || DEFAULT_AI_CONFIG.integrations!.contextProviders!
      },
      features: {
        messageReactions: migrated.features?.messageReactions !== undefined ? migrated.features.messageReactions : DEFAULT_AI_CONFIG.features!.messageReactions!,
        conversationRating: migrated.features?.conversationRating !== undefined ? migrated.features.conversationRating : DEFAULT_AI_CONFIG.features!.conversationRating!,
        fileUpload: migrated.features?.fileUpload || DEFAULT_AI_CONFIG.features!.fileUpload!,
        voiceInput: migrated.features?.voiceInput !== undefined ? migrated.features.voiceInput : DEFAULT_AI_CONFIG.features!.voiceInput!,
        conversationExport: migrated.features?.conversationExport !== undefined ? migrated.features.conversationExport : DEFAULT_AI_CONFIG.features!.conversationExport!
      },
      development: {
        mockMode: migrated.development?.mockMode !== undefined ? migrated.development.mockMode : DEFAULT_AI_CONFIG.development!.mockMode!,
        debugMode: migrated.development?.debugMode !== undefined ? migrated.development.debugMode : DEFAULT_AI_CONFIG.development!.debugMode!,
        testPersonas: migrated.development?.testPersonas || DEFAULT_AI_CONFIG.development!.testPersonas!
      },
      metadata: migrated.metadata || DEFAULT_AI_CONFIG.metadata!,
      isLegacyConfig: true,
      legacyConfig: config
    }
  } else {
    // Handle AI config
    return {
      ...config,
      // Apply defaults for any missing properties
      description: config.description || '',
      model: config.model || DEFAULT_AI_CONFIG.model!,
      tools: config.tools || DEFAULT_AI_CONFIG.tools!,
      contextSources: config.contextSources || DEFAULT_AI_CONFIG.contextSources!,
      persona: {
        voiceStyle: config.persona?.voiceStyle || DEFAULT_AI_CONFIG.persona!.voiceStyle!,
        tone: config.persona?.tone || DEFAULT_AI_CONFIG.persona!.tone!,
        emojiStyle: config.persona?.emojiStyle !== undefined ? config.persona.emojiStyle : DEFAULT_AI_CONFIG.persona!.emojiStyle!,
        avatarUrl: config.persona?.avatarUrl || DEFAULT_AI_CONFIG.persona!.avatarUrl || ''
      },
      visibility: {
        rolesAllowed: config.visibility?.rolesAllowed || DEFAULT_AI_CONFIG.visibility!.rolesAllowed!,
        isPublic: config.visibility?.isPublic !== undefined ? config.visibility.isPublic : DEFAULT_AI_CONFIG.visibility!.isPublic!
      },
      onboardingSteps: config.onboardingSteps || DEFAULT_AI_CONFIG.onboardingSteps!,
      actions: config.actions || DEFAULT_AI_CONFIG.actions!,
      fallbackMessage: config.fallbackMessage || DEFAULT_AI_CONFIG.fallbackMessage!,
      memoryScope: config.memoryScope || DEFAULT_AI_CONFIG.memoryScope!,
      uiConfig: {
        theme: config.uiConfig?.theme || DEFAULT_AI_CONFIG.uiConfig!.theme!,
        showAvatar: config.uiConfig?.showAvatar !== undefined ? config.uiConfig.showAvatar : DEFAULT_AI_CONFIG.uiConfig!.showAvatar!,
        floatingButton: config.uiConfig?.floatingButton !== undefined ? config.uiConfig.floatingButton : DEFAULT_AI_CONFIG.uiConfig!.floatingButton!,
        layout: config.uiConfig?.layout || DEFAULT_AI_CONFIG.uiConfig!.layout!,
        composer: {
          supportedElements: config.uiConfig?.composer?.supportedElements || DEFAULT_AI_CONFIG.uiConfig!.composer!.supportedElements!,
          onChoiceSelectBehavior: config.uiConfig?.composer?.onChoiceSelectBehavior || DEFAULT_AI_CONFIG.uiConfig!.composer!.onChoiceSelectBehavior!,
          multiSelect: config.uiConfig?.composer?.multiSelect !== undefined ? config.uiConfig.composer.multiSelect : DEFAULT_AI_CONFIG.uiConfig!.composer!.multiSelect!,
          selectionLimit: config.uiConfig?.composer?.selectionLimit !== undefined ? config.uiConfig.composer.selectionLimit : DEFAULT_AI_CONFIG.uiConfig!.composer!.selectionLimit!,
          submitLabel: config.uiConfig?.composer?.submitLabel || DEFAULT_AI_CONFIG.uiConfig!.composer!.submitLabel!,
          sendOnSelect: config.uiConfig?.composer?.sendOnSelect !== undefined ? config.uiConfig.composer.sendOnSelect : DEFAULT_AI_CONFIG.uiConfig!.composer!.sendOnSelect!
        }
      },
      security: {
        dataRetention: config.security?.dataRetention || DEFAULT_AI_CONFIG.security!.dataRetention!,
        encryptAtRest: config.security?.encryptAtRest !== undefined ? config.security.encryptAtRest : DEFAULT_AI_CONFIG.security!.encryptAtRest!,
        auditLogging: config.security?.auditLogging !== undefined ? config.security.auditLogging : DEFAULT_AI_CONFIG.security!.auditLogging!,
        compliance: config.security?.compliance || DEFAULT_AI_CONFIG.security!.compliance!
      },
      performance: {
        rateLimiting: config.performance?.rateLimiting || DEFAULT_AI_CONFIG.performance!.rateLimiting!,
        caching: config.performance?.caching || DEFAULT_AI_CONFIG.performance!.caching!,
        streamingEnabled: config.performance?.streamingEnabled !== undefined ? config.performance.streamingEnabled : DEFAULT_AI_CONFIG.performance!.streamingEnabled!
      },
      analytics: {
        trackConversations: config.analytics?.trackConversations !== undefined ? config.analytics.trackConversations : DEFAULT_AI_CONFIG.analytics!.trackConversations!,
        trackActions: config.analytics?.trackActions !== undefined ? config.analytics.trackActions : DEFAULT_AI_CONFIG.analytics!.trackActions!,
        customEvents: config.analytics?.customEvents || DEFAULT_AI_CONFIG.analytics!.customEvents!,
        provider: config.analytics?.provider || DEFAULT_AI_CONFIG.analytics!.provider!
      },
      integrations: {
        webhooks: config.integrations?.webhooks || DEFAULT_AI_CONFIG.integrations!.webhooks!,
        contextProviders: config.integrations?.contextProviders || DEFAULT_AI_CONFIG.integrations!.contextProviders!
      },
      features: {
        messageReactions: config.features?.messageReactions !== undefined ? config.features.messageReactions : DEFAULT_AI_CONFIG.features!.messageReactions!,
        conversationRating: config.features?.conversationRating !== undefined ? config.features.conversationRating : DEFAULT_AI_CONFIG.features!.conversationRating!,
        fileUpload: config.features?.fileUpload || DEFAULT_AI_CONFIG.features!.fileUpload!,
        voiceInput: config.features?.voiceInput !== undefined ? config.features.voiceInput : DEFAULT_AI_CONFIG.features!.voiceInput!,
        conversationExport: config.features?.conversationExport !== undefined ? config.features.conversationExport : DEFAULT_AI_CONFIG.features!.conversationExport!
      },
      development: {
        mockMode: config.development?.mockMode !== undefined ? config.development.mockMode : DEFAULT_AI_CONFIG.development!.mockMode!,
        debugMode: config.development?.debugMode !== undefined ? config.development.debugMode : DEFAULT_AI_CONFIG.development!.debugMode!,
        testPersonas: config.development?.testPersonas || DEFAULT_AI_CONFIG.development!.testPersonas!
      },
      metadata: config.metadata || DEFAULT_AI_CONFIG.metadata!,
      isLegacyConfig: false
    }
  }
}

export function useCopilotConfig(initialConfig: CopilotConfigType) {
  const [config, setConfig] = useState<CopilotConfigType>(initialConfig)

  // Memoized normalized config
  const normalizedConfig = useMemo(() => normalizeConfig(config), [config])
  
  // Memoized validation
  const validation = useMemo(() => validateConfig(config), [config])

  // Log warnings and errors in development
  useMemo(() => {
    if (normalizedConfig.development.debugMode || process.env.NODE_ENV === 'development') {
      if (validation.warnings.length > 0) {
        console.warn('Copilot Config Warnings:', validation.warnings)
      }
      if (validation.errors.length > 0) {
        console.error('Copilot Config Errors:', validation.errors)
      }
    }
  }, [validation, normalizedConfig.development.debugMode])

  // Update config function
  const updateConfig = useCallback((newConfig: Partial<AICopilotConfig>) => {
    setConfig(prevConfig => {
      if (isAICopilotConfig(prevConfig)) {
        return { ...prevConfig, ...newConfig }
      } else {
        // If updating legacy config, migrate first
        const migrated = migrateConfig(prevConfig)
        return { ...migrated, ...newConfig }
      }
    })
  }, [])

  // Reset config function
  const resetConfig = useCallback(() => {
    setConfig(initialConfig)
  }, [initialConfig])

  // Check if config is ready (valid and no critical errors)
  const isReady = validation.isValid

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
        setConfig(migrateConfig(config))
      }
    }, [config])
  }
}

export default useCopilotConfig 