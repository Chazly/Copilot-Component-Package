# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the copilot package, especially related to environment detection and framework compatibility.

## 🚨 Quick Diagnostics

Run this diagnostic script to quickly identify issues:

```typescript
import { 
  detectFramework, 
  getApiKey, 
  getDefaultModel, 
  validateEnvironment 
} from '@copilot/package/env'

// Quick diagnostic function
export function runDiagnostics() {
  console.log('🔍 Running Environment Diagnostics...\n')
  
  try {
    // Framework Detection
    const framework = detectFramework()
    console.log(`✅ Framework detected: ${framework}`)
    
    // API Key Check
    try {
      const apiKey = getApiKey()
      console.log(`✅ API Key found: ${apiKey.substring(0, 8)}...`)
    } catch (error) {
      console.log(`❌ API Key issue: ${error.message}`)
    }
    
    // Default Model Check
    try {
      const model = getDefaultModel()
      console.log(`✅ Default model: ${model}`)
    } catch (error) {
      console.log(`⚠️  Using fallback model: ${error.message}`)
    }
    
    // Full Environment Validation
    const validation = validateEnvironment()
    console.log(`\n📋 Environment Validation:`)
    console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}`)
    console.log(`  Framework: ${validation.framework}`)
    console.log(`  Has API Key: ${validation.hasApiKey ? '✅' : '❌'}`)
    console.log(`  Client-side: ${validation.environmentInfo.isClient ? '✅' : '❌'}`)
    console.log(`  Server-side: ${validation.environmentInfo.isServer ? '✅' : '❌'}`)
    
    if (validation.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`)
      validation.warnings.forEach(warning => console.log(`  - ${warning}`))
    }
    
    if (validation.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      validation.errors.forEach(error => console.log(`  - ${error}`))
    }
    
  } catch (error) {
    console.error('💥 Critical error during diagnostics:', error)
  }
}

// Usage: runDiagnostics()
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "OpenAI API key not found"

**Symptoms:**
```
Error: OpenAI API key not found. Add one of the following to your environment:

For Next.js:
  Server-side: OPENAI_API_KEY=your-key-here
  Client-side: NEXT_PUBLIC_OPENAI_API_KEY=your-key-here
```

**Solutions:**

**A. Check Environment File Location**
```bash
# Next.js - should be in project root
.env.local

# Vite - should be in project root  
.env.local

# Other frameworks
.env
```

**B. Verify Variable Names**
```bash
# ✅ Correct patterns by framework
# Next.js (server)
OPENAI_API_KEY=sk-...

# Next.js (client)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Vite
VITE_OPENAI_API_KEY=sk-...

# Nuxt
NUXT_OPENAI_API_KEY=sk-...
NUXT_PUBLIC_OPENAI_API_KEY=sk-...

# SvelteKit
OPENAI_API_KEY=sk-...
PUBLIC_OPENAI_API_KEY=sk-...

# ❌ Common mistakes
OPENAI_KEY=sk-...        # Missing _API_
REACT_APP_OPENAI_KEY=sk-... # Wrong prefix
```

**C. Restart Development Server**
```bash
# Environment variables require restart
npm run dev
# or
yarn dev
```

**D. Manual Override (Temporary)**
```typescript
import { createBasicConfig } from '@copilot/package'

const config = createBasicConfig('Assistant', 'Hello')
  .environmentConfig({
    apiKey: 'sk-your-key-here', // Manual override
    validateOnBuild: false // Skip validation
  })
  .build()
```

---

### Issue 2: "Framework detected as 'unknown'"

**Symptoms:**
```
Framework detected: unknown
Configuration may not be optimized for your environment
```

**Solutions:**

**A. Manual Framework Override**
```typescript
import { createBasicConfig } from '@copilot/package'

const config = createBasicConfig('Assistant', 'Hello')
  .environmentConfig({
    framework: 'nextjs', // Manual override
    validateOnBuild: true
  })
  .build()
```

**B. Check Framework Indicators**
```typescript
// Debug framework detection
console.log('Debug info:', {
  hasWindow: typeof window !== 'undefined',
  hasNextData: typeof window !== 'undefined' && !!(window as any).__NEXT_DATA__,
  hasImportMeta: !!(globalThis as any).import?.meta,
  processEnv: typeof process !== 'undefined' ? Object.keys(process.env).slice(0, 5) : 'none'
})
```

**C. Framework-Specific Fixes**

**Next.js:**
```typescript
// Ensure Next.js detection works
if (typeof window !== 'undefined') {
  // Client-side - should have __NEXT_DATA__
  console.log('Next.js client data:', !!(window as any).__NEXT_DATA__)
} else {
  // Server-side - should have NEXT_RUNTIME
  console.log('Next.js runtime:', process.env.NEXT_RUNTIME)
}
```

**Vite:**
```typescript
// Vite detection relies on import.meta.env
console.log('Vite env:', {
  hasImportMeta: typeof import !== 'undefined',
  hasMetaEnv: !!(import as any).meta?.env
})
```

---

### Issue 3: Configuration Build Failures

**Symptoms:**
```
ConfigValidationError: Configuration validation failed
- name is required
- databasePath is required
```

**Solutions:**

**A. Use tryBuild() for Better Error Messages**
```typescript
const result = createBasicConfig('Assistant', 'Hello')
  .model('openai', 'gpt-4')
  .tryBuild() // Instead of .build()

if (!result.success) {
  console.error('Configuration errors:')
  result.errors?.forEach((error, i) => {
    console.error(`${i + 1}. ${error}`)
  })
} else {
  console.log('✅ Configuration built successfully')
}
```

**B. Check Required Fields**
```typescript
import { createCopilotConfig } from '@copilot/package'

const config = createCopilotConfig()
  .basic('Assistant Name', 'assistant-slug', 'First message') // ✅ All required
  .model('openai', 'gpt-4') // ✅ Required
  .storage('./data/db.sqlite', './data/embeddings') // ✅ Required
  .systemPrompt('You are a helpful assistant.') // ✅ Required
  .tryBuild()
```

**C. Incremental Building**
```typescript
const builder = createCopilotConfig()

// Test each step
let result = builder
  .basic('Test', 'test', 'Hello')
  .tryBuild()

if (!result.success) {
  console.log('Basic config failed:', result.errors)
  return
}

result = builder
  .model('openai', 'gpt-4')
  .tryBuild()

if (!result.success) {
  console.log('Model config failed:', result.errors)
  return
}

// Continue step by step...
```

---

### Issue 4: Client-Side API Key Security Warnings

**Symptoms:**
```
⚠️ API key detected in client environment. Consider using server-side configuration
```

**Solutions:**

**A. Use Server-Side Configuration (Recommended)**
```typescript
// ✅ Server-side API route (Next.js)
// pages/api/chat.ts
import { getApiKey } from '@copilot/package/env'

export default async function handler(req, res) {
  const apiKey = getApiKey() // Server-side only
  // Process chat request server-side
}
```

**B. Use Public Keys for Client-Side (If Needed)**
```bash
# Next.js - public client-side key
NEXT_PUBLIC_OPENAI_API_KEY=sk-client-key

# Vite - public client-side key  
VITE_OPENAI_API_KEY=sk-client-key
```

**C. Suppress Warnings (Not Recommended)**
```typescript
const config = createBasicConfig('Assistant', 'Hello')
  .environmentConfig({
    validateOnBuild: false // Disables security warnings
  })
  .build()
```

---

### Issue 5: Development vs Production Environment Issues

**Symptoms:**
- Works in development but fails in production
- Different behavior across environments

**Solutions:**

**A. Environment-Specific Configurations**
```typescript
const config = process.env.NODE_ENV === 'production'
  ? createProductionConfig('Prod Assistant', 'Production ready!')
      .requireApiKey()
      .validateEnvironment()
      .security({ encryptAtRest: true })
      .build()
  : createDevelopmentConfig('Dev Assistant', 'Development mode')
      .environmentConfig({ requireApiKey: false })
      .development({ debugMode: true })
      .build()
```

**B. Check Environment Variables**
```typescript
// Log environment status
console.log('Environment check:', {
  nodeEnv: process.env.NODE_ENV,
  apiKeyFound: !!process.env.OPENAI_API_KEY,
  publicApiKeyFound: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  framework: detectFramework()
})
```

**C. Production Environment File**
```bash
# Production environment setup
# .env.production (Next.js)
OPENAI_API_KEY=sk-production-key
OPENAI_DEFAULT_MODEL=gpt-4

# Ensure production env file is loaded
npm run build
npm run start
```

---

### Issue 6: Testing Environment Setup

**Symptoms:**
- Tests fail with environment errors
- Mock data not working

**Solutions:**

**A. Test Environment Setup**
```typescript
// test-setup.ts
import { withMockedEnvironment } from '@copilot/package/env'

// Mock Next.js environment for tests
export const mockNextJSEnvironment = () =>
  withMockedEnvironment('nextjs', {
    apiKey: 'sk-test-key',
    model: 'gpt-3.5-turbo'
  })

// Usage in tests
describe('Copilot Config', () => {
  it('should build in Next.js environment', async () => {
    await mockNextJSEnvironment(async () => {
      const config = createBasicConfig('Test', 'Hello')
        .autoDetectEnvironment()
        .tryBuild()
      
      expect(config.success).toBe(true)
    })
  })
})
```

**B. Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  moduleNameMapping: {
    '^@copilot/package/env$': '<rootDir>/src/lib/env.ts'
  }
}
```

---

### Issue 7: TypeScript Compilation Errors

**Symptoms:**
```
Type error: Property 'environmentConfig' does not exist
Module '"@copilot/package"' has no exported member 'detectFramework'
```

**Solutions:**

**A. Update Package Imports**
```typescript
// ✅ Correct imports
import { 
  createBasicConfig,
  createProductionConfig 
} from '@copilot/package'

import { 
  detectFramework,
  getApiKey,
  validateEnvironment 
} from '@copilot/package/env'
```

**B. TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": [
    "src/**/*",
    "node_modules/@copilot/package/dist/**/*"
  ]
}
```

---

## 🔍 Debug Tools

### Environment Inspector

```typescript
import { createEnvironmentMocker } from '@copilot/package/env'

