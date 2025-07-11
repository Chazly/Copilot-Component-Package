# OpenAI Integration Setup Guide

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env.local` file in your project root:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Model Configuration
OPENAI_DEFAULT_MODEL=chatgpt-4o-latest
OPENAI_FALLBACK_MODEL=gpt-4.1-2025-04-14
```

### 2. Available Models

The integration supports all your requested OpenAI models:

- `o4-mini-2025-04-16` (o4 mini)
- `o3-pro-2025-06-10` (o3 pro)
- `gpt-4.1-2025-04-14` (gpt 4.1) - **fallback default**
- `gpt-4o-audio-preview-2025-06-03` (gpt audio in/out)
- `chatgpt-4o-latest` (gpt 4o latest) - **primary default**
- `gpt-4o-mini-2024-07-18` (gpt 4o mini)
- `o4-mini-deep-research-2025-06-26` (gpt o4 mini deep research)
- `o3-deep-research-2025-06-26` (gpt o3 deep research)
- `gpt-4o-realtime-preview-2025-06-03` (gpt 4o real-time)
- `gpt-4o-mini-realtime-preview-2024-12-17` (gpt 4o mini real-time)
- `gpt-4o-transcribe` (gpt 4o transcribe)
- `gpt-4o-mini-transcribe` (gpt-4o-mini-transcribe)

### 3. Testing the Integration

1. **Set your API key** in `.env.local` (can't be committed to git)
2. **Run the test environment**:
   ```bash
   npm run test:start
   # or
   ./start-testing.sh
   ```
3. **Navigate to the OpenAI Provider Test** section in the dashboard
4. **Send a test message** like "Hello" to verify the integration

### 4. Usage Example

```typescript
import { createCopilotConfig, CopilotProvider, CopilotChat } from 'copilot-package'

const config = createCopilotConfig()
  .basic('AI Assistant', 'ai-assistant', 'Hello! How can I help you?')
  .storage('/tmp/copilot.db', 'chat-container')
  .model('openai', 'chatgpt-4o-latest')
  .systemPrompt('You are a helpful AI assistant.')
  .performance({
    streamingEnabled: true,
    rateLimiting: {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 500
    }
  })
  .build()

function MyApp() {
  return (
    <CopilotProvider config={config}>
      <CopilotChat config={config} />
    </CopilotProvider>
  )
}
```

## 🔧 Configuration Options

### Provider Registration

The OpenAI provider is automatically registered when you import the package:

```typescript
// All models available as:
// 'openai' - uses default model (chatgpt-4o-latest)
// 'openai:chatgpt-4o-latest'
// 'openai:gpt-4.1-2025-04-14'
// 'openai:gpt-4o-mini-2024-07-18'
// etc.
```

### Custom Configuration

```typescript
import { createOpenAIConfig } from 'copilot-package'

const customConfig = createOpenAIConfig('gpt-4o-mini-2024-07-18')
// Returns a configured CustomProvider instance
```

## 📋 Next Steps

1. **Test with your API key** - Verify the integration works
2. **Choose your models** - Select which models to use by default
3. **Configure rate limits** - Set appropriate limits for your use case
4. **Add model dropdown** - Once confirmed working, we can add UI for model selection

## 🐛 Troubleshooting

### Common Issues

1. **"Missing API key"** - Make sure `OPENAI_API_KEY` is set in your `.env.local`
2. **"Model not found"** - Ensure the model name matches exactly (case sensitive)
3. **Rate limit errors** - Check your OpenAI account limits and adjust rate limiting
4. **Network errors** - Verify your internet connection and API endpoint access

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

The console will show detailed provider requests and responses. 