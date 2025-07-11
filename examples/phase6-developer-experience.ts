// Phase 6: Developer Experience Examples
// This file showcases all the new developer experience improvements in Phase 6

import { 
  // Core types with clear naming
  LegacyCopilotConfig,
  AdvancedCopilotConfig,
  CopilotConfigType,
  
  // Utility types for better development
  ValidAICopilotConfig,
  StrictValidationResult,
  MigrationPlan,
  ConfigPreset,
  
  // Builder pattern
  CopilotConfigBuilder,
  createCopilotConfig,
  createBasicConfig,
  createEnterpriseConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createSecureConfig,
  createHighPerformanceConfig,
  createComplianceConfig,
  
  // Enhanced validation
  validateConfigStrict,
  autoFixConfig,
  getImprovementPlan,
  
  // Migration utilities
  migrateToAI,
  migrateToLatestPhase,
  getMigrationPlan,
  previewMigration,
  validateMigration
} from '../src/index'

// =============================================================================
// 1. BUILDER PATTERN EXAMPLES
// =============================================================================

console.log('🚀 Phase 6: Builder Pattern Examples\n')

// Example 1: Basic fluent API configuration
const basicConfig = createCopilotConfig()
  .basic('Customer Support', 'support-bot', 'How can I help you today?')
  .model('openai', 'gpt-4')
  .systemPrompt('You are a helpful customer support assistant. Be friendly and professional.')
  .storage('./data/support.db', 'customer-support-widget')
  .ui({ theme: 'dark', layout: 'sidebar' })
  .security({ compliance: 'gdpr', encryptAtRest: true })
  .build()

console.log('✅ Basic config built:', basicConfig.name)

// Example 2: Enterprise configuration with preset
const enterpriseConfig = createCopilotConfig()
  .basic('Enterprise AI', 'enterprise-assistant', 'Welcome to our enterprise AI assistant')
  .model('anthropic', 'claude-3-sonnet')
  .preset('enterprise') // Applies enterprise defaults
  .enterpriseSecurity({
    threatDetection: { 
      enabled: true, 
      sensitivity: 'high',
      realTimeMonitoring: true 
    }
  })
  .enterprisePerformance({
    monitoring: { enabled: true, metricsCollection: true, realTimeDashboard: true }
  })
  .build()

console.log('✅ Enterprise config built with phase:', enterpriseConfig.metadata)

// Example 3: Development configuration
const devConfig = createDevelopmentConfig('Dev Bot', 'Debug mode enabled')
  .model('local', 'llama-2')
  .development({ debugMode: true, mockMode: true })
  .build()

console.log('✅ Development config built:', devConfig.development)

// Example 4: Production-ready configuration
const prodConfig = createProductionConfig('Production AI', 'Production assistant')
  .model('openai', 'gpt-4-turbo')
  .security({ 
    encryptAtRest: true, 
    auditLogging: true,
    compliance: 'gdpr',
    dataRetention: 90
  })
  .performance({
    streamingEnabled: true,
    caching: { enabled: true, ttl: 600 },
    rateLimiting: {
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000
    }
  })
  .analytics({ trackConversations: true, trackActions: true })
  .build()

console.log('✅ Production config built with security:', prodConfig.security?.compliance)

// Example 5: Compliance-specific configuration
const hipaaConfig = createComplianceConfig('Healthcare AI', 'HIPAA-compliant assistant', 'hipaa')
  .systemPrompt('You are a healthcare assistant. Protect patient privacy at all costs.')
  .enterpriseSecurity({
    piiProtection: {
      enabled: true,
      autoDetection: true,
      maskingRules: ['ssn', 'medical_record', 'insurance']
    }
  })
  .build()

console.log('✅ HIPAA config built with PII protection:', hipaaConfig.enterpriseSecurity?.piiProtection)

// =============================================================================
// 2. VALIDATION EXAMPLES
// =============================================================================

console.log('\n🔍 Phase 6: Enhanced Validation Examples\n')

// Example 1: Comprehensive validation with scoring
const validationResult = validateConfigStrict(enterpriseConfig)
console.log('📊 Validation Results:')
console.log(`  Valid: ${validationResult.isValid}`)
console.log(`  Quality Score: ${validationResult.score}/100`)
console.log(`  Phase: ${validationResult.phase}`)
console.log(`  Warnings: ${validationResult.warnings.length}`)
console.log(`  Suggestions: ${validationResult.suggestions.length}`)

// Example 2: Auto-fix common issues
const brokenConfig = {
  name: 'Test Bot',
  slug: 'Test Bot With Spaces!@#', // Invalid slug
  firstMessage: 'Hello',
  // Missing required fields
} as any