// Test different environments
const mocker = createEnvironmentMocker()

// Test Next.js
mocker.mockNextJS({ apiKey: 'test-key' })
console.log('Next.js state:', mocker.getCurrentState())

// Test Vite
mocker.mockVite({ apiKey: 'test-key' })
console.log('Vite state:', mocker.getCurrentState())

// Restore original
mocker.restore()
```

### Configuration Validator

```typescript
import { validateEnvironment } from '@copilot/package/env'

function debugConfiguration() {
  const validation = validateEnvironment()
  
  return {
    summary: {
      framework: validation.framework,
      isValid: validation.isValid,
      hasApiKey: validation.hasApiKey,
      environment: validation.environmentInfo.isClient ? 'client' : 'server'
    },
    details: {
      warnings: validation.warnings,
      errors: validation.errors,
      environmentInfo: validation.environmentInfo
    },
    recommendations: generateRecommendations(validation)
  }
}

function generateRecommendations(validation) {
  const recommendations = []
  
  if (!validation.hasApiKey) {
    recommendations.push(`Add ${validation.framework === 'nextjs' ? 'OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY' : 'OPENAI_API_KEY'} to your environment`)
  }
  
  if (validation.framework === 'unknown') {
    recommendations.push('Consider manually setting framework with environmentConfig()')
  }
  
  if (validation.warnings.length > 0) {
    recommendations.push('Review security warnings and consider server-side configuration')
  }
  
  return recommendations
}
```

---

## 📞 Getting Help

### Support Checklist

Before seeking help, please run:

1. **Environment Diagnostics** (see top of this guide)
2. **Check Common Issues** (above sections)
3. **Try Minimal Configuration**:

```typescript
import { createBasicConfig } from '@copilot/package'

const minimal = createBasicConfig('Test', 'Hello')
  .model('openai', 'gpt-3.5-turbo')
  .storage('./test.db', './test-embeddings')
  .systemPrompt('Test assistant')
  .environmentConfig({ requireApiKey: false })
  .tryBuild()

console.log('Minimal config result:', minimal)
```

### Bug Report Template

```markdown
**Environment:**
- Framework: [Next.js/Vite/etc.]
- Node version: [18.x.x]
- Package version: [x.x.x]

**Issue Description:**
[Describe the problem]

**Diagnostic Output:**
```
[Paste output from runDiagnostics()]
```

**Configuration Code:**
```typescript
[Your configuration code]
```

**Expected vs Actual:**
- Expected: [What should happen]
- Actual: [What actually happens]
```

---

## 🎯 Best Practices

1. **Always use `tryBuild()`** instead of `build()` for production code
2. **Run diagnostics** during development setup
3. **Use environment-specific configurations** for dev/prod
4. **Test with mocked environments** for unit tests
5. **Validate API keys** server-side when possible
6. **Monitor validation warnings** in production
7. **Keep environment files** out of version control

For additional help, check the [Framework-Specific Guide](./README-Framework-Guide.md) or create an issue in the repository. 