import { fetchAPI, buildQueryParams } from './api';

// Base endpoints for LLM-related APIs
const LLM_METRICS_BASE = '/v1/metrics/llm';
const AGENTS_BASE = '/v1/agents';

// Define common response types
interface LLMMetricsResponse {
  total: {
    request_count: number;
    response_time_avg: number;
    response_time_p95: number;
    success_rate: number;
    error_rate: number;
    token_count_input: number;
    token_count_output: number;
    token_count_total: number;
    estimated_cost_usd: number;
    first_seen?: string;
    last_seen?: string;
  };
  breakdown: Array<{
    key: string;
    metrics: {
      request_count: number;
      response_time_avg: number;
      response_time_p95: number;
      success_rate: number;
      error_rate?: number;
      token_count_input: number;
      token_count_output: number;
      token_count_total: number;
      estimated_cost_usd: number;
      first_seen?: string;
      last_seen?: string;
    };
  }>;
  from_time?: string;
  to_time?: string;
  filters?: any;
  breakdown_by?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Fetches LLM analytics data for dashboard overview
 */
export async function getLLMAnalytics(params: {
  agent_id?: string;
  model_name?: string;
  from_time?: string;
  to_time?: string;
  time_range?: string;
  granularity?: string;
  breakdown_by?: string;
}): Promise<LLMMetricsResponse> {
  try {
    const queryParams = buildQueryParams(params);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/analytics${queryParams}`);
    
    // Check if result has the expected structure
    if (!result || typeof result !== 'object' || !('total' in result)) {
      throw new Error('Invalid response format from API');
    }
    
    return result as LLMMetricsResponse;
  } catch (error) {
    console.error('Error fetching LLM analytics:', error);
    return {
      total: {
        request_count: 0,
        response_time_avg: 0,
        response_time_p95: 0,
        success_rate: 0,
        error_rate: 0,
        token_count_input: 0,
        token_count_output: 0,
        token_count_total: 0,
        estimated_cost_usd: 0
      },
      breakdown: [],
      from_time: params.from_time,
      to_time: params.to_time,
      filters: params,
      breakdown_by: params.breakdown_by || "none"
    };
  }
}

/**
 * Fetches LLM usage trends over time
 */
export async function getLLMUsageTrends(params: {
  agent_id?: string;
  model_name?: string;
  from_time?: string;
  to_time?: string;
  time_range?: string;
  granularity?: string;
}) {
  try {
    const queryParams = buildQueryParams(params);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/usage_trends${queryParams}`);
    return result;
  } catch (error) {
    console.error('Error fetching LLM usage trends:', error);
    return {
      total: {
        request_count: 0,
        token_count_input: 0,
        token_count_output: 0,
        token_count_total: 0,
        estimated_cost_usd: 0
      },
      breakdown: [],
      from_time: params.from_time,
      to_time: params.to_time,
      filters: params,
      breakdown_by: "time"
    };
  }
}

/**
 * Fetches LLM usage by agent
 */
export async function getLLMAgentUsage(params: {
  model_name?: string;
  from_time?: string;
  to_time?: string;
  time_range?: string;
}) {
  try {
    const queryParams = buildQueryParams(params);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/agent_usage${queryParams}`);
    return result;
  } catch (error) {
    console.error('Error fetching LLM agent usage:', error);
    return {
      total: {
        request_count: 0,
        token_count_input: 0,
        token_count_output: 0,
        token_count_total: 0,
        estimated_cost_usd: 0
      },
      breakdown: [],
      from_time: params.from_time,
      to_time: params.to_time,
      filters: params,
      breakdown_by: "agent"
    };
  }
}

/**
 * Fetches LLM model comparison data
 */
export async function getLLMModelComparison(params: {
  agent_id?: string;
  from_time?: string;
  to_time?: string;
  time_range?: string;
}) {
  try {
    const queryParams = buildQueryParams(params);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/models${queryParams}`);
    return result;
  } catch (error) {
    console.error('Error fetching LLM model comparison:', error);
    return {
      total: {
        request_count: 0,
        token_count_input: 0,
        token_count_output: 0,
        token_count_total: 0,
        estimated_cost_usd: 0
      },
      breakdown: [],
      from_time: params.from_time,
      to_time: params.to_time,
      filters: params,
      breakdown_by: "model"
    };
  }
}

