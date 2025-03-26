/**
 * TypeScript interfaces for API responses
 * 
 * These interfaces define the structure of data returned from the API endpoints.
 * They ensure type safety when working with API data throughout the application.
 */

// Base pagination interface for list responses
export interface ApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Error interfaces
export interface ApiErrorDetail {
  field: string;
  message: string;
  type: string;
}

export interface ApiError {
  status: 'error';
  message: string;
  detail?: {
    errors: ApiErrorDetail[];
  };
}

// Helper type for making paginated requests
export type PaginationParams = {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

// Resource interfaces

/**
 * Agent interface - represents a registered agent in the system
 */
export interface Agent {
  id: number;
  agent_id: string;
  name: string;
  description: string;
  version: string;
  active: boolean;
  last_active: string; // ISO date string
  creation_time: string; // ISO date string
}

/**
 * Event interfaces - represent various events tracked in the system
 */
export interface BaseEvent {
  id: number;
  event_id: string;
  agent_id: string;
  session_id: string;
  conversation_id: string;
  event_type: EventType;
  timestamp: string; // ISO date string
  metadata: Record<string, any>;
}

export type EventType =
  | 'llm_request'
  | 'llm_response'
  | 'tool_call'
  | 'user_message'
  | 'agent_message'
  | 'system_event';

// Specialized event interfaces based on event_type
export interface LlmRequestEvent extends BaseEvent {
  event_type: 'llm_request';
  model: string;
  prompt: string;
  tokens: number;
  parameters?: Record<string, any>;
}

export interface LlmResponseEvent extends BaseEvent {
  event_type: 'llm_response';
  model: string;
  response: string;
  tokens: number;
  latency_ms: number;
}

export interface ToolCallEvent extends BaseEvent {
  event_type: 'tool_call';
  tool_name: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  success: boolean;
  error_message?: string;
}

export interface UserMessageEvent extends BaseEvent {
  event_type: 'user_message';
  message: string;
}

export interface AgentMessageEvent extends BaseEvent {
  event_type: 'agent_message';
  message: string;
}

export interface SystemEvent extends BaseEvent {
  event_type: 'system_event';
  system_event_type: string;
}

// Union type for all event types
export type Event =
  | LlmRequestEvent
  | LlmResponseEvent
  | ToolCallEvent
  | UserMessageEvent
  | AgentMessageEvent
  | SystemEvent;

// Type guards for event types
export function isLlmRequestEvent(event: Event): event is LlmRequestEvent {
  return event.event_type === 'llm_request';
}

export function isLlmResponseEvent(event: Event): event is LlmResponseEvent {
  return event.event_type === 'llm_response';
}

export function isToolCallEvent(event: Event): event is ToolCallEvent {
  return event.event_type === 'tool_call';
}

export function isUserMessageEvent(event: Event): event is UserMessageEvent {
  return event.event_type === 'user_message';
}

export function isAgentMessageEvent(event: Event): event is AgentMessageEvent {
  return event.event_type === 'agent_message';
}

export function isSystemEvent(event: Event): event is SystemEvent {
  return event.event_type === 'system_event';
}

/**
 * Alert interface - represents system alerts/notifications
 */
export interface Alert {
  id: number;
  alert_id: string;
  event_id: string;
  agent_id: string;
  timestamp: string; // ISO date string
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: Record<string, any>;
  reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

/**
 * Metrics interfaces - represent various system metrics
 */
export interface TokenUsageMetrics {
  total: number;
  prompt_tokens: number;
  completion_tokens: number;
  by_model: Record<string, {
    total: number;
    prompt_tokens: number;
    completion_tokens: number;
  }>;
}

export interface ResponseTimeMetrics {
  average_ms: number;
  min_ms: number;
  max_ms: number;
  median_ms: number;
  p95_ms: number;
  p99_ms: number;
  by_model: Record<string, {
    average_ms: number;
    min_ms: number;
    max_ms: number;
    median_ms: number;
    p95_ms: number;
    p99_ms: number;
  }>;
}

/**
 * Telemetry event interface - represents system telemetry data
 */
export interface TelemetryEvent {
  id: number;
  timestamp: string; // ISO date string
  event_type: string;
  metadata: Record<string, any>;
}

// API endpoint paths
export const API_PATHS = {
  AGENTS: '/agents',
  EVENTS: '/events',
  ALERTS: '/alerts',
  METRICS: {
    TOKEN_USAGE: '/metrics/token-usage',
    RESPONSE_TIME: '/metrics/response-time'
  },
  TELEMETRY: '/telemetry'
}; 