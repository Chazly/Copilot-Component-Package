# Framework-Specific Setup Guide

This guide provides detailed setup instructions for using the copilot package across different frameworks. The package now features automatic environment detection and framework-specific optimizations.

## 🎯 Quick Start (Auto-Detection)

The package automatically detects your framework and configures itself appropriately:

```typescript
import { createBasicConfig } from '@copilot/package'

const config = createBasicConfig('My Assistant', 'Hello! How can I help?')
  .model('openai', 'gpt-4')
  .autoDetectEnvironment() // 🚀 Automatic detection
  .tryBuild()
```

## 📋 Supported Frameworks

| Framework | Detection | Client-Side | Server-Side | Status |
|-----------|-----------|-------------|-------------|---------|
| Next.js | ✅ Automatic | ✅ Supported | ✅ Supported | 🟢 Full |
| Vite | ✅ Automatic | ✅ Supported | ❌ Client-only | 🟢 Full |
| Nuxt | ✅ Automatic | ✅ Supported | ✅ Supported | 🟡 Beta |
| SvelteKit | ✅ Automatic | ✅ Supported | ✅ Supported | 🟡 Beta |
| Remix | ✅ Automatic | ✅ Supported | ✅ Supported | 🟡 Beta |
| Astro | ✅ Automatic | ✅ Supported | ✅ Supported | 🟡 Beta |

---

## 🚀 Next.js Setup

### Environment Variables

**Server-side (Recommended):**
```bash
# .env.local
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_DEFAULT_MODEL=gpt-4
```

**Client-side (Public):**
```bash
# .env.local
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here
NEXT_PUBLIC_OPENAI_DEFAULT_MODEL=gpt-4
```

### Basic Configuration

```typescript
// lib/copilot-config.ts
import { createProductionConfig } from '@copilot/package'

export const copilotConfig = createProductionConfig(
  'Enterprise Assistant', 
  'Welcome to our AI assistant!'
)
  .model('openai', 'gpt-4')
  .storage('./data/copilot.db', './data/embeddings')
  .systemPrompt('You are a helpful enterprise assistant.')
  .autoDetectEnvironment()
  .requireApiKey()
  .validateEnvironment()
  .build()
```

### Component Usage

```tsx
// components/ChatInterface.tsx
import { CopilotProvider, CopilotChat } from '@copilot/package'
import { copilotConfig } from '../lib/copilot-config'

export default function ChatInterface() {
  return (
    <CopilotProvider config={copilotConfig}>
      <CopilotChat />
    </CopilotProvider>
  )
}
```

### API Route (Server-side)

```typescript
// pages/api/chat.ts or app/api/chat/route.ts
import { createOpenAIProvider } from '@copilot/package'
import { getApiKey } from '@copilot/package/env'

export async function POST(request: Request) {
  try {
    const apiKey = getApiKey() // Automatically gets from OPENAI_API_KEY
    const provider = createOpenAIProvider({ apiKey })
    
    // Your chat logic here
    const response = await provider.chat(/* ... */)
    
    return Response.json(response)
  } catch (error) {
    return Response.json({ error: 'Configuration error' }, { status: 500 })
  }
}
```

---

## ⚡ Vite Setup

### Environment Variables

```bash
# .env.local
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_DEFAULT_MODEL=gpt-4
```

### Configuration

```typescript
// src/config/copilot.ts
import { createDevelopmentConfig } from '@copilot/package'

export const copilotConfig = createDevelopmentConfig(
  'Dev Assistant',
  'Hello! I\'m your development assistant.'
)
  .model('openai', 'gpt-3.5-turbo')
  .storage('./dev-data/copilot.db', './dev-data/embeddings')
  .autoDetectEnvironment()
  .environmentConfig({
    framework: 'vite',
    validateOnBuild: true,
    requireApiKey: false // More permissive for development
  })
  .build()
```

### React Component

