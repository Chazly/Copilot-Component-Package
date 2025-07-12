export interface Message {
    id: string;
    content: string;
    sender: "user" | "assistant";
    timestamp: Date;
}
export type FrameworkType = 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown';
export interface EnvironmentConfig {
    apiKey: string;
    defaultModel?: string;
    isClientSide: boolean;
    framework: FrameworkType;
    isProduction: boolean;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    framework: FrameworkType;
    hasApiKey: boolean;
    environmentInfo: {
        isClient: boolean;
        isServer: boolean;
        hasProcessEnv: boolean;
        hasImportMeta: boolean;
    };
}
export interface CopilotConfig {
    title: string;
    subtitle: string;
    color: CopilotColor;
    initialMessage: string;
}
export interface AICopilotConfig {
    name: string;
    slug: string;
    description?: string;
    firstMessage: string;
    databasePath: string;
    embedLocation: string;
    modelProvider: "openai" | "anthropic" | "mistral" | "local" | string;
    model?: string;
    systemPrompt: string;
    tools?: string[];
    contextSources?: string[];
    persona?: {
        voiceStyle?: string;
        tone?: "professional" | "casual" | "witty" | "empathetic" | "neutral";
        emojiStyle?: boolean;
        avatarUrl?: string;
    };
    visibility?: {
        rolesAllowed?: string[];
        isPublic?: boolean;
    };
    onboardingSteps?: {
        stepId: string;
        message: string;
        fieldToCollect?: string;
    }[];
    actions?: {
        label: string;
        actionId: string;
        icon?: string;
        description?: string;
        runFunction: string;
        category?: 'conversation' | 'content' | 'workflow' | 'data' | 'system';
    }[];
    fallbackMessage?: string;
    memoryScope?: "session" | "user" | "org" | "ephemeral";
    uiConfig?: {
        theme?: "dark" | "light" | "auto";
        showAvatar?: boolean;
        floatingButton?: boolean;
        layout?: "chatbox" | "sidebar" | "fullpage";
    };
    security?: {
        dataRetention?: number;
        encryptAtRest?: boolean;
        auditLogging?: boolean;
        compliance?: "gdpr" | "hipaa" | "sox" | "none";
    };
    performance?: {
        rateLimiting?: {
            maxRequestsPerMinute: number;
            maxRequestsPerHour: number;
        };
        caching?: {
            enabled: boolean;
            ttl: number;
        };
        streamingEnabled?: boolean;
    };
    analytics?: {
        trackConversations?: boolean;
        trackActions?: boolean;
        customEvents?: string[];
        provider?: "mixpanel" | "amplitude" | "custom";
    };
    integrations?: {
        webhooks?: {
            onMessageSent?: string;
            onActionTriggered?: string;
        };
        contextProviders?: {
            [key: string]: {
                apiEndpoint: string;
                authMethod: "bearer" | "apikey" | "oauth";
                apiKey?: string;
                refreshInterval?: number;
            };
        };
    };
    features?: {
        messageReactions?: boolean;
        conversationRating?: boolean;
        fileUpload?: {
            enabled: boolean;
            maxFileSize: number;
            allowedTypes: string[];
        };
        voiceInput?: boolean;
        conversationExport?: boolean;
    };
    development?: {
        mockMode?: boolean;
        debugMode?: boolean;
        testPersonas?: AICopilotConfig[];
    };
    metadata?: Record<string, any>;
    enterpriseSecurity?: EnterpriseSecurityConfig;
    enterprisePerformance?: EnterprisePerformanceConfig;
    enterpriseMemory?: EnterpriseMemoryConfig;
    enterprise?: EnterpriseFeaturesConfig;
}
export type CopilotColor = "blue" | "green" | "purple" | "emerald" | "cyan" | "amber" | "teal" | "slate" | "indigo";
export type CopilotConfigType = CopilotConfig | AICopilotConfig;
export declare function isAICopilotConfig(config: CopilotConfigType): config is AICopilotConfig;
export declare function isLegacyCopilotConfig(config: CopilotConfigType): config is CopilotConfig;
export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface NormalizedCopilotConfig {
    name: string;
    slug: string;
    description: string;
    firstMessage: string;
    databasePath: string;
    embedLocation: string;
    modelProvider: string;
    systemPrompt: string;
    model: string;
    tools: string[];
    contextSources: string[];
    persona: Required<NonNullable<AICopilotConfig['persona']>>;
    visibility: Required<NonNullable<AICopilotConfig['visibility']>>;
    onboardingSteps: NonNullable<AICopilotConfig['onboardingSteps']>;
    actions: NonNullable<AICopilotConfig['actions']>;
    fallbackMessage: string;
    memoryScope: NonNullable<AICopilotConfig['memoryScope']>;
    uiConfig: Required<NonNullable<AICopilotConfig['uiConfig']>>;
    security: Required<NonNullable<AICopilotConfig['security']>>;
    performance: Required<NonNullable<AICopilotConfig['performance']>>;
    analytics: Required<NonNullable<AICopilotConfig['analytics']>>;
    integrations: Required<NonNullable<AICopilotConfig['integrations']>>;
    features: Required<NonNullable<AICopilotConfig['features']>>;
    development: Required<NonNullable<AICopilotConfig['development']>>;
    metadata: Record<string, any>;
    isLegacyConfig: boolean;
    legacyConfig?: CopilotConfig;
}
export interface CopilotChatProps {
    config: CopilotConfigType;
    onSendMessage?: (message: string) => Promise<string> | string;
    className?: string;
}
export interface ResizableLayoutProps {
    leftPanel: any;
    rightPanel: any;
    defaultLeftWidth?: number;
    minLeftWidth?: number;
    maxLeftWidth?: number;
    className?: string;
}
export interface CopilotContextValue {
    config: NormalizedCopilotConfig;
    validation: ConfigValidationResult;
    updateConfig: (newConfig: Partial<AICopilotConfig>) => void;
    resetConfig: () => void;
    isReady: boolean;
}
export interface EnterpriseSecurityConfig {
    enabled: boolean;
    threatDetection: {
        enabled: boolean;
        sensitivity: 'low' | 'medium' | 'high' | 'paranoid';
        realTimeMonitoring: boolean;
    };
    policies: {
        dataAccess: string[];
        userPermissions: Record<string, string[]>;
        complianceFramework: ('gdpr' | 'hipaa' | 'sox' | 'pci')[];
    };
    audit: {
        enabled: boolean;
        retention: number;
        realTimeAlerts: boolean;
    };
    piiProtection: {
        enabled: boolean;
        autoDetection: boolean;
        maskingRules: string[];
    };
}
export interface EnterprisePerformanceConfig {
    monitoring: {
        enabled: boolean;
        metricsCollection: boolean;
        realTimeDashboard: boolean;
    };
    optimization: {
        enabled: boolean;
        autoScaling: boolean;
        caching: boolean;
    };
    alerts: {
        enabled: boolean;
        thresholds: {
            responseTime: number;
            errorRate: number;
            resourceUsage: number;
        };
    };
    analytics: {
        enabled: boolean;
        userJourneyTracking: boolean;
        customMetrics: boolean;
    };
}
export interface EnterpriseMemoryConfig {
    scopes: {
        enabled: ('session' | 'user' | 'organization' | 'global' | 'ephemeral')[];
        default: 'user' | 'session' | 'organization';
    };
    encryption: {
        enabled: boolean;
        algorithm: 'AES-256-GCM' | 'AES-128-GCM';
    };
    synchronization: {
        enabled: boolean;
        crossDevice: boolean;
        conflictResolution: 'last-write-wins' | 'manual' | 'merge';
    };
    retention: {
        policies: Record<string, {
            maxAge: number;
            maxSize: number;
        }>;
        compression: boolean;
    };
}
export interface EnterpriseFeaturesConfig {
    dashboard: {
        enabled: boolean;
        realTimeUpdates: boolean;
        customWidgets: boolean;
    };
    reporting: {
        enabled: boolean;
        schedule: 'daily' | 'weekly' | 'monthly';
        recipients: string[];
    };
    integrations: {
        webhooks: WebhookConfig[];
        sso: SSOConfig;
        api: APIConfig;
    };
    compliance: {
        enabled: boolean;
        frameworks: string[];
        autoRemediation: boolean;
    };
}
export interface WebhookConfig {
    id: string;
    url: string;
    events: string[];
    secret?: string;
    enabled: boolean;
    retryPolicy: {
        maxRetries: number;
        backoffMs: number;
    };
}
export interface SSOConfig {
    enabled: boolean;
    provider: 'oauth' | 'saml' | 'oidc';
    settings: Record<string, any>;
}
export interface APIConfig {
    enabled: boolean;
    version: string;
    rateLimit: {
        requests: number;
        window: number;
    };
    authentication: {
        required: boolean;
        methods: ('apikey' | 'bearer' | 'oauth')[];
    };
}
export * from './memory';
export type { SecurityPolicy, SecurityEvent, AuditTrail, ComplianceReport, SecurityDashboardMetrics, ThreatSummary, PIIDetectionResult, DataClassification, SecurityHookResult } from './security';
export * from './performance';
