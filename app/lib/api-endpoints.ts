/**
 * Configuration for API endpoints
 * 
 * This file centralizes all API endpoint paths to match the actual API structure
 * based on the OpenAPI documentation.
 */

// Telemetry endpoints - The core data is stored in telemetry events
export const TELEMETRY = {
  EVENTS: '/v1/telemetry/events',
  EVENT_DETAIL: (id: string) => `/v1/telemetry/events/${id}`,
  TRACES: (traceId: string) => `/v1/telemetry/traces/${traceId}`,
  SUBMIT: '/v1/telemetry',
  SUBMIT_BATCH: '/v1/telemetry/batch'
};

// Dashboard endpoint - For main dashboard metrics
export const DASHBOARD = {
  METRICS: '/v1/dashboard'
};

// Security endpoints - For security alerts and detections
export const SECURITY = {
  ALERTS: '/v1/security/alerts',
  ALERT_DETAIL: (id: string) => `/v1/security/alerts/${id}`,
  ALERT_COUNT: '/v1/metrics/security/alert_count',
  SEVERITY: '/v1/metrics/security/severity',
  TYPES: '/v1/metrics/security/types',
  STATUS: '/v1/metrics/security/status',
  ALERT_METRICS: '/v1/metrics/security/alerts'
};

// Sessions endpoints - For user interaction sessions
export const SESSIONS = {
  LIST: '/v1/sessions',
  DETAIL: (id: string) => `/v1/sessions/${id}`,
  MESSAGES: (id: string) => `/v1/sessions/${id}/messages`,
  EVENTS: (id: string) => `/v1/sessions/${id}/events`,
  METRICS: '/v1/metrics/sessions',
  COUNT: '/v1/metrics/session/count'
};

// Metrics endpoints - For various analytical metrics
export const METRICS = {
  // LLM metrics
  LLM_REQUEST_COUNT: '/v1/metrics/llm/request_count',
  LLM_TOKEN_USAGE: '/v1/metrics/llm/token_usage',
  LLM_RESPONSE_TIME: '/v1/metrics/llm/response_time',
  LLM_USAGE: '/v1/metrics/llms',
  LLM_REQUESTS: '/v1/metrics/llms/requests',
  
  // Tool metrics
  TOOL_SUCCESS_RATE: '/v1/metrics/tool/success_rate',
  TOOL_USAGE: '/v1/metrics/tools',
  TOOL_EXECUTIONS: '/v1/metrics/tools/executions',
  TOOL_INTERACTIONS: '/v1/metrics/tool_interactions',
  
  // Session metrics
  SESSION_COUNT: '/v1/metrics/session/count',
  SESSIONS: '/v1/metrics/sessions',
  
  // Error metrics
  ERROR_COUNT: '/v1/metrics/error/count',
  
  // Token metrics
  TOKEN_USAGE: '/v1/metrics/tokens',
  
  // Performance metrics
  PERFORMANCE: '/v1/metrics/performance',
  
  // Security metrics
  ALERTS: '/v1/metrics/alerts',
  SECURITY: '/v1/metrics/security',
  
  // Usage patterns metrics
  USAGE: '/v1/metrics/usage'
};

// Agents endpoints
export const AGENTS = {
  LIST: '/v1/agents',
  DETAIL: (id: string) => `/v1/agents/${id}`,
  DASHBOARD: (id: string) => `/v1/agents/${id}/dashboard`,
  LLM_USAGE: (id: string) => `/v1/agents/${id}/llms`,
  LLM_REQUESTS: (id: string) => `/v1/agents/${id}/llms/requests`,
  TOKEN_USAGE: (id: string) => `/v1/agents/${id}/tokens`,
  TOOL_USAGE: (id: string) => `/v1/agents/${id}/tools`,
  TOOL_EXECUTIONS: (id: string) => `/v1/agents/${id}/tools/executions`,
  SESSIONS: (id: string) => `/v1/agents/${id}/sessions`,
  TRACES: (id: string) => `/v1/agents/${id}/traces`,
  ALERTS: (id: string) => `/v1/agents/${id}/alerts`
}; 