/**
 * Fetches agent-model relationship data
 */
export async function getAgentModelRelationships(params: {
  agent_id?: string;
  model_name?: string;
  from_time?: string;
  to_time?: string;
  time_range?: string;
  granularity?: string;
  include_distributions?: boolean;
}) {
  try {
    const queryParams = buildQueryParams(params);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/agent_model_relationships${queryParams}`);
    return result;
  } catch (error) {
    console.error('Error fetching agent-model relationships:', error);
    return {
      total: {
        request_count: 0,
        token_count_input: 0,
        token_count_output: 0,
        token_count_total: 0,
        estimated_cost_usd: 0
      },
      breakdown: [],
      from_time: params.from_time,
      to_time: params.to_time,
      filters: params,
      breakdown_by: "agent_model"
    };
  }
}

/**
 * Fetches list of all LLM requests with filtering
 */
export async function getLLMRequests(params: {
  agent_id?: string;
  model?: string;
  status?: string;
  from_time?: string;
  to_time?: string;
  time_range?: string;
  page?: number;
  page_size?: number;
  trace_id?: string;
  query?: string;
  has_error?: boolean;
}): Promise<PaginatedResponse<any>> {
  try {
    // Build clean query params, removing undefined values
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanParams[key] = value;
      }
    });
    
    const queryParams = buildQueryParams(cleanParams);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/requests${queryParams}`);
    
    return result as PaginatedResponse<any>;
  } catch (error) {
    console.error('Error fetching LLM requests:', error);
    return {
      items: [],
      pagination: {
        page: params.page || 1,
        page_size: params.page_size || 20,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    };
  }
}

/**
 * Fetches details for a specific LLM request
 */
export async function getLLMRequestDetails(requestId: string) {
  try {
    return await fetchAPI(`${LLM_METRICS_BASE}/requests/${requestId}`);
  } catch (error) {
    console.error('Error fetching LLM request details:', error);
    return null;
  }
}

/**
 * Fetches conversation details for a trace ID
 */
export async function getLLMConversationFlow(traceId: string, params: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<any>> {
  try {
    const queryParams = buildQueryParams(params);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/conversations/${traceId}${queryParams}`);
    
    return result as PaginatedResponse<any>;
  } catch (error) {
    console.error('Error fetching LLM conversation flow:', error);
    return {
      items: [],
      pagination: {
        page: params.page || 1,
        page_size: params.page_size || 50,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    };
  }
}

/**
 * Fetches LLM token usage metrics
 */
export async function getLLMTokens(params: {
  agent_id?: string;
  from_time?: string;
  to_time?: string;
  time_range?: string;
  interval?: string;
  token_type?: string;
  group_by?: string;
}) {
  try {
    const queryParams = buildQueryParams(params);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/tokens${queryParams}`);
    return result;
  } catch (error) {
    console.error('Error fetching LLM token metrics:', error);
    return {
      metric: "llm.token_usage",
      from_time: params.from_time,
      to_time: params.to_time,
      interval: params.interval || "1d",
      data: []
    };
  }
}

/**
 * Fetches a list of LLM conversations
 */
export async function getLLMConversations(params: {
  agent_id?: string;
  model?: string;
  from_time?: string;
  to_time?: string;
  time_range?: string;
  page?: number;
  page_size?: number;
  query?: string;
  has_error?: boolean;
}): Promise<PaginatedResponse<any>> {
  try {
    const queryParams = buildQueryParams(params);
    const result = await fetchAPI(`${LLM_METRICS_BASE}/conversations${queryParams}`);
    
    return result as PaginatedResponse<any>;
  } catch (error) {
    console.error('Error fetching LLM conversations:', error);
    return {
      items: [],
      pagination: {
        page: params.page || 1,
        page_size: params.page_size || 20,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    };
  }
} 