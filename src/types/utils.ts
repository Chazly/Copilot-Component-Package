import { CopilotConfig, AICopilotConfig, CopilotConfigType } from './index'

// Re-export core config types individually for clear imports
export type { CopilotConfig, AICopilotConfig, CopilotConfigType } from './index'

// Deep partial utilities for incremental config building
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type ConfigPartial<T extends CopilotConfigType> = DeepPartial<T>

// Strict type utilities for validation
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Enterprise config validation types
export type ValidAICopilotConfig = RequiredFields<
  AICopilotConfig, 
  'name' | 'slug' | 'firstMessage' | 'databasePath' | 'embedLocation' | 'modelProvider' | 'systemPrompt'
>

export type ValidLegacyConfig = RequiredFields<
  CopilotConfig, 
  'title' | 'subtitle' | 'color' | 'initialMessage'
>

// Config extension utilities
export type ConfigWithDefaults<T> = T & {
  _hasDefaults: true
  _configType: T extends CopilotConfig ? 'legacy' : 'advanced'
  _phase: number
  _generated: Date
}

// Validation result types
export interface ValidationErrors {
  [field: string]: string[]
}

export interface ValidationSuggestion {
  type: 'performance' | 'security' | 'usability' | 'compliance' | 'migration'
  message: string
  action?: string
  impact: 'low' | 'medium' | 'high'
  autoFixable: boolean
}

export interface StrictValidationResult<T> {
  config: T
  isValid: boolean
  errors: ValidationErrors
  warnings: string[]
  suggestions: ValidationSuggestion[]
  phase: number
  score: number // 0-100 configuration quality score
  recommendations: string[]
}

// Migration types
export interface MigrationStep {
  step: number
  title: string
  description: string
  action: string
  impact: string
  required: boolean
  estimatedTime: number // minutes
}

export interface MigrationPlan {
  fromPhase: number
  toPhase: number
  steps: MigrationStep[]
  totalTime: number
  breakingChanges: boolean
  benefits: string[]
}

// Builder configuration state
export interface BuilderState {
  config: Partial<AICopilotConfig>
  validationErrors: ValidationErrors
  appliedPresets: string[]
  buildAttempts: number
}

// Configuration presets
export type ConfigPreset = 
  | 'basic' 
  | 'enterprise' 
  | 'development' 
  | 'production'
  | 'compliance-gdpr'
  | 'compliance-hipaa'
  | 'high-performance'
  | 'secure'

// Error types for better error handling
export class ConfigValidationError extends Error {
  constructor(
    public errors: ValidationErrors,
    public warnings: string[] = [],
    message?: string
  ) {
    super(message || 'Configuration validation failed')
    this.name = 'ConfigValidationError'
  }
}

export class MigrationError extends Error {
  constructor(
    public step: string,
    public reason: string,
    message?: string
  ) {
    super(message || `Migration failed at step: ${step}`)
    this.name = 'MigrationError'
  }
}

// Utility type for extracting config keys
export type ConfigKeys<T extends CopilotConfigType> = keyof T

// Type for config property paths (for deep validation)
export type PropertyPath<T, K extends keyof T = keyof T> = 
  K extends string 
    ? T[K] extends object 
      ? K | `${K}.${PropertyPath<T[K]>}`
      : K
    : never

// Helper types for enterprise features
export type EnterpriseFeature = 
  | 'security'
  | 'performance' 
  | 'memory'
  | 'dashboard'
  | 'compliance'
  | 'analytics'

export type FeatureConfig<T extends EnterpriseFeature> = 
  T extends 'security' ? AICopilotConfig['enterpriseSecurity'] :
  T extends 'performance' ? AICopilotConfig['enterprisePerformance'] :
  T extends 'memory' ? AICopilotConfig['enterpriseMemory'] :
  T extends 'dashboard' ? AICopilotConfig['enterprise'] :
  never

// Type guard utilities
export const isValidationError = (error: any): error is ConfigValidationError => {
  return error instanceof ConfigValidationError
}

export const isMigrationError = (error: any): error is MigrationError => {
  return error instanceof MigrationError
}

// Utility for checking if config has enterprise features
export const hasEnterpriseFeatures = (config: CopilotConfigType): config is AICopilotConfig => {
  return 'enterpriseSecurity' in config || 
         'enterprisePerformance' in config || 
         'enterpriseMemory' in config || 
         'enterprise' in config
}

// Phase detection utility
export const detectConfigPhase = (config: CopilotConfigType): number => {
  if ('title' in config && 'subtitle' in config) return 1 // Legacy config
  if (!('slug' in config)) return 1
  if (!config.security && !config.performance) return 2
  if (!config.analytics && !config.integrations) return 3
  if (!hasEnterpriseFeatures(config)) return 4
  return 5 // Phase 5 with enterprise features
} 