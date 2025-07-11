# Storage Configuration Guide

## Overview
The copilot package requires two essential storage configurations:
- **`databasePath`**: Where conversation sessions and data are stored
- **`embedLocation`**: Where the copilot UI should be rendered in your application

## Builder API

### `.storage(databasePath, embedLocation)`

Configure both storage settings in one call:

```typescript
import { createCopilotConfig } from '@your-org/copilot-package'

const config = createCopilotConfig()
  .basic('Assistant', 'assistant', 'Hello!')
  .model('openai', 'gpt-4')
  .systemPrompt('You are a helpful assistant.')
  .storage('./data/conversations.db', '#copilot-container')  // ← Required
  .build()
```

## Configuration Parameters

### Database Path (`databasePath`)
**Purpose**: Specifies where conversation sessions, chat history, and user data are stored.

**Common Patterns**:
```typescript
// Local development
.storage('./data/copilot.db', '...')

// Environment-specific
.storage(`./data/${process.env.NODE_ENV}/copilot.db`, '...')

// User-specific
.storage(`./data/users/${userId}/sessions.db`, '...')

// Enterprise with absolute paths
.storage('/secure/copilot/production.db', '...')
```

### Embed Location (`embedLocation`)
**Purpose**: Specifies where the copilot UI component should be rendered in your application.

**Common Patterns**:
```typescript
// DOM element ID
.storage('...', '#copilot-container')

// CSS selector
.storage('...', '.chat-widget')

// Multiple selectors
.storage('...', '#main-content .sidebar')

// Body (full page)
.storage('...', 'body')

// Custom container
.storage('...', '#app-root .copilot-zone')
```

## Framework-Specific Examples

### Next.js
```typescript
const config = createCopilotConfig()
  .basic('Next.js Assistant', 'nextjs-assistant', 'Welcome!')
  .model('openai', 'gpt-4')
  .systemPrompt('You are a Next.js development assistant.')
  .storage('./data/nextjs-copilot.db', '#__next')
  .build()
```

### Vite/React
```typescript
const config = createCopilotConfig()
  .basic('React Assistant', 'react-assistant', 'Hello!')
  .model('openai', 'gpt-4')
  .systemPrompt('You are a React development assistant.')
  .storage('./data/react-copilot.db', '#root')
  .build()
```

### SvelteKit
```typescript
const config = createCopilotConfig()
  .basic('Svelte Assistant', 'svelte-assistant', 'Hi there!')
  .model('openai', 'gpt-4')
  .systemPrompt('You are a Svelte development assistant.')
  .storage('./data/svelte-copilot.db', '#svelte')
  .build()
```

## Preset Default Values

When using presets, storage defaults are automatically applied:

```typescript
// Basic preset applies:
// - databasePath: './data/{slug}.db'
// - embedLocation: 'copilot-container'

const config = createBasicConfig('Assistant', 'Hello!')
  .model('openai', 'gpt-4')
  .storage('./custom/path.db', '#my-container')  // Overrides defaults
  .build()
```

## Auto-Fix Behavior

The ConfigValidator automatically fixes missing storage configurations:

```typescript
// If databasePath is missing, auto-generates:
// './data/{slug}.db'

// If embedLocation is missing, defaults to:
// 'copilot-container'
```

## Validation Rules

### Database Path Requirements
- ✅ Must be a non-empty string
- ✅ Can be relative (`./data/db.sqlite`) or absolute (`/path/to/db`)
- ✅ Should include file extension for clarity
- ⚠️ Directory must exist or be createable

### Embed Location Requirements
- ✅ Must be a non-empty string
- ✅ Can be CSS selector (`#id`, `.class`, `element`)
- ✅ Should target existing DOM elements
- ⚠️ Element must exist when copilot initializes

## Common Patterns

### Environment-Based Configuration
```typescript
const getStorageConfig = (env: string, slug: string) => {
  const configs = {
    development: {
      databasePath: `./data/dev/${slug}.db`,
      embedLocation: '#dev-copilot'
    },
    staging: {
      databasePath: `./data/staging/${slug}.db`,
      embedLocation: '#staging-copilot'
    },
    production: {
      databasePath: `/secure/data/${slug}.db`,
      embedLocation: '#copilot-container'
    }
  }
  return configs[env] || configs.development
}

const { databasePath, embedLocation } = getStorageConfig(process.env.NODE_ENV, 'assistant')

const config = createCopilotConfig()
  .basic('Assistant', 'assistant', 'Hello!')
  .model('openai', 'gpt-4')
  .systemPrompt('You are a helpful assistant.')
  .storage(databasePath, embedLocation)
  .build()
```

### Multi-User Configuration
```typescript
const createUserConfig = (userId: string) => {
  return createCopilotConfig()
    .basic(`User ${userId} Assistant`, `user-${userId}-assistant`, 'Hello!')
    .model('openai', 'gpt-4')
    .systemPrompt(`You are a personal assistant for user ${userId}.`)
    .storage(`./data/users/${userId}/copilot.db`, '#user-copilot')
    .build()
}
```

## Error Handling

### Missing Storage Configuration
```typescript
try {
  const config = createCopilotConfig()
    .basic('Assistant', 'assistant', 'Hello!')
    .model('openai', 'gpt-4')
    .systemPrompt('You are a helpful assistant.')
    // Missing .storage() call
    .build()
} catch (error) {
  console.error(error.message)
  // "Configuration validation failed: databasePath: Database path is required and cannot be empty; embedLocation: Embed location is required and cannot be empty"
}
```

### Safe Building with Error Details
```typescript
const result = createCopilotConfig()
  .basic('Assistant', 'assistant', 'Hello!')
  .model('openai', 'gpt-4')
  .systemPrompt('You are a helpful assistant.')
  .storage('./data/copilot.db', '#copilot-container')
  .tryBuild()

if (!result.success) {
  console.error('Configuration errors:')
  result.errors?.forEach((error, i) => {
    console.error(`${i + 1}. ${error}`)
  })
} else {
  console.log('✅ Configuration built successfully')
}
```

## Best Practices

1. **Always call `.storage()`** before `.build()`
2. **Use environment variables** for production paths
3. **Validate DOM elements exist** before initializing
4. **Use relative paths** for portability
5. **Include file extensions** for clarity
6. **Consider user isolation** for multi-tenant apps

## Migration from Legacy Configs

If migrating from legacy configurations:

```typescript
// Legacy (Phase 4 and earlier)
const legacyConfig = {
  title: 'Assistant',
  subtitle: 'Helper',
  initialMessage: 'Hello!'
  // No explicit storage configuration
}

// Modern (Phase 5+)
const modernConfig = createCopilotConfig()
  .basic('Assistant', 'assistant', 'Hello!')
  .model('openai', 'gpt-4')
  .systemPrompt('You are a helpful assistant.')
  .storage('./data/assistant.db', '#copilot-container')  // ← Required
  .build()
```

## Summary

The `.storage(databasePath, embedLocation)` method is **required** for all copilot configurations. It defines where data is stored and where the UI is rendered. Use the patterns above to configure storage appropriately for your application architecture. 