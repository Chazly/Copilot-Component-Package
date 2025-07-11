# Copilot Implementation Context

## Overview

The LOGENTIQ Business Intelligence Platform includes a comprehensive copilot implementation that integrates AI-powered assistants across different business functions. The implementation is built around a modular architecture that supports multiple specialized copilots for various business domains.

## Architecture Overview

### Core Components

1. **BusinessCopilot** - Main wrapper component that handles configuration and initialization
2. **CopilotProvider** - Context provider from the external copilot package
3. **CopilotChat** - Chat interface component from the external copilot package
4. **ResizableLayout** - UI layout component that provides the split-panel interface
5. **Specialized Copilots** - Domain-specific copilot implementations

### External Dependencies

- **@your-org/copilot-package** - External package providing core copilot functionality
- Located at: `file:../copilot-package` (local file dependency)

## Implementation Details

### 1. Main Business Copilot Component (`components/business-copilot.tsx`)

This is the core component that wraps the external copilot package and provides the main interface.

#### Key Features:
- **Dynamic Loading**: Uses Next.js dynamic imports to prevent SSR issues
- **Environment Variable Management**: Comprehensive handling of OpenAI API keys
- **Configuration Flexibility**: Multiple configuration strategies with fallbacks
- **Error Handling**: Graceful degradation when copilot initialization fails
- **Debug Logging**: Extensive logging for troubleshooting

#### Props Interface:
```typescript
interface BusinessCopilotProps {
  leftPanel?: React.ReactNode
  rightPanel?: React.ReactNode
  defaultLeftWidth?: number
  copilotName?: string
  copilotId?: string
  greeting?: string
}
```

#### Configuration Strategy:
The component attempts multiple configuration methods in order:
1. **environmentConfig** - Primary method with explicit API key configuration
2. **model with apiKey parameter** - Fallback method
3. **auto-detection** - Final fallback for automatic configuration

#### AI Model Configuration:
- **Target Model**: `chatgpt-4o-latest`
- **Provider**: OpenAI
- **Features**: Streaming enabled, rate limiting, conversation storage

#### System Prompt Template:
```
You are {copilotName}, an expert business intelligence assistant for the LOGENTIQ platform. 
You help users with strategic planning, operations management, financial analysis, marketing insights, 
and business optimization. You have access to comprehensive business data and can provide actionable 
insights across all business functions.
```

### 2. Specialized Copilot Implementations

#### Strategic Planning Copilot
- **Name**: "Strategic Planning Assistant"
- **ID**: "strategic-planning-assistant"
- **Greeting**: "🎯 Ready to develop your strategic plan? I can help with SWOT analysis, market research, goal setting, and strategic recommendations."
- **Default Width**: 65%

#### Operations Copilot
- **Name**: "Operations Assistant"
- **ID**: "operations-assistant"
- **Greeting**: "⚙️ Let's optimize your operations! I can help with process improvement, resource allocation, performance metrics, and operational efficiency."
- **Default Width**: 70%

#### Marketing Copilot
- **Name**: "Marketing Assistant"
- **ID**: "marketing-assistant"
- **Greeting**: "📢 Ready to boost your marketing? I can help with campaign strategies, market analysis, customer insights, and marketing optimization."
- **Default Width**: 70%

### 3. Copilot Demo Component (`components/copilot-demo.tsx`)

Provides a demonstration interface showing different copilot implementations.

#### Features:
- **Tab-based Interface**: Switch between different copilot types
- **Sample Content**: Demonstrates copilot integration with business content
- **Interactive Demo**: Shows suggested questions and use cases

#### Demo Types:
1. General Business
2. Strategic Planning
3. Operations
4. Marketing

### 4. Resizable Layout Component (`components/resizable-layout.tsx`)

Provides the split-panel interface used by all copilot implementations.

#### Features:
- **Draggable Divider**: Users can resize panels by dragging
- **Smooth Animation**: Programmatic width changes with easing
- **Constraints**: Configurable min/max widths (default: 20%-80%)
- **Responsive Design**: Works across different screen sizes

#### API:
```typescript
interface ResizableLayoutRef {
  setWidth: (width: number, animated?: boolean, duration?: number) => void
  getWidth: () => number
}
```

## Integration Points

### 1. Main Dashboard (`app/page.tsx`)
- Integrates BusinessCopilot as the main interface
- Provides business intelligence context
- Handles user authentication and business selection

### 2. Strategic Planning Page (`app/strategy/page.tsx`)
- Uses specialized Strategic Planning Copilot
- Integrates with strategic planning tools and analysis
- Manages strategic planning-specific conversations

### 3. Business Function Pages
Each business function page includes copilot integration:
- **Financial Planning**: Financial Planning Copilot
- **Marketing**: Marketing Enablement Copilot
- **Business Development**: Business Development Copilot
- **Legal Compliance**: Legal Compliance Copilot
- **Human Resources**: Human Resources Copilot
- **Information Technology**: Information Technology Copilot

## Environment Configuration

