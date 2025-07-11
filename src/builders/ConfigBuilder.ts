import { 
  AICopilotConfig, 
  CopilotConfig,
  isAICopilotConfig,
  isLegacyCopilotConfig 
} from '../types'
import { 
  ValidAICopilotConfig,
  ConfigPreset,
  BuilderState,
  ConfigValidationError,
  StrictValidationResult,
  ValidationErrors
} from '../types/utils'
import { validateEnvironment, detectFramework, getApiKey, getDefaultModel } from '../lib/env'
import { validateConfig } from '../validation/ConfigValidator'

export class CopilotConfigBuilder {
  private state: BuilderState = {
    config: {},
    validationErrors: {},
    appliedPresets: [],
    buildAttempts: 0
  }

  constructor(initialConfig?: Partial<AICopilotConfig>) {
    if (initialConfig) {
      this.state.config = { ...initialConfig }
    }
  }

  // Core configuration methods
  basic(name: string, slug: string, firstMessage: string): this {
    this.state.config.name = name
    this.state.config.slug = this.sanitizeSlug(slug)
    this.state.config.firstMessage = firstMessage
    return this
  }

  // Model configuration
  model(provider: string, model?: string): this {
    this.state.config.modelProvider = provider
    if (model) {
      this.state.config.model = model
    }
    return this
  }

  // System prompt configuration
  systemPrompt(prompt: string): this {
    this.state.config.systemPrompt = prompt
    return this
  }

  // Storage configuration  
  storage(databasePath: string, embedLocation: string): this {
    this.state.config.databasePath = databasePath
    this.state.config.embedLocation = embedLocation
    return this
  }

  // Description and metadata
  description(desc: string): this {
    this.state.config.description = desc
    return this
  }

  // Tools configuration
  tools(tools: string[]): this {
    this.state.config.tools = [...tools]
    return this
  }

  addTool(tool: string): this {
    if (!this.state.config.tools) {
      this.state.config.tools = []
    }
    this.state.config.tools.push(tool)
    return this
  }

  // Context sources
  contextSources(sources: string[]): this {
    this.state.config.contextSources = [...sources]
    return this
  }

  addContextSource(source: string): this {
    if (!this.state.config.contextSources) {
      this.state.config.contextSources = []
    }
    this.state.config.contextSources.push(source)
    return this
  }

  // Persona configuration
  persona(config: Partial<NonNullable<AICopilotConfig['persona']>>): this {
    this.state.config.persona = { 
      ...this.state.config.persona, 
      ...config 
    }
    return this
  }

  // Visibility settings
  visibility(config: Partial<NonNullable<AICopilotConfig['visibility']>>): this {
    this.state.config.visibility = { 
      ...this.state.config.visibility, 
      ...config 
    }
    return this
  }

  // UI configuration
  ui(config: Partial<NonNullable<AICopilotConfig['uiConfig']>>): this {
    this.state.config.uiConfig = { 
      ...this.state.config.uiConfig, 
      ...config 
    }
    return this
  }

  // Security configuration
  security(config: Partial<NonNullable<AICopilotConfig['security']>>): this {
    this.state.config.security = { 
      ...this.state.config.security, 
      ...config 
    }
    return this
  }

  // Performance configuration
  performance(config: Partial<NonNullable<AICopilotConfig['performance']>>): this {
    this.state.config.performance = { 
      ...this.state.config.performance, 
      ...config 
    }
    return this
  }

  // Analytics configuration
  analytics(config: Partial<NonNullable<AICopilotConfig['analytics']>>): this {
    this.state.config.analytics = { 
      ...this.state.config.analytics, 
      ...config 
    }
    return this
  }

  // Enterprise security features - provides defaults for required fields
  enterpriseSecurity(config: Partial<NonNullable<AICopilotConfig['enterpriseSecurity']>>): this {
    const defaults: NonNullable<AICopilotConfig['enterpriseSecurity']> = {
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
    }

    this.state.config.enterpriseSecurity = { 
      ...defaults,
      ...this.state.config.enterpriseSecurity, 
      ...config 
    }
    return this
  }