const fixedConfig = autoFixConfig(brokenConfig)
console.log('🔧 Auto-fixed config slug:', fixedConfig.slug)

// Example 3: Get improvement suggestions
const improvements = getImprovementPlan(basicConfig)
console.log('💡 Improvement suggestions:')
improvements.forEach((suggestion, index) => {
  console.log(`  ${index + 1}. [${suggestion.impact}] ${suggestion.message}`)
})

// =============================================================================
// 3. MIGRATION EXAMPLES
// =============================================================================

console.log('\n🔄 Phase 6: Migration Examples\n')

// Example 1: Legacy config migration
const legacyConfig: LegacyCopilotConfig = {
  title: 'Old Chatbot',
  subtitle: 'Legacy assistant',
  color: 'blue',
  initialMessage: 'Hi there! How can I help?'
}

console.log('📋 Migrating legacy config...')
const migratedConfig = migrateToAI(legacyConfig)
console.log(`✅ Migrated: "${legacyConfig.title}" → "${migratedConfig.name}"`)
console.log(`  Slug: ${migratedConfig.slug}`)
console.log(`  Database: ${migratedConfig.databasePath}`)

// Example 2: Migration plan
const migrationPlan = getMigrationPlan(legacyConfig, 5)
console.log('\n📋 Migration Plan:')
console.log(`  From Phase: ${migrationPlan.fromPhase} → To Phase: ${migrationPlan.toPhase}`)
console.log(`  Total Time: ${migrationPlan.totalTime} minutes`)
console.log(`  Breaking Changes: ${migrationPlan.breakingChanges}`)
console.log('  Steps:')
migrationPlan.steps.forEach(step => {
  console.log(`    ${step.step}. ${step.title} (${step.estimatedTime}min)`)
  console.log(`       ${step.description}`)
})

// Example 3: Preview migration changes
const preview = previewMigration(legacyConfig)
console.log('\n👀 Migration Preview:')
console.log('  Changes:')
preview.changes.forEach(change => console.log(`    • ${change}`))
console.log('  New Features:')
preview.newFeatures.forEach(feature => console.log(`    + ${feature}`))

// Example 4: Validate migration compatibility
const migrationValidation = validateMigration(legacyConfig)
console.log('\n✅ Migration Validation:')
console.log(`  Can Migrate: ${migrationValidation.canMigrate}`)
if (migrationValidation.issues.length > 0) {
  console.log('  Issues:')
  migrationValidation.issues.forEach(issue => console.log(`    ❌ ${issue}`))
}
if (migrationValidation.warnings.length > 0) {
  console.log('  Warnings:')
  migrationValidation.warnings.forEach(warning => console.log(`    ⚠️ ${warning}`))
}

// =============================================================================
// 4. ADVANCED BUILDER PATTERNS
// =============================================================================

console.log('\n🏗️ Phase 6: Advanced Builder Patterns\n')

// Example 1: Clone and modify configuration
const baseConfig = createBasicConfig('Base Bot', 'Base message')
  .model('openai', 'gpt-3.5-turbo')
  .ui({ theme: 'light' })

const clonedBuilder = new CopilotConfigBuilder(baseConfig.tryBuild().config!)
  .clone()
  .ui({ theme: 'dark' }) // Override theme
  .enterpriseSecurity({ enabled: true })

const clonedConfig = clonedBuilder.build()
console.log('🔄 Cloned config with dark theme:', clonedConfig.uiConfig?.theme)

// Example 2: Conditional configuration
function createAdaptiveConfig(isProduction: boolean, complianceRequired: boolean): ValidAICopilotConfig {
  const builder = createCopilotConfig()
    .basic('Adaptive Bot', 'adaptive-bot', 'I adapt to your environment')
    .model('openai', isProduction ? 'gpt-4' : 'gpt-3.5-turbo')
    .storage('./data/adaptive.db', 'adaptive-widget')

  // Apply environment-specific settings
  if (isProduction) {
    builder.preset('production')
  } else {
    builder.preset('development')
  }

  // Apply compliance settings
  if (complianceRequired) {
    builder.preset('compliance-gdpr')
  }

  return builder.build()
}

const prodComplianceConfig = createAdaptiveConfig(true, true)
console.log('🎯 Adaptive production config:', {
  model: prodComplianceConfig.model,
  compliance: prodComplianceConfig.security?.compliance,
  enterprise: !!prodComplianceConfig.enterpriseSecurity
})

// Example 3: Error handling with tryBuild
const riskyBuilder = createCopilotConfig()
  .basic('Incomplete Bot', '', '') // Empty required fields

const buildResult = riskyBuilder.tryBuild()
if (buildResult.success) {
  console.log('✅ Build successful')
} else {
  console.log('❌ Build failed:')
  buildResult.errors?.forEach(error => console.log(`    • ${error}`))
}

