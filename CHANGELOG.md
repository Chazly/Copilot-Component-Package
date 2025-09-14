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