  // Enterprise performance features - provides defaults for required fields
  enterprisePerformance(config: Partial<NonNullable<AICopilotConfig['enterprisePerformance']>>): this {
    const defaults: NonNullable<AICopilotConfig['enterprisePerformance']> = {
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
    }

    this.state.config.enterprisePerformance = { 
      ...defaults,
      ...this.state.config.enterprisePerformance, 
      ...config 
    }
    return this
  }

  // Enterprise memory features - provides defaults for required fields
  enterpriseMemory(config: Partial<NonNullable<AICopilotConfig['enterpriseMemory']>>): this {
    const defaults: NonNullable<AICopilotConfig['enterpriseMemory']> = {
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
    }

    this.state.config.enterpriseMemory = { 
      ...defaults,
      ...this.state.config.enterpriseMemory, 
      ...config 
    }
    return this
  }

  // Enterprise features - provides defaults for required fields
  enterprise(config: Partial<NonNullable<AICopilotConfig['enterprise']>>): this {
    const defaults: NonNullable<AICopilotConfig['enterprise']> = {
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
    }

    this.state.config.enterprise = { 
      ...defaults,
      ...this.state.config.enterprise, 
      ...config 
    }
    return this
  }

  // Actions configuration
  actions(actions: NonNullable<AICopilotConfig['actions']>): this {
    this.state.config.actions = [...actions]
    return this
  }

  addAction(action: NonNullable<AICopilotConfig['actions']>[0]): this {
    if (!this.state.config.actions) {
      this.state.config.actions = []
    }
    this.state.config.actions.push(action)
    return this
  }

  // Features configuration
  features(config: Partial<NonNullable<AICopilotConfig['features']>>): this {
    this.state.config.features = { 
      ...this.state.config.features, 
      ...config 
    }
    return this
  }

  // Development configuration
  development(config: Partial<NonNullable<AICopilotConfig['development']>>): this {
    this.state.config.development = { 
      ...this.state.config.development, 
      ...config 
    }
    return this
  }

  // Environment configuration and validation methods
  
  /**
   * Explicit environment configuration method
   * Allows manual override of environment detection and configuration
   */
  environmentConfig(config: {
    framework?: 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown'
    apiKey?: string
    model?: string
    requireApiKey?: boolean
    validateOnBuild?: boolean
  }): this {
    // Store environment config in metadata
    if (!this.state.config.metadata) {
      this.state.config.metadata = {}
    }
    
    this.state.config.metadata.environmentConfig = config
    
    // Apply configuration immediately if provided
    if (config.framework) {
      this.frameworkSpecific(config.framework === 'nextjs' || config.framework === 'vite' ? config.framework : 'auto')
    }
    
    if (config.model && !this.state.config.model) {
      this.state.config.model = config.model
    }
    
    if (config.requireApiKey !== undefined) {
      this.state.config.metadata.requireApiKey = config.requireApiKey
    }
    
    if (config.validateOnBuild !== undefined) {
      this.state.config.metadata.validateEnvironmentOnBuild = config.validateOnBuild
    }
    
    return this
  }

  /**
   * Auto-detects and configures environment-specific settings
   */
  autoDetectEnvironment(): this {
    const framework = detectFramework()
    
    // Set framework-aware defaults
    if (framework === 'nextjs') {
      this.development({
        debugMode: false, // More conservative for Next.js
        mockMode: false
      })
    } else if (framework === 'vite') {
      this.development({
        debugMode: true, // Vite is often used for development
        mockMode: false
      })
    }
    
    // Set default model if not already set and API key is available
    if (!this.state.config.model) {
      try {
        this.state.config.model = getDefaultModel()
      } catch {
        // Ignore if default model can't be determined
      }
    }
    
    return this
  }

