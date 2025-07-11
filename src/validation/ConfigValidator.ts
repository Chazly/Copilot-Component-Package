import { 
  CopilotConfig, 
  AICopilotConfig, 
  CopilotConfigType,
  isAICopilotConfig,
  isLegacyCopilotConfig 
} from '../types'
import { 
  ValidationErrors,
  ValidationSuggestion,
  StrictValidationResult,
  detectConfigPhase,
  hasEnterpriseFeatures
} from '../types/utils'

export class ConfigValidator {
  private validModelProviders = ['openai', 'anthropic', 'mistral', 'local']
  private validMemoryScopes = ['session', 'user', 'org', 'ephemeral']
  private validLayouts = ['chatbox', 'sidebar', 'fullpage']
  private validThemes = ['dark', 'light', 'auto']
  private validCompliance = ['gdpr', 'hipaa', 'sox', 'none']
  private validTones = ['professional', 'casual', 'witty', 'empathetic', 'neutral']

  validate<T extends CopilotConfigType>(config: T): StrictValidationResult<T> {
    const errors: ValidationErrors = {}
    const warnings: string[] = []
    const suggestions: ValidationSuggestion[] = []
    let score = 100

    // Required field validation
    this.validateRequiredFields(config, errors)
    
    // Type-specific validation
    if (isAICopilotConfig(config)) {
      this.validateAIConfig(config, errors, warnings, suggestions)
      score = this.calculateQualityScore(config)
    } else if (isLegacyCopilotConfig(config)) {
      this.validateLegacyConfig(config, errors, warnings, suggestions)
      score = this.calculateLegacyScore(config)
    } else {
      errors.general = ['Invalid configuration format - must be either CopilotConfig or AICopilotConfig']
      score = 0
    }

    // Cross-field validation
    this.validateCrossFields(config, errors, warnings)
    
    // Security validation
    this.validateSecurity(config, warnings, suggestions)

    // Performance validation  
    this.validatePerformance(config, warnings, suggestions)

    // Generate quality suggestions
    this.generateQualitySuggestions(config, suggestions)

    // Add migration suggestions for legacy configs
    if (isLegacyCopilotConfig(config)) {
      suggestions.push({
        type: 'migration',
        message: 'Consider migrating to AICopilotConfig for advanced features and enterprise capabilities',
        action: 'migrateToAI',
        impact: 'high',
        autoFixable: true
      })
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
    }
  }

  private validateRequiredFields(config: CopilotConfigType, errors: ValidationErrors): void {
    if (isAICopilotConfig(config)) {
      if (!config.name?.trim()) {
        errors.name = ['Name is required and cannot be empty']
      }
      if (!config.slug?.trim()) {
        errors.slug = ['Slug is required and cannot be empty']
      } else if (!/^[a-z0-9-]+$/.test(config.slug)) {
        errors.slug = ['Slug must contain only lowercase letters, numbers, and hyphens']
      }
      if (!config.firstMessage?.trim()) {
        errors.firstMessage = ['First message is required and cannot be empty']
      }
      if (!config.databasePath?.trim()) {
        errors.databasePath = ['Database path is required and cannot be empty']
      }
      if (!config.embedLocation?.trim()) {
        errors.embedLocation = ['Embed location is required and cannot be empty']
      }
      if (!config.modelProvider?.trim()) {
        errors.modelProvider = ['Model provider is required and cannot be empty']
      }
      if (!config.systemPrompt?.trim()) {
        errors.systemPrompt = ['System prompt is required and cannot be empty']
      }
    } else if (isLegacyCopilotConfig(config)) {
      if (!config.title?.trim()) {
        errors.title = ['Title is required and cannot be empty']
      }
      if (!config.subtitle?.trim()) {
        errors.subtitle = ['Subtitle is required and cannot be empty']
      }
      if (!config.initialMessage?.trim()) {
        errors.initialMessage = ['Initial message is required and cannot be empty']
      }
      if (!config.color) {
        errors.color = ['Color is required']
      }
    }
  }