```tsx
// src/components/DevChat.tsx
import { CopilotProvider, CopilotChat } from '@copilot/package'
import { copilotConfig } from '../config/copilot'

export function DevChat() {
  return (
    <CopilotProvider config={copilotConfig}>
      <CopilotChat 
        theme="dark" 
        layout="sidebar"
        debugMode={true}
      />
    </CopilotProvider>
  )
}
```

---

## 🟢 Nuxt Setup

### Environment Variables

```bash
# .env
NUXT_OPENAI_API_KEY=sk-your-server-side-key
NUXT_PUBLIC_OPENAI_API_KEY=sk-your-client-side-key
NUXT_OPENAI_DEFAULT_MODEL=gpt-4
```

### Configuration

```typescript
// composables/useCopilot.ts
import { createBasicConfig } from '@copilot/package'

export const useCopilot = () => {
  const config = createBasicConfig(
    'Nuxt Assistant',
    'Bonjour! How can I assist you?'
  )
    .model('openai', 'gpt-4')
    .autoDetectEnvironment()
    .frameworkSpecific('auto')
    .build()

  return { config }
}
```

### Component

```vue
<!-- components/CopilotInterface.vue -->
<template>
  <div>
    <CopilotProvider :config="config">
      <CopilotChat />
    </CopilotProvider>
  </div>
</template>

<script setup>
import { CopilotProvider, CopilotChat } from '@copilot/package'

const { config } = useCopilot()
</script>
```

---

## 🧡 SvelteKit Setup

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-your-server-key
PUBLIC_OPENAI_API_KEY=sk-your-client-key
OPENAI_DEFAULT_MODEL=gpt-4
```

### Configuration

```typescript
// src/lib/copilot.ts
import { createBasicConfig } from '@copilot/package'

export const copilotConfig = createBasicConfig(
  'SvelteKit Assistant',
  'Hello from SvelteKit!'
)
  .model('openai', 'gpt-4')
  .autoDetectEnvironment()
  .security({ encryptAtRest: true })
  .build()
```

### Component

```svelte
<!-- src/lib/components/CopilotInterface.svelte -->
<script lang="ts">
  import { CopilotProvider, CopilotChat } from '@copilot/package'
  import { copilotConfig } from '../copilot'
</script>

<CopilotProvider config={copilotConfig}>
  <CopilotChat />
</CopilotProvider>
```

---

## 🔵 Remix Setup

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_DEFAULT_MODEL=gpt-4
```

### Configuration

```typescript
// app/config/copilot.server.ts
import { createProductionConfig } from '@copilot/package'

export const copilotConfig = createProductionConfig(
  'Remix Assistant',
  'Welcome to our Remix-powered assistant!'
)
  .model('openai', 'gpt-4')
  .autoDetectEnvironment()
  .requireApiKey()
  .build()
```

### Route Component

```tsx
// app/routes/chat.tsx
import { CopilotProvider, CopilotChat } from '@copilot/package'
import { copilotConfig } from '../config/copilot.server'

export default function ChatRoute() {
  return (
    <div className="h-screen">
      <CopilotProvider config={copilotConfig}>
        <CopilotChat />
      </CopilotProvider>
    </div>
  )
}
```

---

## 🟠 Astro Setup

### Environment Variables

```bash
# .env
VITE_OPENAI_API_KEY=sk-your-openai-api-key
VITE_OPENAI_DEFAULT_MODEL=gpt-4
```

### Configuration

```typescript
// src/config/copilot.ts
import { createBasicConfig } from '@copilot/package'

export const copilotConfig = createBasicConfig(
  'Astro Assistant',
  'Greetings from the stars! 🚀'
)
  .model('openai', 'gpt-4')
  .autoDetectEnvironment()
  .ui({ theme: 'dark' })
  .build()
```

### Component

```astro
---
// src/components/CopilotInterface.astro
import { CopilotProvider, CopilotChat } from '@copilot/package'
import { copilotConfig } from '../config/copilot'
---

<div id="copilot-container">
  <CopilotProvider config={copilotConfig} client:load>
    <CopilotChat client:load />
  </CopilotProvider>
</div>
```