// =============================================================================
// 5. TYPE SAFETY EXAMPLES
// =============================================================================

console.log('\n🛡️ Phase 6: Type Safety Examples\n')

// Example 1: Strict typing with ValidAICopilotConfig
function processValidConfig(config: ValidAICopilotConfig) {
  // TypeScript knows all required fields are present
  console.log(`Processing ${config.name} (${config.slug})`)
  console.log(`Model: ${config.modelProvider}/${config.model || 'default'}`)
  console.log(`Storage: ${config.databasePath}`)
}

processValidConfig(enterpriseConfig)

// Example 2: Type guards in action
function handleAnyConfig(config: CopilotConfigType) {
  if (validateConfigStrict(config).isValid) {
    console.log('✅ Valid configuration detected')
    
    // Use migration utilities for type conversion
    if ('title' in config) {
      const upgraded = migrateToAI(config)
      console.log(`🔄 Upgraded legacy config: ${upgraded.name}`)
    }
  } else {
    console.log('❌ Invalid configuration')
  }
}

handleAnyConfig(legacyConfig)
handleAnyConfig(enterpriseConfig)

// =============================================================================
// 6. REAL-WORLD USAGE PATTERNS
// =============================================================================

console.log('\n🌍 Phase 6: Real-World Usage Patterns\n')

// Example 1: Multi-environment configuration factory
class ConfigFactory {
  static createForEnvironment(env: 'dev' | 'staging' | 'prod', name: string): ValidAICopilotConfig {
    const baseBuilder = createCopilotConfig()
      .basic(name, `${name.toLowerCase()}-${env}`, `${name} in ${env} environment`)
      .storage(`./data/${env}/${name.toLowerCase()}.db`, `${name.toLowerCase()}-widget`)

    switch (env) {
      case 'dev':
        return baseBuilder
          .preset('development')
          .model('local', 'llama-2')
          .build()

      case 'staging':
        return baseBuilder
          .preset('production')
          .model('openai', 'gpt-3.5-turbo')
          .security({ compliance: 'none' })
          .build()

      case 'prod':
        return baseBuilder
          .preset('enterprise')
          .model('openai', 'gpt-4-turbo')
          .build()

      default:
        throw new Error(`Unknown environment: ${env}`)
    }
  }
}

const devBot = ConfigFactory.createForEnvironment('dev', 'Test Assistant')
const prodBot = ConfigFactory.createForEnvironment('prod', 'Production Assistant')

console.log('🏭 Factory-created configs:')
console.log(`  Dev: ${devBot.name} (${devBot.development?.debugMode ? 'debug on' : 'debug off'})`)
console.log(`  Prod: ${prodBot.name} (enterprise: ${!!prodBot.enterpriseSecurity?.enabled})`)

// Example 2: Configuration validation pipeline
class ConfigPipeline {
  static async validateAndDeploy(config: CopilotConfigType): Promise<ValidAICopilotConfig> {
    console.log('🔍 Starting validation pipeline...')
    
    // Step 1: Basic validation
    const validation = validateConfigStrict(config)
    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.errors)
      throw new Error('Configuration validation failed')
    }
    
    // Step 2: Auto-fix minor issues
    const fixed = autoFixConfig(config)
    console.log('🔧 Applied auto-fixes')
    
    // Step 3: Upgrade to latest if needed
    const latest = migrateToLatestPhase(fixed)
    console.log('🚀 Upgraded to latest phase')
    
    // Step 4: Final validation
    const finalValidation = validateConfigStrict(latest)
    if (finalValidation.score < 80) {
      console.log('⚠️ Configuration quality score is low:', finalValidation.score)
      console.log('💡 Suggestions:', finalValidation.suggestions.map(s => s.message))
    }
    
    console.log('✅ Pipeline completed successfully')
    return latest
  }
}

// Run the pipeline
ConfigPipeline.validateAndDeploy(legacyConfig)
  .then(deployedConfig => {
    console.log(`🎉 Deployed: ${deployedConfig.name} (Phase ${deployedConfig.metadata?.previousPhase || 'N/A'} → 5)`)
  })
  .catch(error => {
    console.error('💥 Pipeline failed:', error.message)
  })

console.log('\n🎊 Phase 6 Developer Experience Examples Complete!')
console.log('\nKey improvements:')
console.log('✨ Fluent builder API for easy configuration creation')
console.log('🔍 Enhanced validation with quality scoring and suggestions')
console.log('🔄 Seamless migration utilities with preview and planning')
console.log('🛡️ Better type safety with utility types')
console.log('🏗️ Preset configurations for common use cases')
console.log('🌍 Real-world patterns for enterprise deployment') 