import { CopilotConfigType } from '../types';
import { ValidationSuggestion, StrictValidationResult } from '../types/utils';
export declare class ConfigValidator {
    private validModelProviders;
    private validMemoryScopes;
    private validLayouts;
    private validThemes;
    private validCompliance;
    private validTones;
    validate<T extends CopilotConfigType>(config: T): StrictValidationResult<T>;
    private validateRequiredFields;
    private validateAIConfig;
    private validateLegacyConfig;
    private validateCrossFields;
    private validateSecurity;
    private validatePerformance;
    private generateQualitySuggestions;
    private calculateQualityScore;
    private calculateLegacyScore;
    private generateRecommendations;
    autoFix<T extends CopilotConfigType>(config: T): T;
    generateImprovementPlan<T extends CopilotConfigType>(config: T): ValidationSuggestion[];
}
export declare const configValidator: ConfigValidator;
export declare const validateConfig: <T extends CopilotConfigType>(config: T) => StrictValidationResult<T>;
export declare const autoFixConfig: <T extends CopilotConfigType>(config: T) => T;
export declare const getImprovementPlan: <T extends CopilotConfigType>(config: T) => ValidationSuggestion[];
