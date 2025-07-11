import { AICopilotConfig } from './src/types'

/**
 * Enterprise AI Copilot Configuration Example
 * 
 * This example demonstrates all the advanced Phase 4 features:
 * - Multi-step onboarding with field collection
 * - Custom action buttons with permissions
 * - Tool execution with RAG and context sources
 * - Enterprise security and compliance settings
 * - Advanced analytics and integrations
 */
export const enterpriseConfig: AICopilotConfig = {
  // Core identification
  name: "Enterprise AI Assistant",
  slug: "enterprise-ai-assistant",
  description: "Your intelligent workplace companion with enterprise-grade security and features",
  
  // AI Configuration
  modelProvider: "local", // Using Ollama for on-premises deployment
  model: "llama2",
  systemPrompt: `You are an enterprise AI assistant with access to company knowledge and tools. 
    You help employees with research, data analysis, and workflow automation while maintaining 
    strict confidentiality and compliance standards. Always be professional, accurate, and helpful.`,
  
  // Initial user experience
  firstMessage: "Welcome! I'm your enterprise AI assistant. Let me help you get started with a quick setup.",
  databasePath: "./data/enterprise-sessions",
  embedLocation: "main-workspace",
  
  // Enterprise Security & Compliance
  security: {
    dataRetention: 90, // 90 days for compliance
    encryptAtRest: true,
    auditLogging: true,
    compliance: "gdpr" // GDPR compliance mode
  },
  
  // User onboarding flow
  onboardingSteps: [
    {
      stepId: "welcome",
      message: "Hi! I'm your new AI assistant. To provide the best help, I'd like to learn a bit about you."
    },
    {
      stepId: "collect-name",
      message: "What's your full name? This helps me personalize our interactions.",
      fieldToCollect: "name"
    },
    {
      stepId: "collect-role",
      message: "What's your role in the organization? This helps me understand what tools and information you might need.",
      fieldToCollect: "role"
    },
    {
      stepId: "collect-email",
      message: "What's your work email? I'll use this for notifications and to link your sessions.",
      fieldToCollect: "email"
    },
    {
      stepId: "completion",
      message: "Perfect! I'm now ready to assist you. I have access to company knowledge, databases, and various productivity tools. Just ask me anything!"
    }
  ],
  
  // Custom action buttons
  actions: [
    {
      label: "📊 Generate Report",
      actionId: "generate-report",
      icon: "📊",
      description: "Generate a comprehensive report from our conversation",
      runFunction: "generateReport",
      category: "content"
    },
    {
      label: "🔍 Search Knowledge Base",
      actionId: "search-kb",
      icon: "🔍", 
      description: "Search through company documentation and knowledge",
      runFunction: "searchKnowledgeBase",
      category: "data"
    },
    {
      label: "📧 Email Summary",
      actionId: "email-summary",
      icon: "📧",
      description: "Email this conversation summary to your team",
      runFunction: "emailSummary",
      category: "workflow"
    },
    {
      label: "💾 Save to Project",
      actionId: "save-to-project",
      icon: "💾",
      description: "Save insights to a specific project in your workspace",
      runFunction: "saveToProject", 
      category: "workflow"
    },
    {
      label: "🔄 Refresh Data",
      actionId: "refresh-context",
      icon: "🔄",
      description: "Refresh data from all connected sources",
      runFunction: "refreshContext",
      category: "system"
    }
  ],
  
  // Available tools
  tools: [
    "fetch-data",
    "semantic-search", 
    "query-database",
    "send-notification",
    "format-text"
  ],
  
  // Context sources for RAG
  contextSources: [
    "notion",
    "github", 
    "supabase"
  ],
  
  // Persona configuration
  persona: {
    voiceStyle: "professional yet approachable",
    tone: "professional",
    emojiStyle: true,
    avatarUrl: "/assets/ai-assistant-avatar.png"
  },
  
  // Access control
  visibility: {
    rolesAllowed: ["employee", "manager", "admin", "contractor"],
    isPublic: false
  },
  
  // UI Configuration
  uiConfig: {
    theme: "auto",
    showAvatar: true,
    floatingButton: true,
    layout: "sidebar"
  },
  
  // Performance settings
  performance: {
    rateLimiting: {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 500
    },
    caching: {
      enabled: true,
      ttl: 600 // 10 minutes
    },
    streamingEnabled: true
  },
  
  // Analytics and tracking
  analytics: {
    trackConversations: true,
    trackActions: true,
    customEvents: ["report_generated", "knowledge_searched", "email_sent"],
    provider: "mixpanel"
  },
  
  // Enterprise integrations
  integrations: {
    webhooks: {
      onMessageSent: "https://api.company.com/webhooks/copilot/message",
      onActionTriggered: "https://api.company.com/webhooks/copilot/action"
    },
    contextProviders: {
      notion: {
        apiEndpoint: "https://api.notion.com/v1/search",
        authMethod: "bearer",
        apiKey: "your-notion-api-key", // Replace with actual key
        refreshInterval: 3600 // 1 hour
      },
      github: {
        apiEndpoint: "https://api.github.com/search/repositories",
        authMethod: "bearer", 
        apiKey: "your-github-token", // Replace with actual token
        refreshInterval: 1800 // 30 minutes
      },
      supabase: {
        apiEndpoint: "https://company.supabase.co/rest/v1/knowledge_base",
        authMethod: "bearer",
        apiKey: "your-supabase-key", // Replace with actual key
        refreshInterval: 900 // 15 minutes
      }
    }
  },
  
  // Advanced features
  features: {
    messageReactions: true,
    conversationRating: true,
    fileUpload: {
      enabled: true,
      maxFileSize: 50, // 50MB for enterprise
      allowedTypes: ["pdf", "docx", "xlsx", "pptx", "txt", "md", "csv"]
    },
    voiceInput: true,
    conversationExport: true
  },
  
  // Memory and session management
  memoryScope: "user", // User-specific memory across sessions
  fallbackMessage: "I apologize, but I'm experiencing technical difficulties. Our IT team has been notified and I'll be back shortly.",
  
  // Development settings
  development: {
    mockMode: false,
    debugMode: false, // Set to true for development
    testPersonas: []
  },
  
  // Custom metadata for extensions
  metadata: {
    version: "2.0.0",
    deploymentDate: "2024-01-15",
    department: "IT",
    owner: "Digital Transformation Team",
    supportContact: "ai-support@company.com",
    customFeatures: {
      advancedAnalytics: true,
      multiLanguageSupport: true,
      customBranding: true
    }
  }
}