### Required Environment Variables:
- `NEXT_PUBLIC_OPENAI_API_KEY` - OpenAI API key for client-side access
- `OPENAI_API_KEY` - Server-side OpenAI API key (fallback)
- `VITE_OPENAI_API_KEY` - Vite-specific API key (fallback)

### API Key Validation:
The implementation includes comprehensive API key validation:
1. Environment variable presence check
2. Direct API call validation
3. Runtime configuration verification
4. Fallback handling for missing keys

## Error Handling and Fallbacks

### Loading States:
- **Initialization**: Spinner with copilot name
- **Component Loading**: Individual component loading indicators
- **Configuration Loading**: "Loading copilot..." message

### Error States:
- **Configuration Failure**: Shows layout without copilot functionality
- **API Key Missing**: Graceful degradation with error message
- **Network Issues**: Fallback to basic interface

### Fallback Behavior:
When copilot initialization fails, the system:
1. Logs detailed error information
2. Sets empty configuration object
3. Renders basic layout without AI functionality
4. Displays user-friendly error message

## Debug and Monitoring

### Logging Strategy:
- **Environment Debug**: Logs all environment variables with masking
- **API Call Interception**: Monitors all OpenAI API requests
- **Configuration Validation**: Logs configuration attempts and results
- **Error Tracking**: Comprehensive error logging with context

### Console Output Examples:
```
🔍 Environment Debug: {API key status}
🧪 Direct API test: {status}
🚨 CRITICAL: ACTUAL API REQUEST: {request details}
📊 Built Configuration Inspection: {config details}
```

## Performance Considerations

### Optimization Strategies:
1. **Dynamic Loading**: Prevents SSR issues and reduces initial bundle size
2. **Rate Limiting**: Configured for 10 requests/minute, 100 requests/hour
3. **Local Storage**: Conversation persistence with embeddings
4. **Streaming**: Enabled for real-time response delivery

### Bundle Management:
- Copilot components are dynamically loaded to avoid SSR issues
- Local file dependency reduces external network dependencies
- Lazy loading prevents blocking of initial page load

## Security Considerations

### API Key Management:
- Uses NEXT_PUBLIC_ prefix for client-side access
- Implements multiple fallback strategies
- Includes validation and testing mechanisms
- Logs are sanitized to prevent key exposure

### Data Storage:
- Conversations stored locally: `./copilot-data/conversations.db`
- Embeddings stored locally: `./copilot-data/embeddings`
- No sensitive data transmitted to external services beyond OpenAI

## Usage Patterns

### Basic Usage:
```typescript
import BusinessCopilot from '@/components/business-copilot'

<BusinessCopilot
  leftPanel={contentPanel}
  rightPanel={assistantPanel}
  defaultLeftWidth={70}
/>
```

### Specialized Usage:
```typescript
import { StrategicPlanningCopilot } from '@/components/business-copilot'

<StrategicPlanningCopilot leftPanel={strategicContent} />
```

### Custom Configuration:
```typescript
<BusinessCopilot
  copilotName="Custom Assistant"
  copilotId="custom-assistant"
  greeting="Custom greeting message"
  defaultLeftWidth={60}
/>
```

## Integration with Business Context

### Business Data Integration:
- Copilots are aware of selected business context
- System prompts include business intelligence context
- Responses are tailored to specific business functions

### Multi-tenant Support:
- Copilot configurations are scoped to individual businesses
- Conversation history is maintained per business context
- Personalized responses based on business data

## Future Enhancements

### Planned Features:
1. **Custom Training**: Business-specific model fine-tuning
2. **Advanced Analytics**: Copilot usage and effectiveness metrics
3. **Integration Expansion**: Additional business system integrations
4. **Voice Interface**: Voice-activated copilot interactions
5. **Mobile Optimization**: Enhanced mobile copilot experience

### Scalability Considerations:
- Modular architecture supports easy addition of new copilot types
- Configuration system allows for easy customization
- Plugin architecture for extending copilot capabilities

## Troubleshooting

### Common Issues:
1. **API Key Not Found**: Check environment variable configuration
2. **SSR Issues**: Ensure dynamic imports are properly configured
3. **Configuration Failures**: Review console logs for detailed error information
4. **Network Connectivity**: Verify OpenAI API accessibility

### Debug Steps:
1. Check browser console for detailed logging
2. Verify environment variables are properly set
3. Test API key validity with direct API calls
4. Review configuration object structure
5. Check for network connectivity issues

## Dependencies

### External Packages:
- `@your-org/copilot-package` - Core copilot functionality
- `react` - UI framework
- `next` - SSR and routing
- `lucide-react` - Icons
- `@radix-ui/*` - UI components

### Internal Dependencies:
- `components/resizable-layout.tsx` - Layout management
- `components/ui/*` - UI component library
- `hooks/use-*` - Custom React hooks
- `lib/supabase.ts` - Database integration

This implementation provides a comprehensive, production-ready copilot system that integrates seamlessly with the LOGENTIQ Business Intelligence Platform while maintaining flexibility, reliability, and excellent user experience. 