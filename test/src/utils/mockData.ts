// Simple types for testing environment
interface CopilotConfig {
  title: string
  subtitle: string
  color: string
  initialMessage: string
}

interface AICopilotConfig {
  name: string
  slug: string
  description?: string
  firstMessage: string
  databasePath: string
  embedLocation: string
  modelProvider: string
  model?: string
  systemPrompt: string
  tools?: string[]
  contextSources?: string[]
  persona?: any
  visibility?: any
  uiConfig?: {
    theme?: string
    showAvatar?: boolean
    floatingButton?: boolean
    layout?: string
  }
  security?: any
  performance?: any
  enterpriseSecurity?: any
  enterprisePerformance?: any
  enterpriseMemory?: any
  [key: string]: any // Allow additional properties for testing
}

// Mock Legacy Configuration
export const mockLegacyConfig: CopilotConfig = {
  title: "Customer Support Bot",
  subtitle: "How can we help you today?",
  color: "blue",
  initialMessage: "Hello! I'm here to help with any questions you have about our services."
}

// Mock AI Configuration
export const mockAIConfig: AICopilotConfig = {
  name: "AI Assistant Pro",
  slug: "ai-assistant-pro",
  description: "Advanced AI assistant with enterprise features",
  firstMessage: "Welcome! I'm your AI assistant. I can help with questions, analysis, and tasks.",
  databasePath: "/tmp/copilot-test",
  embedLocation: "#copilot-container",
  modelProvider: "openai",
  model: "gpt-4-turbo",
  systemPrompt: "You are a helpful, professional AI assistant focused on providing accurate and useful information.",
  tools: ["web_search", "calculator", "file_reader"],
  contextSources: ["knowledge_base", "documentation"],
  persona: {
    voiceStyle: "professional",
    tone: "empathetic",
    emojiStyle: true,
    avatarUrl: undefined
  },
  visibility: {
    rolesAllowed: ["admin", "user"],
    isPublic: false
  },
  uiConfig: {
    theme: "light",
    showAvatar: true,
    floatingButton: false,
    layout: "chatbox"
  },
  security: {
    dataRetention: 30,
    encryptAtRest: true,
    auditLogging: true,
    compliance: "gdpr"
  },
  performance: {
    rateLimiting: {
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 100
    },
    caching: {
      enabled: true,
      ttl: 300
    },
    streamingEnabled: true
  }
}

// Mock configurations for different themes
export const mockThemeConfigs: Record<string, CopilotConfig> = {
  blue: { ...mockLegacyConfig, color: "blue", title: "Blue Theme" },
  green: { ...mockLegacyConfig, color: "green", title: "Green Theme" },
  purple: { ...mockLegacyConfig, color: "purple", title: "Purple Theme" },
  emerald: { ...mockLegacyConfig, color: "emerald", title: "Emerald Theme" },
  cyan: { ...mockLegacyConfig, color: "cyan", title: "Cyan Theme" },
  amber: { ...mockLegacyConfig, color: "amber", title: "Amber Theme" },
  teal: { ...mockLegacyConfig, color: "teal", title: "Teal Theme" },
  slate: { ...mockLegacyConfig, color: "slate", title: "Slate Theme" },
  indigo: { ...mockLegacyConfig, color: "indigo", title: "Indigo Theme" }
}

// Mock response functions
export const mockResponses = {
  basic: async (message: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
    
    const responses = [
      `I understand you said: "${message}". How can I help you further?`,
      `That's an interesting point about "${message}". Let me elaborate on that.`,
      `Thank you for your message about "${message}". Here's what I think:`,
      `Regarding "${message}", I'd like to provide you with some helpful information.`,
      `I see you mentioned "${message}". Let me help you with that topic.`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  },

  ai: async (message: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
    
    if (message.toLowerCase().includes('error')) {
      throw new Error('Simulated AI service error')
    }
    
    const aiResponses = [
      `🤖 Analyzing your query: "${message}"\n\nBased on my understanding, here are some key insights:\n\n• This appears to be a ${message.length > 50 ? 'complex' : 'straightforward'} question\n• I can provide detailed information on this topic\n• Would you like me to elaborate on any specific aspect?`,
      `✨ Great question about "${message}"!\n\nI've processed your request and here's my analysis:\n\n1. Understanding your needs\n2. Gathering relevant information\n3. Providing actionable insights\n\nWhat specific aspect would you like me to focus on?`,
      `💡 I see you're asking about "${message}". This is a fascinating topic!\n\nHere's what I can tell you:\n\n• Comprehensive analysis available\n• Multiple perspectives to consider\n• Practical applications exist\n\nShall we dive deeper into any particular area?`
    ]
    
    return aiResponses[Math.floor(Math.random() * aiResponses.length)]
  },

  error: async (message: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    throw new Error('This is a test error response')
  },

  slow: async (message: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 5000))
    return `After careful consideration of "${message}", here's my response (this was a slow response test).`
  }
}

// Mock enterprise configuration
export const mockEnterpriseConfig: AICopilotConfig = {
  ...mockAIConfig,
  name: "Enterprise Assistant",
  slug: "enterprise-assistant",
  enterpriseSecurity: {
    enabled: true,
    threatDetection: {
      enabled: true,
      sensitivity: 'medium',
      realTimeMonitoring: true
    },
    policies: {
      dataAccess: ['read', 'write'],
      userPermissions: {
        admin: ['all'],
        user: ['read', 'chat']
      },
      complianceFramework: ['gdpr', 'hipaa']
    },
    audit: {
      enabled: true,
      retention: 365,
      realTimeAlerts: true
    },
    piiProtection: {
      enabled: true,
      autoDetection: true,
      maskingRules: ['email', 'phone', 'ssn']
    }
  },
  enterprisePerformance: {
    monitoring: {
      enabled: true,
      metricsCollection: true,
      realTimeDashboard: true
    },
    optimization: {
      enabled: true,
      autoScaling: false,
      caching: true
    },
    alerts: {
      enabled: true,
      thresholds: {
        responseTime: 1000,
        errorRate: 0.05,
        resourceUsage: 0.8
      }
    },
    analytics: {
      enabled: true,
      userJourneyTracking: true,
      customMetrics: true
    }
  },
  enterpriseMemory: {
    scopes: {
      enabled: ['session', 'user', 'organization'],
      default: 'user'
    },
    encryption: {
      enabled: true,
      algorithm: 'AES-256-GCM'
    },
    synchronization: {
      enabled: true,
      crossDevice: true,
      conflictResolution: 'last-write-wins'
    },
    retention: {
      policies: {
        session: { maxAge: 24 * 60 * 60 * 1000, maxSize: 50 * 1024 * 1024 },
        user: { maxAge: 30 * 24 * 60 * 60 * 1000, maxSize: 200 * 1024 * 1024 },
        organization: { maxAge: 90 * 24 * 60 * 60 * 1000, maxSize: 1024 * 1024 * 1024 }
      },
      compression: true
    }
  }
} 