---

## 🔧 Advanced Configuration

### Environment-Specific Builder

```typescript
import { createCopilotConfig, detectFramework } from '@copilot/package'

const framework = detectFramework()

const config = createCopilotConfig()
  .basic('Smart Assistant', 'smart-assistant', 'Hello!')
  .model('openai', 'gpt-4')
  .environmentConfig({
    framework,
    requireApiKey: process.env.NODE_ENV === 'production',
    validateOnBuild: true
  })

// Framework-specific optimizations
if (framework === 'nextjs') {
  config
    .performance({ streamingEnabled: true })
    .security({ encryptAtRest: true })
} else if (framework === 'vite') {
  config
    .development({ debugMode: true })
    .performance({ rateLimiting: { maxRequestsPerMinute: 30 } })
}

export const smartConfig = config.build()
```

### Custom Environment Detection

```typescript
import { createCopilotConfig } from '@copilot/package'

const config = createCopilotConfig()
  .environmentConfig({
    framework: 'nextjs', // Override detection
    apiKey: 'custom-key',
    model: 'gpt-4',
    requireApiKey: true,
    validateOnBuild: true
  })
  .basic('Custom Assistant', 'custom', 'Custom setup!')
  .build()
```

---

## 🚨 Error Handling & Troubleshooting

### Common Issues

**1. API Key Not Found**
```typescript
import { validateEnvironment } from '@copilot/package/env'

const validation = validateEnvironment()
if (!validation.isValid) {
  console.log('Environment issues:', validation.errors)
  console.log('Framework detected:', validation.framework)
}
```

**2. Framework Not Detected**
```typescript
import { detectFramework } from '@copilot/package/env'

const framework = detectFramework()
console.log('Detected framework:', framework)

// Manual override if needed
const config = createBasicConfig('Assistant', 'Hello')
  .environmentConfig({ framework: 'nextjs' })
  .build()
```

**3. Build Failures**
```typescript
const result = createProductionConfig('Assistant', 'Hello')
  .model('openai', 'gpt-4')
  .tryBuild() // Use tryBuild() instead of build() for error handling

if (!result.success) {
  console.error('Build failed:', result.errors)
} else {
  console.log('Config built successfully:', result.config)
}
```

### Environment Validation

```typescript
import { getApiKey, getDefaultModel, validateEnvironment } from '@copilot/package/env'

try {
  const apiKey = getApiKey()
  const model = getDefaultModel()
  const validation = validateEnvironment()
  
  console.log('Setup successful:', {
    apiKey: apiKey ? '✅ Found' : '❌ Missing',
    model,
    framework: validation.framework,
    isValid: validation.isValid
  })
} catch (error) {
  console.error('Setup failed:', error.message)
}
```

---

## 📝 Migration Guide

### From Hardcoded Vite to Framework-Agnostic

**Before:**
```typescript
// Old hardcoded approach
const apiKey = import.meta.env.VITE_OPENAI_API_KEY
if (!apiKey) throw new Error('API key required')
```

**After:**
```typescript
// New framework-agnostic approach
import { getApiKey } from '@copilot/package/env'

const config = createBasicConfig('Assistant', 'Hello')
  .autoDetectEnvironment() // Handles all frameworks
  .requireApiKey() // Validates automatically
  .build()
```

### Updating Existing Configurations

1. Replace hardcoded environment access with `autoDetectEnvironment()`
2. Use `environmentConfig()` for custom setups
3. Add `validateEnvironment()` for better error handling
4. Switch from `build()` to `tryBuild()` for graceful failures

---

## 🎉 Next Steps

1. **Test Your Setup**: Use the testing dashboard to verify configuration
2. **Monitor Performance**: Enable analytics for production insights
3. **Security Review**: Ensure API keys are properly scoped
4. **Documentation**: Document your specific configuration for your team

For more examples and advanced usage, check out the `/examples` directory in the package. 