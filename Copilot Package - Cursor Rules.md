# Copilot Package - Cursor Rules

## Project Overview
**React TypeScript component library** for reusable AI copilot chat interfaces with resizable layouts.

- **Package**: `@your-org/copilot-package`
- **Tech Stack**: React 18 + TypeScript 5 + Tailwind CSS + Radix UI
- **Build**: TypeScript compilation to `dist/` with declaration files

## Architecture & Components

### Core Components
1. **`CopilotChat`** - Main chat interface
   - 9 color themes (blue, green, purple, emerald, cyan, amber, teal, slate, indigo)
   - Configurable header (title/subtitle)
   - Message history with timestamps
   - Loading states with animated dots
   - Async message handling via `onSendMessage` prop

2. **`ResizableLayout`** - Layout component for resizable panels
   - Draggable divider between left/right panels  
   - Configurable width constraints (min/max percentages)
   - Smooth mouse-based resizing
   - Perfect for chat + sidebar layouts

3. **UI Primitives** (`src/components/ui/`)
   - `Button` - Variant-based styling system
   - `Input` - Professional text entry
   - `ScrollArea` - Custom scrollbars with Radix

### Hooks
- **`useCopilotChat`** - State management for chat functionality
  - Message state with crypto.randomUUID()
  - Input validation and loading states
  - Error handling with fallback responses

### Type System (`src/types/index.ts`)
```typescript
interface Message {
  id: string
  content: string  
  sender: "user" | "assistant"
  timestamp: Date
}

interface CopilotConfig {
  title: string
  subtitle: string
  color: CopilotColor // 9 theme options
  initialMessage: string
}

interface CopilotChatProps {
  config: CopilotConfig
  onSendMessage?: (message: string) => Promise<string> | string
  className?: string
}

interface ResizableLayoutProps {
  leftPanel: any // React component
  rightPanel: any // React component
  defaultLeftWidth?: number // Percentage (0-100)
  minLeftWidth?: number 
  maxLeftWidth?: number
  className?: string
}
```

## File Structure
```
src/
├── components/
│   ├── CopilotChat.tsx (main chat UI)
│   ├── ResizableLayout.tsx (resizable panels)
│   └── ui/ (reusable primitives)
├── hooks/
│   └── useCopilotChat.ts (chat state management)  
├── types/
│   └── index.ts (centralized type definitions)
└── index.ts (package exports)
```

## Development Patterns

### Preferred Conventions
- **Components**: Functional components with hooks
- **Styling**: Utility-first CSS (Tailwind-style)
- **Types**: Interfaces over types for objects
- **Async**: async/await for promises
- **Exports**: Centralized from `src/types/index.ts`

### Color System
- Predefined theme variants with consistent styling
- Professional appearance suitable for business use
- CSS custom properties for theming

### State Management
- Custom hooks for component logic
- React state with proper TypeScript typing
- Error boundaries and fallback handling

## Dependencies
- **Peer**: React 18+, Lucide React (icons)
- **Dev**: TypeScript, React types
- **Runtime**: Radix UI primitives for accessibility

## Build Output
- Compiled JS in `dist/`
- TypeScript declarations included
- Main entry: `dist/index.js`, Types: `dist/index.d.ts`

## Usage Example
```tsx
import { CopilotChat, ResizableLayout, CopilotConfig } from '@your-org/copilot-package'

const config: CopilotConfig = {
  title: "AI Assistant",
  subtitle: "How can I help?", 
  color: "blue",
  initialMessage: "Hello! What can I help you with?"
}

// Simple chat
<CopilotChat 
  config={config}
  onSendMessage={async (msg) => await aiService.chat(msg)}
/>

// Resizable layout with chat + sidebar
<ResizableLayout
  leftPanel={<CopilotChat config={config} />}
  rightPanel={<DocumentViewer />}
  defaultLeftWidth={40}
  minLeftWidth={25}
  maxLeftWidth={75}
/>
```

## Notes
- **Build Config**: JSX configuration needs `--jsx` flag in TypeScript config
- **Styling**: Assumes Tailwind CSS or similar utility classes available
- **Accessibility**: Built with Radix UI primitives for screen reader support
- **Professional**: Designed for business/enterprise use cases

---

This package provides a complete, professional copilot chat solution with flexible layout options and comprehensive TypeScript support. 