import { AgentService, AgentServiceParams } from '@/lib/api/services';
import { getPaginatedData, getSingleItem, parseApiDates } from '@/lib/api/helpers';
import apiClient from '@/lib/api/client';
import { API_PATHS, Agent } from '@/types/api';
import { AgentMetrics } from '@/lib/api/services/agents';

// Mock the helpers
jest.mock('@/lib/api/helpers', () => ({
  getPaginatedData: jest.fn(),
  getSingleItem: jest.fn(),
  parseApiDates: jest.fn((item) => item) // Return the item unchanged
}));

// Mock the API client with a structure matching the actual implementation
jest.mock('@/lib/api/client', () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      defaults: {
        baseURL: 'http://localhost:3000',
        timeout: 15000,
        headers: {}
      },
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      }
    }
  };
});

describe('AgentService', () => {
  // Sample agent data for testing
  const mockAgent: Agent = {
    id: 1,
    agent_id: 'assistant-abc123',
    name: 'Test Agent',
    description: 'A test agent for unit tests',
    model: 'gpt-4',
    creation_time: '2023-01-01T00:00:00Z',
    last_active: '2023-01-01T01:00:00Z'
  };

  const mockAgentList = {
    items: [mockAgent],
    total: 1,
    page: 1,
    page_size: 50
  };

  const mockEmptyAgentList = {
    items: [],
    total: 0,
    page: 1,
    page_size: 50
  };

  const mockAgentMetrics = {
    total_sessions: 10,
    total_conversations: 25,
    total_events: 100,
    llm_calls: 50,
    tool_calls: 30,
    security_alerts: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('should call getPaginatedData with correct parameters', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockAgentList);

      const result = await AgentService.getAll({
        page: 1,
        page_size: 10,
        sort_by: 'name'
      });

      expect(getPaginatedData).toHaveBeenCalledWith(
        API_PATHS.AGENTS,
        {
          page: 1,
          page_size: 10,
          sort_by: 'name'
        }
      );
      
      expect(parseApiDates).toHaveBeenCalled();
      expect(result).toEqual(mockAgentList);
    });

    test('should format date parameters correctly', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockAgentList);

      const startTime = new Date('2023-01-01T00:00:00Z');
      const endTime = new Date('2023-01-02T00:00:00Z');

      await AgentService.getAll({
        start_time: startTime,
        end_time: endTime
      });

      expect(getPaginatedData).toHaveBeenCalledWith(
        API_PATHS.AGENTS,
        {
          start_time: startTime,
          end_time: endTime
        }
      );
    });
    
    test('should handle empty result sets', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEmptyAgentList);

      const result = await AgentService.getAll();

      expect(result).toEqual(mockEmptyAgentList);
      expect(parseApiDates).toHaveBeenCalled(); // Still called with empty array
    });

    test('should propagate errors', async () => {
      const mockError = new Error('API Error');
      (getPaginatedData as jest.Mock).mockRejectedValue(mockError);

      await expect(AgentService.getAll()).rejects.toThrow(mockError);
    });
  });

  describe('getById', () => {
    test('should call getSingleItem with correct agent ID', async () => {
      (getSingleItem as jest.Mock).mockResolvedValue(mockAgent);

      const result = await AgentService.getById('assistant-abc123');

      expect(getSingleItem).toHaveBeenCalledWith(API_PATHS.AGENTS, 'assistant-abc123');
      expect(parseApiDates).toHaveBeenCalledWith(mockAgent, ['last_active', 'creation_time']);
      expect(result).toEqual(mockAgent);
    });
    
    test('should propagate errors if agent not found', async () => {
      const notFoundError = new Error('Agent not found');
      (getSingleItem as jest.Mock).mockRejectedValue(notFoundError);

      await expect(AgentService.getById('non-existent-id')).rejects.toThrow('Agent not found');
    });
  });

  describe('getMetrics', () => {
    test('should call apiClient.get with correct parameters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAgentMetrics });

      const result = await AgentService.getMetrics('assistant-abc123');

      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_PATHS.AGENTS}/assistant-abc123/metrics`,
        { params: {} }
      );
      
      expect(result).toEqual(mockAgentMetrics);
    });

    test('should pass time range parameters correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAgentMetrics });

      const startTime = new Date('2023-01-01T00:00:00Z');
      const endTime = new Date('2023-01-02T00:00:00Z');

      await AgentService.getMetrics('assistant-abc123', {
        start_time: startTime,
        end_time: endTime
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_PATHS.AGENTS}/assistant-abc123/metrics`,
        { 
          params: {
            start_time: startTime,
            end_time: endTime
          } 
        }
      );
    });
    
    test('should handle empty metrics', async () => {
      const emptyMetrics = {
        total_sessions: 0,
        total_conversations: 0,
        total_events: 0,
        llm_calls: 0,
        tool_calls: 0,
        security_alerts: 0
      };
      
      (apiClient.get as jest.Mock).mockResolvedValue({ data: emptyMetrics });

      const result = await AgentService.getMetrics('assistant-abc123');
      
      expect(result).toEqual(emptyMetrics);
    });

    test('should propagate errors if metrics retrieval fails', async () => {
      const metricsError = new Error('Metrics unavailable');
      (apiClient.get as jest.Mock).mockRejectedValue(metricsError);

      await expect(AgentService.getMetrics('assistant-abc123')).rejects.toThrow('Metrics unavailable');
    });
  });

  describe('getMostActive', () => {
    test('should call getAll with correct parameters', async () => {
      // Create a spy on the getAll method
      const getAllSpy = jest.spyOn(AgentService, 'getAll');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockAgentList);

      await AgentService.getMostActive(5);

      expect(getAllSpy).toHaveBeenCalledWith({
        page_size: 5,
        sort_by: 'last_active',
        sort_order: 'desc'
      });

      getAllSpy.mockRestore();
    });
    
    test('should use default limit when none provided', async () => {
      const getAllSpy = jest.spyOn(AgentService, 'getAll');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockAgentList);

      await AgentService.getMostActive();

      expect(getAllSpy).toHaveBeenCalledWith({
        page_size: 10, // Default value
        sort_by: 'last_active',
        sort_order: 'desc'
      });

      getAllSpy.mockRestore();
    });

    test('should return empty array when no agents found', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEmptyAgentList);

      const result = await AgentService.getMostActive();
      
      expect(result).toEqual([]);
    });
  });
}); 