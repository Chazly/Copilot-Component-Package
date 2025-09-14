import type { AgentConfig } from '../agent/types';
type EventName = 'delegate_start' | 'delegate_end' | 'tool_invoke' | 'tool_result' | 'model_request' | 'model_error';
export declare function emitEvent(event: EventName, cfg: AgentConfig, payload: any): void;
export {};
