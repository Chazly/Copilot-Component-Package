export interface ChoiceOption {
  key: string
  text: string
}

export interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  choices?: ChoiceOption[]
}

// JSONSchema placeholder type for runtime tools
export type JSONSchema = any

// Runtime tool specification for model-native tools/function calling
export interface RuntimeTool {
  id: string
  name: string
  description?: string
  inputSchema: JSONSchema
  outputSchema?: JSONSchema
  route: string
  transport?: 'http' | 'sse'
}

// Environment detection types - Framework-agnostic environment handling
export type FrameworkType = 'nextjs' | 'vite' | 'nuxt' | 'sveltekit' | 'remix' | 'astro' | 'unknown'

export interface EnvironmentConfig {
  apiKey: string
  defaultModel?: string
  isClientSide: boolean
  framework: FrameworkType
  isProduction: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  framework: FrameworkType
  hasApiKey: boolean
  environmentInfo: {
    isClient: boolean
    isServer: boolean
    hasProcessEnv: boolean
    hasImportMeta: boolean
  }
}
  
  export interface CopilotConfig {
    title: string
    subtitle: string
    color: CopilotColor
    initialMessage: string
  }
  
  // Extended enterprise-ready configuration with Phase 5 features
  export interface AICopilotConfig {
    name: string; // Copilot display name
    slug: string; // Unique identifier (used in URLs, database keys)
    description?: string; // Short description for UI/menus
    firstMessage: string; // Initial message shown to the user
    databasePath: string; // Where session or history is stored
    embedLocation: string; // Where to render the copilot in-app (DOM id, route, etc.)
    modelProvider: "openai" | "anthropic" | "mistral" | "local" | string;
    model?: string; // Specific model, e.g., "gpt-4-turbo" or "claude-3-sonnet"
    systemPrompt: string; // Personality & role instructions
    tools?: string[]; // Tool names or IDs linked to capabilities
    contextSources?: string[]; // e.g., ["notion", "supabase", "github"]
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
      fieldToCollect?: string; // Optional field to ask user for
    }[];
    actions?: {
      label: string;
      actionId: string;
      icon?: string;
      description?: string;
      runFunction: string; // Function name or reference
      category?: 'conversation' | 'content' | 'workflow' | 'data' | 'system';
    }[];
    fallbackMessage?: string; // If the model fails or times out
    memoryScope?: "session" | "user" | "org" | "ephemeral";
    uiConfig?: {
      theme?: "dark" | "light" | "auto";
      showAvatar?: boolean;
      floatingButton?: boolean;
      layout?: "chatbox" | "sidebar" | "fullpage";
      composer?: {
        supportedElements?: ("choices" | string)[];
        onChoiceSelectBehavior?: "sendKey" | "sendText";
        multiSelect?: boolean;
        selectionLimit?: number;
        submitLabel?: string;
        sendOnSelect?: boolean; // if true, clicking a choice sends immediately; for multi-select typically false
      };
    };
    security?: {
      dataRetention?: number; // Days to keep data
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
        ttl: number; // seconds
      };
      streamingEnabled?: boolean;
    };
    toolCalls?: {
      streaming?: {
        enabled: boolean
      }
      route?: string
      transport?: 'http' | 'sse'
      toolChoice?: 'auto' | { name: string }
      debug?: boolean
    }
    analytics?: {
      trackConversations?: boolean;
      trackActions?: boolean;
      customEvents?: string[];
      provider?: "mixpanel" | "amplitude" | "custom";
    };
    integrations?: {
      webhooks?: {
        onMessageSent?: string; // URL
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
        maxFileSize: number; // MB
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
    metadata?: Record<string, any>; // Optional space for future extensions
    
    // Phase 5 Enterprise Features
    enterpriseSecurity?: EnterpriseSecurityConfig;
    enterprisePerformance?: EnterprisePerformanceConfig;
    enterpriseMemory?: EnterpriseMemoryConfig;
    enterprise?: EnterpriseFeaturesConfig;
  }
  
  export type CopilotColor = 
    | "blue" 
    | "green" 
    | "purple" 
    | "emerald" 
    | "cyan" 
    | "amber" 
    | "teal" 
    | "slate" 
    | "indigo"
  
  // Union type for backward compatibility
  export type CopilotConfigType = CopilotConfig | AICopilotConfig;

  // Type guards
  export function isAICopilotConfig(config: CopilotConfigType): config is AICopilotConfig {
    return 'slug' in config && 'modelProvider' in config && 'systemPrompt' in config;
  }

  export function isLegacyCopilotConfig(config: CopilotConfigType): config is CopilotConfig {
    return 'title' in config && 'subtitle' in config && 'color' in config;
  }

  // Configuration validation result
  export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }

  // Normalized configuration (internal use)
  export interface NormalizedCopilotConfig {
    // Core properties (always present)
    name: string;
    slug: string;
    description: string;
    firstMessage: string;
    databasePath: string;
    embedLocation: string;
    modelProvider: string;
    systemPrompt: string;
    
    // Optional properties with defaults
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
    toolCalls?: AICopilotConfig['toolCalls'];
    analytics: Required<NonNullable<AICopilotConfig['analytics']>>;
    integrations: Required<NonNullable<AICopilotConfig['integrations']>>;
    features: Required<NonNullable<AICopilotConfig['features']>>;
    development: Required<NonNullable<AICopilotConfig['development']>>;
    metadata: Record<string, any>;
    
    // Legacy compatibility
    isLegacyConfig: boolean;
    legacyConfig?: CopilotConfig;
  }

  // Updated props interfaces
  export interface CopilotChatProps {
    config: CopilotConfigType
    onSendMessage?: (message: string) => Promise<string> | string
    className?: string
    tools?: RuntimeTool[]
    context?: string | (() => Promise<string> | string)
    toolContext?: { businessId?: string; userId?: string; sessionId?: string } | (() => Promise<{ businessId?: string; userId?: string; sessionId?: string } | undefined> | { businessId?: string; userId?: string; sessionId?: string })
  }

  export interface ResizableLayoutProps {
    leftPanel: any // React component or element
    rightPanel: any // React component or element  
    defaultLeftWidth?: number // Percentage (0-100)
    minLeftWidth?: number // Percentage (0-100)
    maxLeftWidth?: number // Percentage (0-100)
    className?: string
  }

  // Configuration context types
  export interface CopilotContextValue {
    config: NormalizedCopilotConfig;
    validation: ConfigValidationResult;
    updateConfig: (newConfig: Partial<AICopilotConfig>) => void;
    resetConfig: () => void;
    isReady: boolean;
    // Runtime extensions
    runtimeTools?: RuntimeTool[];
    getContext?: () => Promise<string> | string;
    getToolContext?: () => Promise<{ businessId?: string; userId?: string; sessionId?: string } | undefined> | { businessId?: string; userId?: string; sessionId?: string };
  }
  
  // Phase 5 type definitions for new enterprise features
  export interface EnterpriseSecurityConfig {
    enabled: boolean
    threatDetection: {
      enabled: boolean
      sensitivity: 'low' | 'medium' | 'high' | 'paranoid'
      realTimeMonitoring: boolean
    }
    policies: {
      dataAccess: string[]
      userPermissions: Record<string, string[]>
      complianceFramework: ('gdpr' | 'hipaa' | 'sox' | 'pci')[]
    }
    audit: {
      enabled: boolean
      retention: number // days
      realTimeAlerts: boolean
    }
    piiProtection: {
      enabled: boolean
      autoDetection: boolean
      maskingRules: string[]
    }
  }
  
  export interface EnterprisePerformanceConfig {
    monitoring: {
      enabled: boolean
      metricsCollection: boolean
      realTimeDashboard: boolean
    }
    optimization: {
      enabled: boolean
      autoScaling: boolean
      caching: boolean
    }
    alerts: {
      enabled: boolean
      thresholds: {
        responseTime: number
        errorRate: number
        resourceUsage: number
      }
    }
    analytics: {
      enabled: boolean
      userJourneyTracking: boolean
      customMetrics: boolean
    }
  }
  
  export interface EnterpriseMemoryConfig {
    scopes: {
      enabled: ('session' | 'user' | 'organization' | 'global' | 'ephemeral')[]
      default: 'user' | 'session' | 'organization'
    }
    encryption: {
      enabled: boolean
      algorithm: 'AES-256-GCM' | 'AES-128-GCM'
    }
    synchronization: {
      enabled: boolean
      crossDevice: boolean
      conflictResolution: 'last-write-wins' | 'manual' | 'merge'
    }
    retention: {
      policies: Record<string, { maxAge: number; maxSize: number }>
      compression: boolean
    }
  }
  
  export interface EnterpriseFeaturesConfig {
    dashboard: {
      enabled: boolean
      realTimeUpdates: boolean
      customWidgets: boolean
    }
    reporting: {
      enabled: boolean
      schedule: 'daily' | 'weekly' | 'monthly'
      recipients: string[]
    }
    integrations: {
      webhooks: WebhookConfig[]
      sso: SSOConfig
      api: APIConfig
    }
    compliance: {
      enabled: boolean
      frameworks: string[]
      autoRemediation: boolean
    }
  }

  // New Phase 5 interface exports
  export interface WebhookConfig {
    id: string
    url: string
    events: string[]
    secret?: string
    enabled: boolean
    retryPolicy: {
      maxRetries: number
      backoffMs: number
    }
  }

  export interface SSOConfig {
    enabled: boolean
    provider: 'oauth' | 'saml' | 'oidc'
    settings: Record<string, any>
  }

  export interface APIConfig {
    enabled: boolean
    version: string
    rateLimit: {
      requests: number
      window: number // seconds
    }
    authentication: {
      required: boolean
      methods: ('apikey' | 'bearer' | 'oauth')[]
    }
  }

  // Re-export Phase 5 types (excluding conflicting ones)
  export * from './memory'
  export type { 
    SecurityPolicy, 
    SecurityEvent, 
    AuditTrail, 
    ComplianceReport,
    SecurityDashboardMetrics,
    ThreatSummary,
    PIIDetectionResult,
    DataClassification,
    SecurityHookResult
  } from './security'
  export * from './performance'