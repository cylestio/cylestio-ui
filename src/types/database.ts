// Database schema types for Cylestio Monitor

// Enum types
export enum EventType {
  LLM_REQUEST = 'LLM_REQUEST',
  LLM_RESPONSE = 'LLM_RESPONSE',
  TOOL_CALL = 'TOOL_CALL',
  TOOL_RESPONSE = 'TOOL_RESPONSE',
  USER_MESSAGE = 'USER_MESSAGE',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
  SECURITY_ALERT = 'SECURITY_ALERT',
  PERFORMANCE_METRIC = 'PERFORMANCE_METRIC',
  AGENT_START = 'AGENT_START',
  AGENT_END = 'AGENT_END',
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  CONVERSATION_START = 'CONVERSATION_START',
  CONVERSATION_END = 'CONVERSATION_END',
}

export enum EventLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum EventChannel {
  LLM = 'LLM',
  TOOL = 'TOOL',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
}

export enum EventDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  INTERNAL = 'INTERNAL',
}

export enum AlertLevel {
  NONE = 'NONE',
  SUSPICIOUS = 'SUSPICIOUS',
  DANGEROUS = 'DANGEROUS',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Base interface with common fields
export interface BaseRecord {
  id: number;
  created_at: string;
  updated_at: string;
}

// Agent interface
export interface Agent extends BaseRecord {
  agent_id: string;
  name: string;
  description: string | null;
  last_seen: string;
  agent_metadata: Record<string, any> | null;
}

// Session interface
export interface Session extends BaseRecord {
  agent_id: number;
  start_time: string;
  end_time: string | null;
  session_metadata: Record<string, any> | null;
}

// Conversation interface
export interface Conversation extends BaseRecord {
  session_id: number;
  start_time: string;
  end_time: string | null;
  conversation_metadata: Record<string, any> | null;
}

// Event interface
export interface Event extends BaseRecord {
  agent_id: number;
  session_id: number | null;
  conversation_id: number | null;
  event_type: EventType;
  channel: EventChannel;
  level: EventLevel;
  timestamp: string;
  direction: EventDirection | null;
  data: Record<string, any> | null;
}

// LLM Call interface
export interface LLMCall extends BaseRecord {
  event_id: number;
  model: string;
  prompt: string;
  response: string;
  tokens_in: number | null;
  tokens_out: number | null;
  duration_ms: number | null;
  is_stream: boolean;
  temperature: number | null;
  cost: number | null;
}

// Tool Call interface
export interface ToolCall extends BaseRecord {
  event_id: number;
  tool_name: string;
  input_params: Record<string, any> | null;
  output_result: Record<string, any> | null;
  success: boolean;
  error_message: string | null;
  duration_ms: number | null;
  blocking: boolean;
}

// Security Alert interface
export interface SecurityAlert extends BaseRecord {
  event_id: number;
  alert_type: string;
  severity: AlertSeverity;
  description: string;
  matched_terms: string[] | null;
  action_taken: string | null;
  timestamp: string;
}

// Event Security interface
export interface EventSecurity extends BaseRecord {
  event_id: number;
  alert_level: AlertLevel;
  matched_terms: string[] | null;
  reason: string | null;
  source_field: string | null;
}

// Performance Metric interface
export interface PerformanceMetric extends BaseRecord {
  event_id: number;
  metric_type: string;
  value: number;
  unit: string;
  context: Record<string, any> | null;
} 