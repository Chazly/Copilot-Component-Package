import { CopilotConfigType, AICopilotConfig, CopilotConfig, NormalizedCopilotConfig, ConfigValidationResult } from '../types';
export declare function migrateConfig(legacyConfig: CopilotConfig): AICopilotConfig;
export declare function useCopilotConfig(initialConfig: CopilotConfigType): {
    config: NormalizedCopilotConfig;
    validation: ConfigValidationResult;
    updateConfig: (newConfig: Partial<AICopilotConfig>) => void;
    resetConfig: () => void;
    isReady: boolean;
    isLegacy: boolean;
    migrateToAI: () => void;
};
export default useCopilotConfig;
