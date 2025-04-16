/**
 * API service for metrics-related operations
 */

import apiClient from '../client';
import { formatRequestParams, parseApiDates } from '../helpers';
import { API_PATHS } from '@/types/api';
import { TokenUsageMetrics, ResponseTimeMetrics } from '@/types/api';

// Metrics data interfaces
export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface MetricSeries {
  name: string;
  data: MetricPoint[];
}

export interface MetricsSummary {
  total_agents: number;
  active_agents: number;
  total_requests: number;
  alerts_last_24h: number;
}

// Token usage metrics interface
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

// Response time metrics interface
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

// Parameters for metrics service
export interface MetricsServiceParams {
  agent_id?: string;
  model?: string;
  start_time?: Date | string;
  end_time?: Date | string;
  [key: string]: any;
}

/**
 * Get system-wide metrics
 */
export function getSystemMetrics(params: Record<string, any> = {}) {
  const formattedParams = formatRequestParams(params);
  return apiClient.get<MetricSeries[]>('/metrics/system', {
    params: formattedParams
  });
}

/**
 * Get agent-specific metrics
 */
export function getAgentMetrics(agentId: string, params: Record<string, any> = {}) {
  const formattedParams = formatRequestParams(params);
  return apiClient.get<MetricSeries[]>(`/metrics/agent/${agentId}`, {
    params: formattedParams
  });
}

/**
 * Get metrics summary for dashboard
 */
export function getSummary() {
  return apiClient.get<MetricsSummary>('/metrics/summary');
}

// Token usage metrics service
const tokenUsage = {
  /**
   * Get total token usage with optional filtering
   */
  getTotal: async (params: MetricsServiceParams = {}): Promise<TokenUsageMetrics> => {
    const formattedParams = formatRequestParams(params);
    const response = await apiClient.get<TokenUsageMetrics>(
      '/v1/metrics/token_usage/total',
      { params: formattedParams }
    );
    return response.data;
  },
  
  /**
   * Get token usage by agent
   */
  getByAgent: async (params: MetricsServiceParams = {}): Promise<Record<string, TokenUsageMetrics>> => {
    const formattedParams = formatRequestParams(params);
    const response = await apiClient.get<Record<string, TokenUsageMetrics>>(
      '/v1/metrics/token_usage/by_agent',
      { params: formattedParams }
    );
    return response.data;
  },
  
  /**
   * Get token usage for a specific agent
   */
  getForAgent: async (agentId: string, params: MetricsServiceParams = {}): Promise<TokenUsageMetrics> => {
    return tokenUsage.getTotal({
      ...params,
      agent_id: agentId
    });
  },
  
  /**
   * Get token usage within a time range
   */
  getByTimeRange: async (
    startTime: Date | string,
    endTime: Date | string,
    params: MetricsServiceParams = {}
  ): Promise<TokenUsageMetrics> => {
    return tokenUsage.getTotal({
      ...params,
      start_time: startTime,
      end_time: endTime
    });
  }
};

// Response time metrics service
const responseTime = {
  /**
   * Get average response time with optional filtering
   */
  getAverage: async (params: MetricsServiceParams = {}): Promise<ResponseTimeMetrics> => {
    const formattedParams = formatRequestParams(params);
    const response = await apiClient.get<ResponseTimeMetrics>(
      '/v1/metrics/response_time/average',
      { params: formattedParams }
    );
    return response.data;
  },
  
  /**
   * Get response time by model
   */
  getByModel: async (params: MetricsServiceParams = {}): Promise<Record<string, ResponseTimeMetrics>> => {
    const formattedParams = formatRequestParams(params);
    const response = await apiClient.get<Record<string, ResponseTimeMetrics>>(
      '/v1/metrics/response_time/by_model',
      { params: formattedParams }
    );
    return response.data;
  },
  
  /**
   * Get response time for a specific agent
   */
  getForAgent: async (agentId: string, params: MetricsServiceParams = {}): Promise<ResponseTimeMetrics> => {
    return responseTime.getAverage({
      ...params,
      agent_id: agentId
    });
  },
  
  /**
   * Get response time within a time range
   */
  getByTimeRange: async (
    startTime: Date | string,
    endTime: Date | string,
    params: MetricsServiceParams = {}
  ): Promise<ResponseTimeMetrics> => {
    return responseTime.getAverage({
      ...params,
      start_time: startTime,
      end_time: endTime
    });
  }
};

// Combined MetricsService with all metrics types
export const MetricsService = {
  tokenUsage,
  responseTime,
  
  /**
   * Get all metrics for an agent
   */
  getForAgent: async (agentId: string, params: MetricsServiceParams = {}) => {
    const [tokenUsageMetrics, responseTimeMetrics] = await Promise.all([
      tokenUsage.getForAgent(agentId, params),
      responseTime.getForAgent(agentId, params)
    ]);
    
    return {
      tokenUsage: tokenUsageMetrics,
      responseTime: responseTimeMetrics
    };
  }
}; 