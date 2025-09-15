- feat: Reliable delegation with post-tool continuation and guaranteed assistant text
- feat: resultToText normalization and JSON code block fallback
- feat: Business-gated context injection via toolContextProvider
- feat: MCP runner with SSE aggregation and ok()/fail() envelopes
- feat: Routing policy DSL with CRUD/resource matchers and dry-run logs
- feat: Observability events with correlationId across delegate/tool/continuation
- feat: Enforce /api/openai HTTPS proxy; auto Chat vs Responses selection
- feat: postDelegate hook and non-empty transcript guarantees
### 1.1.0

- Added preDelegate hook and briefFormatter to seed child agents with a deterministic delegation brief
- Implemented child-run orchestration that guarantees first assistant message and returns final reply
- Introduced RoutingPolicy for forced tool_choice; parallel children disabled by default unless enabled
- Model/path resolver for OpenAI (Chat vs Responses) with browser proxy routing to /api/openai
- Typed ProviderHttpError surfacing upstream 4xx bodies with endpoint/model/path info
- Observability events (delegate_start/end, tool_invoke/result, model_request/error) with correlationId and redaction hook
- Tool name sanitization helpers and safe child-as-tool wrapper
- MCP helpers: SSE aggregation and standard tool result envelope
- Docs and example demonstrating master/child delegation and routing policy

Note: Behavior is unchanged unless hooks or policies are configured.