  /**
   * Validates environment configuration
   */
  validateEnvironment(): this {
    const envValidation = validateEnvironment()
    
    if (!envValidation.isValid) {
      // Store environment validation errors
      this.state.validationErrors.environment = envValidation.errors
      
      // Add warnings as well
      if (envValidation.warnings.length > 0) {
        this.state.validationErrors.environmentWarnings = envValidation.warnings
      }
    }
    
    return this
  }

  /**
   * Requires API key to be present (throws on build if missing)
   */
  requireApiKey(): this {
    this.state.config.metadata = {
      ...this.state.config.metadata,
      requireApiKey: true
    }
    return this
  }

  /**
   * Sets up framework-specific configuration
   */
  frameworkSpecific(framework?: 'nextjs' | 'vite' | 'auto'): this {
    const detectedFramework = framework === 'auto' || !framework ? detectFramework() : framework
    
    switch (detectedFramework) {
      case 'nextjs':
        this.performance({
          streamingEnabled: true, // Next.js handles streaming well
          rateLimiting: {
            maxRequestsPerMinute: 60,
            maxRequestsPerHour: 1000
          }
        })
        break
        
      case 'vite':
        this.performance({
          streamingEnabled: true,
          rateLimiting: {
            maxRequestsPerMinute: 30, // More conservative for dev environments
            maxRequestsPerHour: 500
          }
        })
        break
    }
    
    return this
  }

  // Preset configurations
  preset(type: ConfigPreset): this {
    this.state.appliedPresets.push(type)
    
    switch (type) {
      case 'basic':
        return this.basicPreset()
      case 'enterprise':
        return this.enterprisePreset()
      case 'development':
        return this.developmentPreset()
      case 'production':
        return this.productionPreset()
      case 'compliance-gdpr':
        return this.gdprPreset()
      case 'compliance-hipaa':
        return this.hipaaPreset()
      case 'high-performance':
        return this.highPerformancePreset()
      case 'secure':
        return this.securePreset()
      default:
        return this
    }
  }

