import { AICopilotConfig } from '../types';
import { ValidAICopilotConfig, ConfigPreset, BuilderState } from '../types/utils';
export declare class CopilotConfigBuilder {
    private state;
    constructor(initialConfig?: Partial<AICopilotConfig>);
    basic(name: string, slug: string, firstMessage: string): this;
    model(provider: string, model?: string): this;
    systemPrompt(prompt: string): this;
    storage(databasePath: string, embedLocation: string): this;
    description(desc: string): this;
    tools(tools: string[]): this;
    addTool(tool: string): this;
    contextSources(sources: string[]): this;
    addContextSource(source: string): this;
    persona(config: Partial<NonNullable<AICopilotConfig['persona']>>): this;
    visibility(config: Partial<NonNullable<AICopilotConfig['visibility']>>): this;
    ui(config: Partial<NonNullable<AICopilotConfig['uiConfig']>>): this;
    security(config: Partial<NonNullable<AICopilotConfig['security']>>): this;
    performance(config: Partial<NonNullable<AICopilotConfig['performance']>>): this;
    analytics(config: Partial<NonNullable<AICopilotConfig['analytics']>>): this;
    enterpriseSecurity(config: Partial<NonNullable<AICopilotConfig['enterpriseSecurity']>>): this;
    enterprisePerformance(config: Partial<NonNullable<AICopilotConfig['enterprisePerformance']>>): this;
    enterpriseMemory(config: Partial<NonNullable<AICopilotConfig['enterpriseMemory']>>): this;
    enterprise(config: Partial<NonNullable<AICopilotConfig['enterprise']>>): this;
    actions(actions: NonNullable<AICopilotConfig['actions']>): this;
    addAction(action: NonNullable<AICopilotConfig['actions']>[0]): this;
    features(config: Partial<NonNullable<AICopilotConfig['features']>>): this;
    development(config: Partial<NonNullable<AICopilotConfig['development']>>): this;
    /**
     * Explicit environment configuration method
     * Allows manual override of environment detection and configuration
     */
    environmentConfig(config: {
        framework?: 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown';
        apiKey?: string;
        model?: string;
        requireApiKey?: boolean;
        validateOnBuild?: boolean;
    }): this;
    /**
     * Auto-detects and configures environment-specific settings
     */
    autoDetectEnvironment(): this;
    /**
     * Validates environment configuration
     */
    validateEnvironment(): this;
    /**
     * Requires API key to be present (throws on build if missing)
     */
    requireApiKey(): this;
    /**
     * Sets up framework-specific configuration
     */
    frameworkSpecific(framework?: 'nextjs' | 'vite' | 'auto'): this;
    preset(type: ConfigPreset): this;
    private basicPreset;
    private enterprisePreset;
    private developmentPreset;
    private productionPreset;
    private gdprPreset;
    private hipaaPreset;
    private highPerformancePreset;
    private securePreset;
    private sanitizeSlug;
    private applyDefaults;
    private validateBasic;
    build(): ValidAICopilotConfig;
    tryBuild(): {
        success: boolean;
        config?: ValidAICopilotConfig;
        errors?: string[];
    };
    getState(): BuilderState;
    reset(): this;
    clone(): CopilotConfigBuilder;
}
export declare const createCopilotConfig: (initialConfig?: Partial<AICopilotConfig>) => CopilotConfigBuilder;
export declare const createBasicConfig: (name: string, message: string) => CopilotConfigBuilder;
export declare const createEnterpriseConfig: (name: string, message: string) => CopilotConfigBuilder;
export declare const createDevelopmentConfig: (name: string, message: string) => CopilotConfigBuilder;
export declare const createProductionConfig: (name: string, message: string) => CopilotConfigBuilder;
export declare const createSecureConfig: (name: string, message: string) => CopilotConfigBuilder;
export declare const createHighPerformanceConfig: (name: string, message: string) => CopilotConfigBuilder;
export declare const createComplianceConfig: (name: string, message: string, framework: "gdpr" | "hipaa") => CopilotConfigBuilder;
