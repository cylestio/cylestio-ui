/**
 * Configuration for API endpoints
 * 
 * This file centralizes all API endpoint paths to match the actual API structure
 * based on the OpenAPI documentation.
 */

// Telemetry endpoints - The core data is stored in telemetry events
export const TELEMETRY = {
  EVENTS: '/v1/telemetry/events',
  EVENTS_BY_IDS: '/v1/telemetry/events/by-ids',
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
  ALERTS: '/v1/alerts',
  ALERT_DETAIL: (id: string) => `/v1/alerts/${id}`,
  ALERTS_OVERVIEW: '/v1/alerts/overview',
  ALERTS_TIMESERIES: '/v1/alerts/timeseries',
  ALERTS_STATS: '/v1/alerts/stats',
  ALERT_COUNT: '/v1/alerts/count',
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
  
  // New LLM metrics
  LLM_ANALYTICS: '/v1/metrics/llm/analytics',
  LLM_MODELS: '/v1/metrics/llm/models',
  LLM_MODELS_PRICING: '/v1/metrics/pricing/llm_models',
  LLM_USAGE_TRENDS: '/v1/metrics/llm/usage_trends',
  LLM_AGENT_USAGE: '/v1/metrics/llm/agent_usage',
  LLM_AGENT_MODEL_RELATIONSHIPS: '/v1/metrics/llm/agent_model_relationships',
  
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
  TOKEN_USAGE_COST: '/v1/metrics/pricing/token_usage_cost',
  
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
  COST: (id: string) => `/v1/agents/${id}/cost`,
  TOOL_USAGE: (id: string) => `/v1/agents/${id}/tools`,
  TOOL_EXECUTIONS: (id: string) => `/v1/agents/${id}/tools/executions`,
  SESSIONS: (id: string) => `/v1/agents/${id}/sessions`,
  TRACES: (id: string) => `/v1/agents/${id}/traces`,
  ALERTS: (id: string) => `/v1/agents/${id}/alerts`
}; 