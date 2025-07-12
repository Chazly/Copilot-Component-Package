import { CopilotConfig, AICopilotConfig, CopilotConfigType } from '../types';
import { MigrationPlan } from '../types/utils';
export declare class MigrationAssistant {
    /**
     * Migrate from legacy CopilotConfig to AICopilotConfig
     */
    migrateToAI(legacyConfig: CopilotConfig): AICopilotConfig;
    /**
     * Migrate any configuration to the latest phase (Phase 5)
     */
    migrateToLatest(config: CopilotConfigType): AICopilotConfig;
    /**
     * Upgrade an AI config to Phase 5 enterprise features
     */
    upgradeToPhase5(config: AICopilotConfig): AICopilotConfig;
    /**
     * Generate a comprehensive migration plan
     */
    getMigrationPlan(fromConfig: CopilotConfigType, targetPhase?: number): MigrationPlan;
    /**
     * Execute migration step by step with validation
     */
    executeMigration(config: CopilotConfigType, plan: MigrationPlan): AICopilotConfig;
    /**
     * Preview migration changes without applying them
     */
    previewMigration(config: CopilotConfigType): {
        current: CopilotConfigType;
        migrated: AICopilotConfig;
        changes: string[];
        newFeatures: string[];
    };
    /**
     * Validate migration compatibility
     */
    validateMigration(config: CopilotConfigType): {
        canMigrate: boolean;
        issues: string[];
        warnings: string[];
        recommendations: string[];
    };
    private generateSlug;
    private getDefaultAIConfig;
    private getDefaultEnterpriseSecurityConfig;
    private getDefaultEnterprisePerformanceConfig;
    private getDefaultEnterpriseMemoryConfig;
    private getDefaultEnterpriseFeaturesConfig;
    private getPhaseUpgradeStep;
    private getMigrationBenefits;
}
export declare const migrationAssistant: MigrationAssistant;
export declare const migrateToAI: (config: CopilotConfig) => AICopilotConfig;
export declare const migrateToLatest: (config: CopilotConfigType) => AICopilotConfig;
export declare const getMigrationPlan: (config: CopilotConfigType, targetPhase?: number) => MigrationPlan;
export declare const previewMigration: (config: CopilotConfigType) => {
    current: CopilotConfigType;
    migrated: AICopilotConfig;
    changes: string[];
    newFeatures: string[];
};
export declare const validateMigration: (config: CopilotConfigType) => {
    canMigrate: boolean;
    issues: string[];
    warnings: string[];
    recommendations: string[];
};
