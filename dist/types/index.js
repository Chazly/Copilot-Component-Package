// Type guards
export function isAICopilotConfig(config) {
    return 'slug' in config && 'modelProvider' in config && 'systemPrompt' in config;
}
export function isLegacyCopilotConfig(config) {
    return 'title' in config && 'subtitle' in config && 'color' in config;
}
// Re-export Phase 5 types (excluding conflicting ones)
export * from './memory';
export * from './performance';