  // Preset implementations
  private basicPreset(): this {
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
      })
  }

  private enterprisePreset(): this {
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
      })
  }

  private developmentPreset(): this {
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
      })
  }

  private productionPreset(): this {
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
      })
  }

  private gdprPreset(): this {
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
      })
  }

  private hipaaPreset(): this {
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
      })
  }

  private highPerformancePreset(): this {
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
      })
  }

  private securePreset(): this {
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
      })
  }

  // Utility methods
  private sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  private applyDefaults(): AICopilotConfig {
    const config = this.state.config as AICopilotConfig

    // Apply minimal required defaults
    if (!config.model && config.modelProvider === 'openai') {
      config.model = 'gpt-3.5-turbo'
    }
    
    if (!config.tools) config.tools = []
    if (!config.contextSources) config.contextSources = []
    if (!config.actions) config.actions = []
    if (!config.fallbackMessage) {
      config.fallbackMessage = 'I apologize, but I encountered an error. Please try again.'
    }
    if (!config.memoryScope) config.memoryScope = 'session'

    return config
  }

  // Validation method using the full ConfigValidator
  private validateBasic(): { isValid: boolean; errors: ValidationErrors; warnings: string[] } {
    try {
      const configToValidate = this.applyDefaults()
      const fullValidation = validateConfig(configToValidate)
      
      return {
        isValid: fullValidation.isValid,
        errors: fullValidation.errors,
        warnings: fullValidation.warnings
      }
    } catch (error) {
      // Fallback to basic validation if full validation fails
      const errors: string[] = []
      
      // Type-safe string validation
      if (typeof this.state.config.name !== 'string' || !this.state.config.name.trim()) {
        errors.push('name is required')
      }
      if (typeof this.state.config.slug !== 'string' || !this.state.config.slug.trim()) {
        errors.push('slug is required')
      }
      if (typeof this.state.config.firstMessage !== 'string' || !this.state.config.firstMessage.trim()) {
        errors.push('firstMessage is required')
      }
      if (typeof this.state.config.databasePath !== 'string' || !this.state.config.databasePath.trim()) {
        errors.push('databasePath is required')
      }
      if (typeof this.state.config.embedLocation !== 'string' || !this.state.config.embedLocation.trim()) {
        errors.push('embedLocation is required')
      }
      if (typeof this.state.config.modelProvider !== 'string' || !this.state.config.modelProvider.trim()) {
        errors.push('modelProvider is required')
      }
      if (typeof this.state.config.systemPrompt !== 'string' || !this.state.config.systemPrompt.trim()) {
        errors.push('systemPrompt is required')
      }

      // Environment validation for critical configurations
      if (this.state.config.modelProvider === 'openai') {
        try {
          getApiKey()
        } catch (apiError) {
          // Only error if API key is explicitly required
          if (this.state.config.metadata?.requireApiKey) {
            errors.push(`OpenAI API key is required but not found: ${apiError instanceof Error ? apiError.message : String(apiError)}`)
          }
        }
      }

      // Include any environment validation errors stored during validateEnvironment()
      if (this.state.validationErrors.environment) {
        errors.push(...this.state.validationErrors.environment)
      }

      return {
        isValid: errors.length === 0,
        errors: { general: errors },
        warnings: []
      }
    }
  }

  // Build methods
  build(): ValidAICopilotConfig {
    this.state.buildAttempts++
    
    const validation = this.validateBasic()
    if (!validation.isValid) {
      // Create a descriptive error message from the validation results
      const errorMessages = Object.entries(validation.errors)
        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
        .join('; ')
      
      throw new ConfigValidationError(
        validation.errors,
        validation.warnings,
        `Configuration validation failed after ${this.state.buildAttempts} attempts. ${errorMessages}`
      )
    }

    const config = this.applyDefaults()
    return config as ValidAICopilotConfig
  }

  // Build without throwing (returns validation result)
  tryBuild(): { success: boolean; config?: ValidAICopilotConfig; errors?: string[] } {
    try {
      // Run environment validation if requested
      if (this.state.config.metadata?.validateEnvironmentOnBuild !== false) {
        this.validateEnvironment()
      }
      
      const config = this.build()
      return { success: true, config }
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        const flatErrors: string[] = []
        Object.values(error.errors).forEach(errorArray => {
          flatErrors.push(...errorArray)
        })
        return { 
          success: false, 
          errors: flatErrors
        }
      }
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  // Get current state
  getState(): BuilderState {
    return { ...this.state }
  }

  // Reset builder
  reset(): this {
    this.state = {
      config: {},
      validationErrors: {},
      appliedPresets: [],
      buildAttempts: 0
    }
    return this
  }

  // Clone builder
  clone(): CopilotConfigBuilder {
    const cloned = new CopilotConfigBuilder()
    cloned.state = {
      config: { ...this.state.config },
      validationErrors: { ...this.state.validationErrors },
      appliedPresets: [...this.state.appliedPresets],
      buildAttempts: this.state.buildAttempts
    }
    return cloned
  }
}

// Factory functions
export const createCopilotConfig = (initialConfig?: Partial<AICopilotConfig>) => 
  new CopilotConfigBuilder(initialConfig)

export const createBasicConfig = (name: string, message: string) =>
  createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('basic')

export const createEnterpriseConfig = (name: string, message: string) =>
  createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('enterprise')

export const createDevelopmentConfig = (name: string, message: string) =>
  createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('development')

export const createProductionConfig = (name: string, message: string) =>
  createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('production')

// Preset-specific builders
export const createSecureConfig = (name: string, message: string) =>
  createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('secure')

export const createHighPerformanceConfig = (name: string, message: string) =>
  createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset('high-performance')

export const createComplianceConfig = (name: string, message: string, framework: 'gdpr' | 'hipaa') =>
  createCopilotConfig()
    .basic(name, name.toLowerCase().replace(/\s+/g, '-'), message)
    .preset(framework === 'gdpr' ? 'compliance-gdpr' : 'compliance-hipaa') 