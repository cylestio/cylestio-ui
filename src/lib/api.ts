/**
 * API client for interacting with the Cylestio API
 */

const API_BASE_URL = process.env.API_SERVER_URL || 'http://localhost:8000';

export interface ApiError {
  error: string;
  status?: number;
}

/**
 * Fetch data from the API with proper error handling
 */
export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // If endpoint doesn't start with '/', add it
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If the endpoint doesn't include v1 already, add it
  const apiPath = formattedEndpoint.startsWith('/v1') ? 
                 formattedEndpoint : 
                 `/v1${formattedEndpoint}`;
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${apiPath}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        error: errorData.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * API endpoints
 */
export const AGENTS = {
  LIST: '/agents',
  DETAIL: (agentId: string) => `/agents/${agentId}`,
  DASHBOARD: (agentId: string) => `/agents/${agentId}/dashboard`,
  TOOLS: (agentId: string) => `/agents/${agentId}/tools`,
  TOOL_EXECUTIONS: (agentId: string) => `/agents/${agentId}/tools/executions`,
  LLMS: (agentId: string) => `/agents/${agentId}/llms`,
  LLM_REQUESTS: (agentId: string) => `/agents/${agentId}/llms/requests`,
  TOKENS: (agentId: string) => `/agents/${agentId}/tokens`,
  SESSIONS: (agentId: string) => `/agents/${agentId}/sessions`,
  TRACES: (agentId: string) => `/agents/${agentId}/traces`,
  ALERTS: (agentId: string) => `/agents/${agentId}/alerts`,
};

export const EVENTS = {
  LIST: '/events',
  DETAIL: (eventId: string) => `/events/${eventId}`,
  TRENDS: '/metrics/events/trends',
  BREAKDOWN: '/metrics/events/breakdown',
};

export const TOOLS = {
  LIST: '/tools',
  DETAIL: (toolId: string) => `/tools/${toolId}`,
  EXECUTIONS: '/metrics/tools/executions',
  SUCCESS_RATE: '/metrics/tools/success_rate',
};

export const LLMS = {
  LIST: '/llms',
  DETAIL: (modelId: string) => `/llms/${modelId}`,
  TOKEN_USAGE: '/metrics/llm/token_usage',
  MODELS: '/metrics/llm/models',
  TOKEN_COST: '/metrics/pricing/token_usage_cost',
};

export default { fetchAPI, AGENTS, EVENTS, TOOLS, LLMS }; 