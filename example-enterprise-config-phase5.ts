import { AICopilotConfig } from './src/types'

/**
 * Phase 5 Enterprise AI Copilot Configuration Example
 * 
 * This configuration demonstrates all the advanced enterprise features
 * introduced in Phase 5, including:
 * 
 * - Multi-scope memory management with encryption and sync
 * - Advanced security policies and threat detection
 * - Real-time performance monitoring and analytics
 * - Enterprise dashboard with real-time updates
 * - Compliance framework integration (GDPR, HIPAA, SOX, PCI)
 * - Advanced webhook system with reliability features
 * - SSO and API management
 */

export const enterprisePhase5Config: AICopilotConfig = {
  // Core Configuration
  name: "Enterprise AI Assistant",
  slug: "enterprise-ai-assistant",
  description: "Advanced AI copilot with enterprise-grade security, performance monitoring, and compliance features",
  firstMessage: "Welcome to your enterprise AI assistant. I'm equipped with advanced security monitoring, multi-scope memory, and real-time analytics to provide you with secure and intelligent assistance.",
  databasePath: "/secure/enterprise/copilot.db",
  embedLocation: "#enterprise-copilot-container",
  
  // AI Configuration
  modelProvider: "anthropic",
  model: "claude-3-sonnet-20240229",
  systemPrompt: `You are an enterprise-grade AI assistant with advanced security awareness and compliance knowledge. 

Key Responsibilities:
- Maintain strict data confidentiality and security protocols
- Follow enterprise compliance guidelines (GDPR, HIPAA, SOX, PCI)
- Provide accurate, contextual assistance while protecting sensitive information
- Monitor and report suspicious activities or policy violations
- Assist with enterprise workflows while maintaining audit trails

Security Guidelines:
- Never store or transmit sensitive data without encryption
- Always validate user permissions before accessing restricted information
- Report potential security threats or policy violations immediately
- Maintain detailed audit logs of all interactions
- Use appropriate data classification levels for all information handling

You have access to advanced enterprise features including multi-scope memory, real-time performance monitoring, and comprehensive security policies.`,

  // Enterprise Security Configuration
  enterpriseSecurity: {
    enabled: true,
    threatDetection: {
      enabled: true,
      sensitivity: "high",
      realTimeMonitoring: true
    },
    policies: {
      dataAccess: [
        "executives",
        "security-team",
        "compliance-officers",
        "authorized-analysts"
      ],
      userPermissions: {
        "admin": ["full-access", "security-config", "audit-logs", "user-management"],
        "security-officer": ["security-config", "audit-logs", "threat-analysis"],
        "compliance-officer": ["audit-logs", "compliance-reports", "policy-management"],
        "analyst": ["data-analysis", "basic-queries", "report-generation"],
        "user": ["basic-queries", "conversation-history"]
      },
      complianceFramework: ["gdpr", "hipaa", "sox", "pci"]
    },
    audit: {
      enabled: true,
      retention: 2555, // 7 years for compliance
      realTimeAlerts: true
    },
    piiProtection: {
      enabled: true,
      autoDetection: true,
      maskingRules: [
        "credit-card-masking",
        "ssn-encryption",
        "email-partial-masking",
        "phone-number-masking"
      ]
    }
  },

  // Enterprise Performance Configuration
  enterprisePerformance: {
    monitoring: {
      enabled: true,
      metricsCollection: true,
      realTimeDashboard: true
    },
    optimization: {
      enabled: true,
      autoScaling: true,
      caching: true
    },
    alerts: {
      enabled: true,
      thresholds: {
        responseTime: 500, // 500ms max response time
        errorRate: 0.01, // 1% max error rate
        resourceUsage: 0.75 // 75% max resource usage
      }
    },
    analytics: {
      enabled: true,
      userJourneyTracking: true,
      customMetrics: true
    }
  },

  // Enterprise Memory Configuration
  enterpriseMemory: {
    scopes: {
      enabled: ["session", "user", "organization", "global"],
      default: "organization"
    },
    encryption: {
      enabled: true,
      algorithm: "AES-256-GCM"
    },
    synchronization: {
      enabled: true,
      crossDevice: true,
      conflictResolution: "manual" // Manual review for enterprise data
    },
    retention: {
      policies: {
        session: { 
          maxAge: 8 * 60 * 60 * 1000, // 8 hours
          maxSize: 100 * 1024 * 1024 // 100MB
        },
        user: { 
          maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
          maxSize: 500 * 1024 * 1024 // 500MB
        },
        organization: { 
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
          maxSize: 10 * 1024 * 1024 * 1024 // 10GB
        },
        global: { 
          maxAge: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years (compliance)
          maxSize: 100 * 1024 * 1024 * 1024 // 100GB
        }
      },
      compression: true
    }
  },

  // Enterprise Features
  enterprise: {
    dashboard: {
      enabled: true,
      realTimeUpdates: true,
      customWidgets: true
    },
    reporting: {
      enabled: true,
      schedule: "daily",
      recipients: [
        "security@company.com",
        "compliance@company.com",
        "cto@company.com"
      ]
    },
    integrations: {
      webhooks: [
        {
          id: "security-alerts",
          url: "https://security.company.com/webhooks/copilot-alerts",
          events: ["threat-detected", "policy-violation", "compliance-issue"],
          secret: "secure-webhook-secret-key",
          enabled: true,
          retryPolicy: {
            maxRetries: 5,
            backoffMs: 2000
          }
        },
        {
          id: "performance-metrics",
          url: "https://monitoring.company.com/webhooks/copilot-metrics",
          events: ["performance-alert", "threshold-exceeded", "optimization-recommended"],
          secret: "performance-webhook-secret",
          enabled: true,
          retryPolicy: {
            maxRetries: 3,
            backoffMs: 1000
          }
        },
        {
          id: "audit-events",
          url: "https://compliance.company.com/webhooks/audit-trail",
          events: ["audit-event", "access-granted", "data-modified"],
          secret: "audit-webhook-secret",
          enabled: true,
          retryPolicy: {
            maxRetries: 10,
            backoffMs: 5000
          }
        }
      ],
      sso: {
        enabled: true,
        provider: "oauth",
        settings: {
          clientId: "enterprise-copilot-client",
          authorizationUrl: "https://auth.company.com/oauth/authorize",
          tokenUrl: "https://auth.company.com/oauth/token",
          userInfoUrl: "https://auth.company.com/oauth/userinfo",
          scopes: ["openid", "profile", "email", "copilot:access"],
          roleMapping: {
            "admin": ["copilot:admin", "security:full"],
            "security-officer": ["copilot:security", "audit:read"],
            "user": ["copilot:basic"]
          }
        }
      },
      api: {
        enabled: true,
        version: "2.0.0",
        rateLimit: {
          requests: 10000,
          window: 3600 // 1 hour
        },
        authentication: {
          required: true,
          methods: ["bearer", "oauth"]
        }
      }
    },
    compliance: {
      enabled: true,
      frameworks: ["gdpr", "hipaa", "sox", "pci"],
      autoRemediation: false // Manual review required for enterprise
    }
  },

  // Enhanced UI Configuration
  uiConfig: {
    theme: "auto",
    showAvatar: true,
    floatingButton: false,
    layout: "sidebar"
  },

  // Advanced Onboarding
  onboardingSteps: [
    {
      stepId: "security-briefing",
      message: "Welcome to the enterprise AI assistant. This system is equipped with advanced security monitoring and compliance features. All interactions are logged and monitored for security purposes.",
      fieldToCollect: "acknowledgment"
    },
    {
      stepId: "role-verification",
      message: "Please confirm your role and department for proper access control and data classification.",
      fieldToCollect: "role"
    },
    {
      stepId: "compliance-agreement",
      message: "By using this system, you agree to comply with all enterprise security policies and regulatory requirements (GDPR, HIPAA, SOX, PCI DSS).",
      fieldToCollect: "compliance_agreement"
    },
    {
      stepId: "data-classification-training",
      message: "Please review the data classification levels: Public, Internal, Confidential, Restricted, Top Secret. Always classify your queries appropriately.",
      fieldToCollect: "understanding_confirmed"
    }
  ],

  // Enterprise Actions
  actions: [
    {
      label: "Security Report",
      actionId: "generate-security-report",
      icon: "🔒",
      description: "Generate comprehensive security and threat analysis report",
      runFunction: "generateSecurityReport",
      category: "system"
    },
    {
      label: "Compliance Check",
      actionId: "run-compliance-check",
      icon: "✅",
      description: "Run comprehensive compliance verification against all frameworks",
      runFunction: "runComplianceCheck",
      category: "system"
    },
    {
      label: "Performance Analysis",
      actionId: "analyze-performance",
      icon: "📊",
      description: "Analyze system performance and generate optimization recommendations",
      runFunction: "analyzePerformance",
      category: "system"
    },
    {
      label: "Export Audit Trail",
      actionId: "export-audit-trail",
      icon: "📋",
      description: "Export detailed audit trail for compliance reporting",
      runFunction: "exportAuditTrail",
      category: "data"
    },
    {
      label: "Memory Scope Analysis",
      actionId: "analyze-memory-scopes",
      icon: "🧠",
      description: "Analyze memory usage across all scopes and optimize storage",
      runFunction: "analyzeMemoryScopes",
      category: "system"
    }
  ],

  // Enterprise Tools
  tools: [
    "semantic-search",
    "data-classification",
    "pii-detection",
    "threat-analysis",
    "compliance-checker",
    "performance-monitor",
    "audit-logger",
    "memory-optimizer"
  ],

  // Context Sources with Enhanced Security
  contextSources: [
    "secure-knowledge-base",
    "enterprise-documentation",
    "compliance-library",
    "security-policies",
    "performance-metrics",
    "audit-records"
  ],

  // Persona Configuration
  persona: {
    voiceStyle: "Professional and security-conscious",
    tone: "professional",
    emojiStyle: false, // Disabled for enterprise
    avatarUrl: "https://assets.company.com/copilot/enterprise-avatar.png"
  },

  // Visibility and Access Control
  visibility: {
    rolesAllowed: [
      "admin",
      "security-officer",
      "compliance-officer",
      "analyst",
      "executive",
      "authorized-user"
    ],
    isPublic: false
  },

  // Enhanced Security Settings
  security: {
    dataRetention: 2555, // 7 years
    encryptAtRest: true,
    auditLogging: true,
    compliance: "gdpr"
  },

  // Performance Configuration
  performance: {
    rateLimiting: {
      maxRequestsPerMinute: 100,
      maxRequestsPerHour: 5000
    },
    caching: {
      enabled: true,
      ttl: 300 // 5 minutes
    },
    streamingEnabled: true
  },

  // Analytics Configuration
  analytics: {
    trackConversations: true,
    trackActions: true,
    customEvents: [
      "security-event",
      "compliance-check",
      "performance-alert",
      "user-journey-completed",
      "data-access",
      "policy-violation"
    ],
    provider: "custom"
  },

  // Enhanced Integrations
  integrations: {
    webhooks: {
      onMessageSent: "https://analytics.company.com/webhooks/message-sent",
      onActionTriggered: "https://analytics.company.com/webhooks/action-triggered"
    },
    contextProviders: {
      "enterprise-kb": {
        apiEndpoint: "https://kb.company.com/api/v2",
        authMethod: "bearer",
        apiKey: "${ENTERPRISE_KB_TOKEN}",
        refreshInterval: 300
      },
      "security-intel": {
        apiEndpoint: "https://security.company.com/api/intelligence",
        authMethod: "oauth",
        refreshInterval: 60
      },
      "compliance-db": {
        apiEndpoint: "https://compliance.company.com/api/database",
        authMethod: "bearer",
        apiKey: "${COMPLIANCE_DB_TOKEN}",
        refreshInterval: 3600
      }
    }
  },

  // Advanced Features
  features: {
    messageReactions: true,
    conversationRating: true,
    fileUpload: {
      enabled: true,
      maxFileSize: 100, // 100MB
      allowedTypes: [".pdf", ".docx", ".xlsx", ".txt", ".csv", ".json"]
    },
    voiceInput: false, // Disabled for security
    conversationExport: true
  },

  // Development and Testing
  development: {
    mockMode: false,
    debugMode: false, // Disabled in production
    testPersonas: [] // No test personas in production
  },

  // Metadata
  metadata: {
    version: "2.0.0-enterprise",
    deploymentEnvironment: "production",
    complianceFrameworks: ["GDPR", "HIPAA", "SOX", "PCI-DSS"],
    securityClassification: "enterprise-grade",
    lastUpdated: new Date().toISOString(),
    maintainer: "Enterprise AI Team",
    supportContact: "ai-support@company.com",
    emergencyContact: "security@company.com"
  }
}

export default enterprisePhase5Config 