  private validateAIConfig(
    config: AICopilotConfig, 
    errors: ValidationErrors, 
    warnings: string[], 
    suggestions: ValidationSuggestion[]
  ): void {
    // Model provider validation
    if (config.modelProvider && !this.validModelProviders.includes(config.modelProvider) && !config.modelProvider.startsWith('custom:')) {
      warnings.push(`Unrecognized model provider: ${config.modelProvider}`)
      suggestions.push({
        type: 'usability',
        message: 'Consider using a well-supported model provider for better reliability',
        impact: 'medium',
        autoFixable: false
      })
    }

    // Memory scope validation
    if (config.memoryScope && !this.validMemoryScopes.includes(config.memoryScope)) {
      errors.memoryScope = [`Invalid memory scope: ${config.memoryScope}. Must be one of: ${this.validMemoryScopes.join(', ')}`]
    }

    // UI validation
    if (config.uiConfig?.layout && !this.validLayouts.includes(config.uiConfig.layout)) {
      errors['uiConfig.layout'] = [`Invalid layout: ${config.uiConfig.layout}. Must be one of: ${this.validLayouts.join(', ')}`]
    }

    if (config.uiConfig?.theme && !this.validThemes.includes(config.uiConfig.theme)) {
      errors['uiConfig.theme'] = [`Invalid theme: ${config.uiConfig.theme}. Must be one of: ${this.validThemes.join(', ')}`]
    }

    // Persona validation
    if (config.persona?.tone && !this.validTones.includes(config.persona.tone)) {
      errors['persona.tone'] = [`Invalid tone: ${config.persona.tone}. Must be one of: ${this.validTones.join(', ')}`]
    }

    // Security validation
    if (config.security?.compliance && !this.validCompliance.includes(config.security.compliance)) {
      errors['security.compliance'] = [`Invalid compliance setting: ${config.security.compliance}. Must be one of: ${this.validCompliance.join(', ')}`]
    }

    // Enterprise validation
    if (config.enterpriseSecurity?.enabled && !config.security?.auditLogging) {
      warnings.push('Enterprise security is enabled but basic audit logging is disabled')
      suggestions.push({
        type: 'security',
        message: 'Enable audit logging when using enterprise security features',
        action: 'enableAuditLogging',
        impact: 'medium',
        autoFixable: true
      })
    }

    // Performance validation
    if (config.performance?.rateLimiting) {
      if (config.performance.rateLimiting.maxRequestsPerMinute > config.performance.rateLimiting.maxRequestsPerHour) {
        errors['performance.rateLimiting'] = ['Max requests per minute cannot exceed max requests per hour']
      }
    }

    // Features validation
    if (config.features?.fileUpload?.enabled) {
      if (!config.features.fileUpload.maxFileSize || config.features.fileUpload.maxFileSize <= 0) {
        errors['features.fileUpload.maxFileSize'] = ['Max file size must be greater than 0 when file upload is enabled']
      }
      if (!config.features.fileUpload.allowedTypes || config.features.fileUpload.allowedTypes.length === 0) {
        warnings.push('File upload is enabled but no allowed file types are specified')
      }
    }

    // Development mode warnings
    if (config.development?.debugMode) {
      warnings.push('Debug mode is enabled - remember to disable in production')
    }
    if (config.development?.mockMode) {
      warnings.push('Mock mode is enabled - AI responses will be simulated')
    }
  }

  private validateLegacyConfig(
    config: CopilotConfig, 
    errors: ValidationErrors, 
    warnings: string[], 
    suggestions: ValidationSuggestion[]
  ): void {
    const validColors = ['blue', 'green', 'purple', 'emerald', 'cyan', 'amber', 'teal', 'slate', 'indigo']
    
    if (config.color && !validColors.includes(config.color)) {
      errors.color = [`Invalid color: ${config.color}. Must be one of: ${validColors.join(', ')}`]
    }

    warnings.push('Using legacy CopilotConfig - consider migrating to AICopilotConfig for advanced features')
    
    suggestions.push({
      type: 'migration',
      message: 'Upgrade to AICopilotConfig to access enterprise features, better security, and performance monitoring',
      action: 'migrateToAI',
      impact: 'high',
      autoFixable: true
    })
  }

  private validateCrossFields(config: CopilotConfigType, errors: ValidationErrors, warnings: string[]): void {
    if (isAICopilotConfig(config)) {
      // Validate consistency between related fields
      if (config.enterpriseSecurity?.enabled && config.security?.compliance === 'none') {
        warnings.push('Enterprise security is enabled but compliance framework is set to none')
      }

      if (config.enterprisePerformance?.monitoring?.enabled && !config.performance?.streamingEnabled) {
        warnings.push('Performance monitoring is enabled but streaming is disabled - some metrics may be limited')
      }

      if (config.visibility?.isPublic === false && (!config.visibility.rolesAllowed || config.visibility.rolesAllowed.length === 0)) {
        warnings.push('Copilot is private but no roles are specified - no users will have access')
      }

      // Validate enterprise memory with security
      if (config.enterpriseMemory?.encryption?.enabled && !config.enterpriseSecurity?.enabled) {
        warnings.push('Memory encryption is enabled but enterprise security is disabled')
      }
    }
  }

