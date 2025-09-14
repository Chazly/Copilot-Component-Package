### Delegation Briefs, Orchestration Hooks, and Routing Policy

### Hooks

- preDelegate(context) => string
  - Context provides: parentMessages, lastUserMessage, chosenChildName, businessId, sessionId, userId, constraints, childTools
  - Return a non-empty brief to seed child first assistant message.

- AgentConfig.briefFormatter(context) => string
  - Optional; preDelegate defaults to calling briefFormatter when present.

### Child run behavior

- The per-child runner seeds the child's first assistant message with the brief if missing, then performs a single send() with the input. The final assistant message content is returned to the master as the tool result.

### RoutingPolicy

- AgentConfig.routingPolicy: rules[] with match() and optional forceTool { name, hard }
- Prevents automatic multi-child parallelism; force tool_choice when match is true.

### Model/path resolver and proxy

- OpenAI provider auto-selects Chat vs Responses path based on model, with override possible via baseURL/path.
- In browser contexts, requests to api.openai.com are routed through /api/openai proxy.
- Streaming defaults unaffected; recommended to keep streaming=false when tools are present.

### Errors

- Upstream 4xx bodies are surfaced via ProviderHttpError with endpoint, model, and pathType.

### Observability

- Structured events: delegate_start/end, tool_invoke/result, model_request/error with correlationId.
- Redaction hook: AgentConfig.observability.redact(data) -> data.
- Toggle includeBriefInDebugLogs when logging raw brief in apps.

### MCP helpers

- aggregateSseToPromise(stream, onProgress) -> Promise
- ok(data)/fail(message, details?, code?) wrappers for tool results

### Example (master → child)

```ts
import { CopilotAgent } from './src/agent/CopilotAgent'
import { createOrchestratorConfig } from './src/agent/orchestrate'
import { createOpenAIConfig } from './src/providers/openai'
import { ProviderRegistry } from './src/services/BaseProvider'

const provider = ProviderRegistry.getProvider('openai')!.factory(createOpenAIConfig())

const child = new CopilotAgent(provider as any, {
  name: 'OpsChild', firstMessage: 'Ready.', systemPrompt: 'You are the Ops child.', fallbackMessage: 'Sorry.'
} as any, {
  system_prompts: ['You are helpful operations assistant.'],
  tools: [],
})

const masterCfg = {
  system_prompts: ['You are a master orchestrator.'],
  briefFormatter: ({ lastUserMessage, constraints, chosenChildName }: any) =>
    `Delegation Brief for ${chosenChildName}:\nUser asked: ${lastUserMessage}\nConstraints: ${constraints || 'read'}\nReturn a concise, final answer.`,
  routingPolicy: {
    allowParallelChildren: false,
    rules: [{ match: ({ text }: any) => /create|update|delete|list/i.test(text), forceTool: { name: 'OpsChild' } }]
  },
  observability: { correlationId: 'session-123' }
} as any

const orchestrated = createOrchestratorConfig(masterCfg as any, [ { name: 'OpsChild', agent: child } ], {
  preDelegate: (ctx) => (masterCfg as any).briefFormatter!(ctx),
  seedPersistentChild: true
})
```


