import { CopilotConfig, AICopilotConfig, CopilotConfigType } from './index';
export type { CopilotConfig, AICopilotConfig, CopilotConfigType } from './index';
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type ConfigPartial<T extends CopilotConfigType> = DeepPartial<T>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type ValidAICopilotConfig = RequiredFields<AICopilotConfig, 'name' | 'slug' | 'firstMessage' | 'databasePath' | 'embedLocation' | 'modelProvider' | 'systemPrompt'>;
export type ValidLegacyConfig = RequiredFields<CopilotConfig, 'title' | 'subtitle' | 'color' | 'initialMessage'>;
export type ConfigWithDefaults<T> = T & {
    _hasDefaults: true;
    _configType: T extends CopilotConfig ? 'legacy' : 'advanced';
    _phase: number;
    _generated: Date;
};
export interface ValidationErrors {
    [field: string]: string[];
}
export interface ValidationSuggestion {
    type: 'performance' | 'security' | 'usability' | 'compliance' | 'migration';
    message: string;
    action?: string;
    impact: 'low' | 'medium' | 'high';
    autoFixable: boolean;
}
export interface StrictValidationResult<T> {
    config: T;
    isValid: boolean;
    errors: ValidationErrors;
    warnings: string[];
    suggestions: ValidationSuggestion[];
    phase: number;
    score: number;
    recommendations: string[];
}
export interface MigrationStep {
    step: number;
    title: string;
    description: string;
    action: string;
    impact: string;
    required: boolean;
    estimatedTime: number;
}
export interface MigrationPlan {
    fromPhase: number;
    toPhase: number;
    steps: MigrationStep[];
    totalTime: number;
    breakingChanges: boolean;
    benefits: string[];
}
export interface BuilderState {
    config: Partial<AICopilotConfig>;
    validationErrors: ValidationErrors;
    appliedPresets: string[];
    buildAttempts: number;
}
export type ConfigPreset = 'basic' | 'enterprise' | 'development' | 'production' | 'compliance-gdpr' | 'compliance-hipaa' | 'high-performance' | 'secure';
export declare class ConfigValidationError extends Error {
    errors: ValidationErrors;
    warnings: string[];
    constructor(errors: ValidationErrors, warnings?: string[], message?: string);
}
export declare class MigrationError extends Error {
    step: string;
    reason: string;
    constructor(step: string, reason: string, message?: string);
}
export type ConfigKeys<T extends CopilotConfigType> = keyof T;
export type PropertyPath<T, K extends keyof T = keyof T> = K extends string ? T[K] extends object ? K | `${K}.${PropertyPath<T[K]>}` : K : never;
export type EnterpriseFeature = 'security' | 'performance' | 'memory' | 'dashboard' | 'compliance' | 'analytics';
export type FeatureConfig<T extends EnterpriseFeature> = T extends 'security' ? AICopilotConfig['enterpriseSecurity'] : T extends 'performance' ? AICopilotConfig['enterprisePerformance'] : T extends 'memory' ? AICopilotConfig['enterpriseMemory'] : T extends 'dashboard' ? AICopilotConfig['enterprise'] : never;
export declare const isValidationError: (error: any) => error is ConfigValidationError;
export declare const isMigrationError: (error: any) => error is MigrationError;
export declare const hasEnterpriseFeatures: (config: CopilotConfigType) => config is AICopilotConfig;
export declare const detectConfigPhase: (config: CopilotConfigType) => number;