  private validateSecurity(config: CopilotConfigType, warnings: string[], suggestions: ValidationSuggestion[]): void {
    if (isAICopilotConfig(config)) {
      // Basic security recommendations
      if (!config.security?.encryptAtRest) {
        suggestions.push({
          type: 'security',
          message: 'Enable encryption at rest for better data protection',
          action: 'enableEncryption',
          impact: 'medium',
          autoFixable: true
        })
      }

      if (!config.security?.auditLogging) {
        suggestions.push({
          type: 'security',
          message: 'Enable audit logging for compliance and debugging',
          action: 'enableAuditLogging',
          impact: 'medium',
          autoFixable: true
        })
      }

      // Enterprise security recommendations
      if (!hasEnterpriseFeatures(config)) {
        suggestions.push({
          type: 'security',
          message: 'Consider enabling enterprise security features for production environments',
          impact: 'high',
          autoFixable: false
        })
      } else if (config.enterpriseSecurity && !config.enterpriseSecurity.threatDetection?.enabled) {
        suggestions.push({
          type: 'security',
          message: 'Enable threat detection for real-time security monitoring',
          action: 'enableThreatDetection',
          impact: 'high',
          autoFixable: true
        })
      }
    }
  }

  private validatePerformance(config: CopilotConfigType, warnings: string[], suggestions: ValidationSuggestion[]): void {
    if (isAICopilotConfig(config)) {
      // Caching recommendations
      if (!config.performance?.caching?.enabled) {
        suggestions.push({
          type: 'performance',
          message: 'Enable caching to improve response times',
          action: 'enableCaching',
          impact: 'medium',
          autoFixable: true
        })
      }

      // Streaming recommendations
      if (!config.performance?.streamingEnabled) {
        suggestions.push({
          type: 'performance',
          message: 'Enable streaming for better user experience with long responses',
          action: 'enableStreaming',
          impact: 'low',
          autoFixable: true
        })
      }

      // Rate limiting validation
      if (config.performance?.rateLimiting) {
        const { maxRequestsPerMinute, maxRequestsPerHour } = config.performance.rateLimiting
        if (maxRequestsPerMinute && maxRequestsPerHour && maxRequestsPerMinute * 60 > maxRequestsPerHour) {
          warnings.push('Rate limiting configuration may be too restrictive - per-minute limit exceeds hourly capacity')
        }
      }
    }
  }

  private generateQualitySuggestions(config: CopilotConfigType, suggestions: ValidationSuggestion[]): void {
    if (isAICopilotConfig(config)) {
      // Onboarding suggestions
      if (!config.onboardingSteps || config.onboardingSteps.length === 0) {
        suggestions.push({
          type: 'usability',
          message: 'Add onboarding steps to improve user experience',
          impact: 'medium',
          autoFixable: false
        })
      }

      // Actions suggestions
      if (!config.actions || config.actions.length === 0) {
        suggestions.push({
          type: 'usability',
          message: 'Add action buttons to provide quick user interactions',
          impact: 'low',
          autoFixable: false
        })
      }

      // Tools suggestions
      if (!config.tools || config.tools.length === 0) {
        suggestions.push({
          type: 'usability',
          message: 'Configure tools to extend copilot capabilities',
          impact: 'low',
          autoFixable: false
        })
      }

      // Analytics suggestions
      if (!config.analytics?.trackConversations) {
        suggestions.push({
          type: 'usability',
          message: 'Enable conversation tracking for usage insights',
          action: 'enableAnalytics',
          impact: 'low',
          autoFixable: true
        })
      }
    }
  }

  private calculateQualityScore(config: AICopilotConfig): number {
    let score = 100

    // Deduct points for missing optional but recommended features
    if (!config.description) score -= 5
    if (!config.persona?.tone) score -= 5
    if (!config.persona?.avatarUrl) score -= 3
    if (!config.onboardingSteps || config.onboardingSteps.length === 0) score -= 10
    if (!config.actions || config.actions.length === 0) score -= 8
    if (!config.tools || config.tools.length === 0) score -= 8
    if (!config.security?.encryptAtRest) score -= 10
    if (!config.security?.auditLogging) score -= 8
    if (!config.performance?.caching?.enabled) score -= 5
    if (!config.analytics?.trackConversations) score -= 5
    if (!hasEnterpriseFeatures(config)) score -= 15

    // Add points for advanced features
    if (config.enterpriseSecurity?.enabled) score += 10
    if (config.enterprisePerformance?.monitoring?.enabled) score += 8
    if (config.enterpriseMemory?.encryption?.enabled) score += 5
    if (config.features?.conversationRating) score += 3
    if (config.features?.messageReactions) score += 2

    return Math.max(0, Math.min(100, score))
  }