/**
 * Example usage with all Phase 4 components
 */
export const enterpriseUsageExample = `
import { 
  CopilotProvider, 
  CopilotChat, 
  OnboardingFlow, 
  ActionButtons, 
  FloatingCopilot,
  useTools,
  useCopilotConfig 
} from '@your-org/copilot-package'

function EnterpriseApp() {
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [onboardingData, setOnboardingData] = useState(null)
  
  // Initialize configuration
  const { config, validation } = useCopilotConfig(enterpriseConfig)
  
  // Initialize tools system
  const { 
    executeTool, 
    registerTool, 
    fetchFromContextSource,
    tools,
    isExecuting
  } = useTools(config)
  
  // Custom action handler
  const handleAction = async (actionId: string, context: any) => {
    switch (actionId) {
      case 'generate-report':
        const reportData = await executeTool('format-text', {
          text: context.messages.map(m => m.content).join('\\n'),
          format: 'markdown'
        })
        console.log('Report generated:', reportData)
        break
        
      case 'search-kb':
        const searchResults = await fetchFromContextSource('notion', context.lastMessage)
        console.log('Knowledge base results:', searchResults)
        break
        
      case 'email-summary':
        await executeTool('send-notification', {
          message: 'Conversation summary sent to your email',
          type: 'success'
        })
        break
        
      default:
        console.log('Unknown action:', actionId)
    }
  }
  
  const handleOnboardingComplete = (data: any) => {
    setOnboardingData(data)
    setShowOnboarding(false)
    
    // Track completion
    console.log('Onboarding completed:', data)
  }
  
  return (
    <CopilotProvider config={config}>
      <div className="enterprise-app">
        {showOnboarding ? (
          <OnboardingFlow
            config={config}
            onComplete={handleOnboardingComplete}
            onSkip={() => setShowOnboarding(false)}
          />
        ) : (
          <>
            {/* Main chat interface */}
            <CopilotChat 
              config={config}
              className="main-chat"
            />
            
            {/* Action buttons */}
            <ActionButtons
              config={config}
              onActionTriggered={handleAction}
              context={{ 
                user: onboardingData,
                messages: [], // Current conversation
                metadata: { session: 'enterprise-session' }
              }}
              layout="horizontal"
              size="md"
            />
            
            {/* Floating assistant for other pages */}
            <FloatingCopilot
              config={config}
              position="bottom-right"
              size="large"
            />
          </>
        )}
      </div>
    </CopilotProvider>
  )
}
` 