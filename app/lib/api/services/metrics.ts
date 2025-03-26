import { TokenUsageMetrics, ResponseTimeMetrics } from '@/types/api';
import apiClient from '../client';
import { formatRequestParams } from '../helpers';

/**
 * Parameters for metrics API requests
 */
export interface MetricsServiceParams {
  agent_id?: string;
  start_time?: Date | string;
  end_time?: Date | string;
}

/**
 * Service for interacting with the Metrics API
 */
export const MetricsService = {
  tokenUsage: {
    /**
     * Get total token usage metrics
     * 
     * @param params - Filter parameters
     * @returns Token usage metrics
     */
    async getTotal(params: MetricsServiceParams = {}): Promise<TokenUsageMetrics> {
      const formattedParams = formatRequestParams(params);
      const response = await apiClient.get('/v1/metrics/token_usage/total', { params: formattedParams });
      return response.data;
    },
    
    /**
     * Get token usage metrics by agent
     * 
     * @param params - Filter parameters
     * @returns Token usage metrics by agent
     */
    async getByAgent(params: MetricsServiceParams = {}): Promise<Record<string, TokenUsageMetrics>> {
      const formattedParams = formatRequestParams(params);
      const response = await apiClient.get('/v1/metrics/token_usage/by_agent', { params: formattedParams });
      return response.data;
    },
    
    /**
     * Get token usage metrics for a specific agent
     * 
     * @param agentId - The agent ID to filter by
     * @param params - Additional filter parameters
     * @returns Token usage metrics for the agent
     */
    async getForAgent(agentId: string, params: Omit<MetricsServiceParams, 'agent_id'> = {}): Promise<TokenUsageMetrics> {
      return this.getTotal({ ...params, agent_id: agentId });
    },

    /**
     * Get token usage metrics within a time range
     * 
     * @param startTime - Filter by metrics after this time
     * @param endTime - Filter by metrics before this time
     * @param params - Additional filter parameters
     * @returns Token usage metrics within the time range
     */
    async getByTimeRange(
      startTime: Date | string,
      endTime: Date | string,
      params: Omit<MetricsServiceParams, 'start_time' | 'end_time'> = {}
    ): Promise<TokenUsageMetrics> {
      return this.getTotal({
        ...params,
        start_time: startTime,
        end_time: endTime
      });
    }
  },
  
  responseTime: {
    /**
     * Get average response time metrics
     * 
     * @param params - Filter parameters
     * @returns Response time metrics
     */
    async getAverage(params: MetricsServiceParams = {}): Promise<ResponseTimeMetrics> {
      const formattedParams = formatRequestParams(params);
      const response = await apiClient.get('/v1/metrics/response_time/average', { params: formattedParams });
      return response.data;
    },
    
    /**
     * Get response time metrics by model
     * 
     * @param params - Filter parameters
     * @returns Response time metrics by model
     */
    async getByModel(params: MetricsServiceParams = {}): Promise<Record<string, ResponseTimeMetrics>> {
      const formattedParams = formatRequestParams(params);
      const response = await apiClient.get('/v1/metrics/response_time/by_model', { params: formattedParams });
      return response.data;
    },
    
    /**
     * Get response time metrics for a specific agent
     * 
     * @param agentId - The agent ID to filter by
     * @param params - Additional filter parameters
     * @returns Response time metrics for the agent
     */
    async getForAgent(agentId: string, params: Omit<MetricsServiceParams, 'agent_id'> = {}): Promise<ResponseTimeMetrics> {
      return this.getAverage({ ...params, agent_id: agentId });
    },

    /**
     * Get response time metrics within a time range
     * 
     * @param startTime - Filter by metrics after this time
     * @param endTime - Filter by metrics before this time
     * @param params - Additional filter parameters
     * @returns Response time metrics within the time range
     */
    async getByTimeRange(
      startTime: Date | string,
      endTime: Date | string,
      params: Omit<MetricsServiceParams, 'start_time' | 'end_time'> = {}
    ): Promise<ResponseTimeMetrics> {
      return this.getAverage({
        ...params,
        start_time: startTime,
        end_time: endTime
      });
    }
  }
}; 