  private calculateLegacyScore(config: CopilotConfig): number {
    let score = 50 // Start lower for legacy configs

    if (config.title && config.title.length > 3) score += 10
    if (config.subtitle && config.subtitle.length > 5) score += 10
    if (config.initialMessage && config.initialMessage.length > 10) score += 15
    if (config.color) score += 15

    return Math.max(0, Math.min(100, score))
  }

  private generateRecommendations(config: CopilotConfigType, suggestions: ValidationSuggestion[]): string[] {
    const recommendations: string[] = []

    // High-impact suggestions become recommendations
    const highImpactSuggestions = suggestions.filter(s => s.impact === 'high')
    highImpactSuggestions.forEach(suggestion => {
      recommendations.push(suggestion.message)
    })

    // Add general recommendations based on config type
    if (isLegacyCopilotConfig(config)) {
      recommendations.push('Migrate to AICopilotConfig for access to advanced features')
    } else if (isAICopilotConfig(config)) {
      if (!hasEnterpriseFeatures(config)) {
        recommendations.push('Consider enabling enterprise features for production deployments')
      }
      if (detectConfigPhase(config) < 5) {
        recommendations.push('Upgrade to Phase 5 for the latest security and performance features')
      }
    }

    return recommendations
  }

  // Auto-fix common issues
  autoFix<T extends CopilotConfigType>(config: T): T {
    const fixed = { ...config } as T

    if (isAICopilotConfig(fixed)) {
      // Fix slug format
      if (fixed.slug) {
        fixed.slug = fixed.slug
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      }

      // Fix missing database path
      if (!fixed.databasePath && fixed.slug) {
        fixed.databasePath = `./data/${fixed.slug}.db`
      }

      // Fix missing embed location
      if (!fixed.embedLocation) {
        fixed.embedLocation = 'copilot-container'
      }

      // Fix model defaults
      if (!fixed.model && fixed.modelProvider === 'openai') {
        fixed.model = 'gpt-3.5-turbo'
      }

      // Fix fallback message
      if (!fixed.fallbackMessage) {
        fixed.fallbackMessage = 'I apologize, but I encountered an error. Please try again.'
      }
    }

    return fixed
  }

  // Suggest improvements based on current configuration
  generateImprovementPlan<T extends CopilotConfigType>(config: T): ValidationSuggestion[] {
    const improvements: ValidationSuggestion[] = []

    if (isLegacyCopilotConfig(config)) {
      improvements.push({
        type: 'migration',
        message: 'Migrate to AICopilotConfig to unlock advanced capabilities',
        action: 'migrateToAI',
        impact: 'high',
        autoFixable: true
      })
    } else if (isAICopilotConfig(config)) {
      const phase = detectConfigPhase(config)
      
      if (phase < 5) {
        improvements.push({
          type: 'migration',
          message: `Upgrade from Phase ${phase} to Phase 5 for latest features`,
          action: 'upgradeToPhase5',
          impact: 'high',
          autoFixable: true
        })
      }

      if (!config.enterpriseSecurity?.enabled) {
        improvements.push({
          type: 'security',
          message: 'Enable enterprise security for production-grade protection',
          action: 'enableEnterpriseSecurity',
          impact: 'high',
          autoFixable: true
        })
      }

      if (!config.enterprisePerformance?.monitoring?.enabled) {
        improvements.push({
          type: 'performance',
          message: 'Enable performance monitoring for insights and optimization',
          action: 'enablePerformanceMonitoring',
          impact: 'medium',
          autoFixable: true
        })
      }
    }

    return improvements
  }
}

// Singleton instance
export const configValidator = new ConfigValidator()

// Convenience functions
export const validateConfig = <T extends CopilotConfigType>(config: T): StrictValidationResult<T> => 
  configValidator.validate(config)

export const autoFixConfig = <T extends CopilotConfigType>(config: T): T => 
  configValidator.autoFix(config)

export const getImprovementPlan = <T extends CopilotConfigType>(config: T): ValidationSuggestion[] => 
  configValidator.generateImprovementPlan(config) 