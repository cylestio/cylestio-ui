/**
 * API types definitions
 */

// API paths for various endpoints
export const API_PATHS = {
  AGENTS: '/v1/agents',
  EVENTS: '/v1/events',
  ALERTS: '/v1/alerts',
  METRICS: '/v1/metrics'
};

// API response interface
export interface ApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Alert severity enum
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Alert type enum
export type AlertType = 'PROMPT_INJECTION' | 'JAILBREAK' | 'PII_LEAK' | 'HARMFUL_CONTENT' | 'SECURITY_BREACH' | string;

// Alert interface
export interface Alert {
  id: number;
  alert_id: string;
  event_id: string;
  agent_id: string;
  timestamp: string | Date;
  alert_type: AlertType;
  severity: AlertSeverity;
  description: string;
  metadata: Record<string, any>;
  reviewed: boolean;
  reviewed_at: string | Date | null;
  reviewed_by: string | null;
}

// Event type enum
export type EventType = 'user_message' | 'agent_message' | 'llm_request' | 'llm_response' | 'tool_call' | 'tool_response' | string;

// Event interface
export interface Event {
  id: number;
  event_id: string;
  agent_id: string;
  session_id: string;
  conversation_id: string;
  event_type: EventType;
  timestamp: string | Date;
  metadata: Record<string, any>;
  model?: string;
  prompt?: string;
  tokens?: number;
  message?: string;
}

// Agent interface
export interface Agent {
  id: number;
  agent_id: string;
  name: string;
  description: string;
  version: string;
  active: boolean;
  last_active: string | Date;
  creation_time: string | Date;
} 