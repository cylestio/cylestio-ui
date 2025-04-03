import { Agent, ApiResponse, PaginationParams, API_PATHS } from '@/types/api';
import { getPaginatedData, getSingleItem, parseApiDates } from '../helpers';
import apiClient from '../client';

/**
 * Agent metrics interface
 */
export interface AgentMetrics {
  total_sessions: number;
  total_conversations: number;
  total_events: number;
  llm_calls: number;
  tool_calls: number;
  security_alerts: number;
  average_response_time?: number; // Optional field for average response time in milliseconds
}

/**
 * Parameters for agent API requests
 */
export interface AgentServiceParams extends PaginationParams {
  start_time?: Date | string;
  end_time?: Date | string;
}

/**
 * Service for interacting with the Agents API
 */
export const AgentService = {
  /**
   * Get a paginated list of all agents
   * 
   * @param params - Pagination and filter parameters
   * @returns Paginated list of agents
   */
  async getAll(params: AgentServiceParams = {}): Promise<ApiResponse<Agent>> {
    try {
      const response = await getPaginatedData<Agent>(API_PATHS.AGENTS, params);
      
      // Ensure response.items exists before mapping
      if (response && response.items && Array.isArray(response.items)) {
        // Convert date strings to Date objects
        response.items = response.items.map(agent => 
          parseApiDates(agent, ['last_active', 'creation_time'])
        );
      } else {
        // If response.items is undefined or not an array, set it to an empty array
        console.warn('No agent items returned from API or invalid format');
        response.items = [];
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Return a fallback response with empty items array
      return {
        items: [],
        total: 0,
        page: 1,
        page_size: 10
      };
    }
  },

  /**
   * Get a single agent by ID
   * 
   * @param agentId - The ID of the agent to retrieve
   * @returns The agent data
   */
  async getById(agentId: string): Promise<Agent> {
    try {
      const agent = await getSingleItem<Agent>(API_PATHS.AGENTS, agentId);
      return parseApiDates(agent, ['last_active', 'creation_time']);
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
      // Return a fallback agent that matches the Agent interface
      return {
        id: parseInt(agentId) || 0,
        agent_id: agentId,
        name: 'Unknown Agent',
        description: 'Agent data could not be loaded',
        version: 'unknown',
        active: false,
        last_active: new Date().toISOString(),
        creation_time: new Date().toISOString()
      };
    }
  },

  /**
   * Get metrics for a specific agent
   * 
   * @param agentId - The ID of the agent to retrieve metrics for
   * @param params - Time range parameters
   * @returns The agent metrics
   */
  async getMetrics(
    agentId: string, 
    params: Omit<AgentServiceParams, 'page' | 'page_size'> = {}
  ): Promise<AgentMetrics> {
    try {
      const response = await apiClient.get(
        `${API_PATHS.AGENTS}/${agentId}/metrics`, 
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching metrics for agent ${agentId}:`, error);
      
      // If the endpoint doesn't exist (404), return default values instead of throwing an error
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        console.log(`Metrics endpoint not available for agent ${agentId}, returning default values`);
        // Return default metrics structure with zeros
        return {
          total_sessions: 0,
          total_conversations: 0,
          total_events: 0,
          llm_calls: 0,
          tool_calls: 0,
          security_alerts: 0,
          average_response_time: 0
        };
      }
      
      // For other errors, rethrow
      throw error;
    }
  },
  
  /**
   * Get the most active agents
   * 
   * @param limit - Maximum number of agents to return
   * @returns List of most active agents
   */
  async getMostActive(limit: number = 10): Promise<Agent[]> {
    try {
      const response = await this.getAll({
        page_size: limit,
        sort_by: 'last_active',
        sort_order: 'desc'
      });
      
      return response.items || [];
    } catch (error) {
      console.error('Error fetching most active agents:', error);
      return [];
    }
  }
}; 