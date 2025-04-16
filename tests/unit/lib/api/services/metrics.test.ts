import { MetricsService, MetricsServiceParams } from '@/lib/api/services';
import { formatRequestParams } from '@/lib/api/helpers';
import apiClient from '@/lib/api/client';
import { TokenUsageMetrics, ResponseTimeMetrics } from '@/types/api';

// Mock the helpers and apiClient
jest.mock('@/lib/api/helpers', () => ({
  formatRequestParams: jest.fn(params => params)
}));

jest.mock('@/lib/api/client');

describe('MetricsService', () => {
  // Sample metrics data for testing
  const mockTokenUsageMetrics: TokenUsageMetrics = {
    total: 1542632,
    prompt_tokens: 978450,
    completion_tokens: 564182,
    by_model: {
      'gpt-4': {
        total: 842632,
        prompt_tokens: 478450,
        completion_tokens: 364182
      },
      'gpt-3.5-turbo': {
        total: 700000,
        prompt_tokens: 500000,
        completion_tokens: 200000
      }
    }
  };

  const mockResponseTimeMetrics: ResponseTimeMetrics = {
    average_ms: 356,
    min_ms: 120,
    max_ms: 2450,
    median_ms: 320,
    p95_ms: 875,
    p99_ms: 1320,
    by_model: {
      'gpt-4': {
        average_ms: 512,
        min_ms: 250,
        max_ms: 2450,
        median_ms: 450,
        p95_ms: 1200,
        p99_ms: 2000
      },
      'gpt-3.5-turbo': {
        average_ms: 245,
        min_ms: 120,
        max_ms: 950,
        median_ms: 230,
        p95_ms: 500,
        p99_ms: 800
      }
    }
  };

  const mockModelMetrics = {
    'gpt-4': mockResponseTimeMetrics.by_model['gpt-4'],
    'gpt-3.5-turbo': mockResponseTimeMetrics.by_model['gpt-3.5-turbo']
  };

  const mockAgentMetrics = {
    'agent-1': mockTokenUsageMetrics,
    'agent-2': { ...mockTokenUsageMetrics, total: 1000000 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockClear();
  });

  describe('tokenUsage', () => {
    describe('getTotal', () => {
      test('should call apiClient.get with correct parameters', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockTokenUsageMetrics });

        const params: MetricsServiceParams = {
          agent_id: 'agent-1',
          start_time: '2023-01-01T00:00:00Z',
          end_time: '2023-01-31T23:59:59Z'
        };

        const result = await MetricsService.tokenUsage.getTotal(params);

        expect(formatRequestParams).toHaveBeenCalledWith(params);
        expect(apiClient.get).toHaveBeenCalledWith(
          '/v1/metrics/token_usage/total',
          { params }
        );
        expect(result).toEqual(mockTokenUsageMetrics);
      });

      test('should handle empty parameters', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockTokenUsageMetrics });

        await MetricsService.tokenUsage.getTotal();

        expect(formatRequestParams).toHaveBeenCalledWith({});
        expect(apiClient.get).toHaveBeenCalledWith(
          '/v1/metrics/token_usage/total',
          { params: {} }
        );
      });

      test('should propagate errors', async () => {
        const mockError = new Error('API Error');
        (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

        await expect(MetricsService.tokenUsage.getTotal()).rejects.toThrow(mockError);
      });
    });

    describe('getByAgent', () => {
      test('should call apiClient.get with correct parameters', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAgentMetrics });

        const params: MetricsServiceParams = {
          start_time: '2023-01-01T00:00:00Z',
          end_time: '2023-01-31T23:59:59Z'
        };

        const result = await MetricsService.tokenUsage.getByAgent(params);

        expect(formatRequestParams).toHaveBeenCalledWith(params);
        expect(apiClient.get).toHaveBeenCalledWith(
          '/v1/metrics/token_usage/by_agent',
          { params }
        );
        expect(result).toEqual(mockAgentMetrics);
      });
    });

    describe('getForAgent', () => {
      test('should call getTotal with agent_id parameter', async () => {
        const getTotalSpy = jest.spyOn(MetricsService.tokenUsage, 'getTotal')
          .mockResolvedValueOnce(mockTokenUsageMetrics);

        const agentId = 'agent-1';
        const params = {
          start_time: '2023-01-01T00:00:00Z',
          end_time: '2023-01-31T23:59:59Z'
        };

        await MetricsService.tokenUsage.getForAgent(agentId, params);

        expect(getTotalSpy).toHaveBeenCalledWith({
          ...params,
          agent_id: agentId
        });

        getTotalSpy.mockRestore();
      });
    });

    describe('getByTimeRange', () => {
      test('should call getTotal with time range parameters', async () => {
        const getTotalSpy = jest.spyOn(MetricsService.tokenUsage, 'getTotal')
          .mockResolvedValueOnce(mockTokenUsageMetrics);

        const startTime = '2023-01-01T00:00:00Z';
        const endTime = '2023-01-31T23:59:59Z';
        const params = { agent_id: 'agent-1' };

        await MetricsService.tokenUsage.getByTimeRange(startTime, endTime, params);

        expect(getTotalSpy).toHaveBeenCalledWith({
          ...params,
          start_time: startTime,
          end_time: endTime
        });

        getTotalSpy.mockRestore();
      });

      test('should handle Date objects', async () => {
        const getTotalSpy = jest.spyOn(MetricsService.tokenUsage, 'getTotal')
          .mockResolvedValueOnce(mockTokenUsageMetrics);

        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-31T23:59:59Z');

        await MetricsService.tokenUsage.getByTimeRange(startTime, endTime);

        expect(getTotalSpy).toHaveBeenCalledWith({
          start_time: startTime,
          end_time: endTime
        });

        getTotalSpy.mockRestore();
      });
    });
  });

  describe('responseTime', () => {
    describe('getAverage', () => {
      test('should call apiClient.get with correct parameters', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponseTimeMetrics });

        const params: MetricsServiceParams = {
          agent_id: 'agent-1',
          start_time: '2023-01-01T00:00:00Z',
          end_time: '2023-01-31T23:59:59Z'
        };

        const result = await MetricsService.responseTime.getAverage(params);

        expect(formatRequestParams).toHaveBeenCalledWith(params);
        expect(apiClient.get).toHaveBeenCalledWith(
          '/v1/metrics/response_time/average',
          { params }
        );
        expect(result).toEqual(mockResponseTimeMetrics);
      });

      test('should handle empty parameters', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponseTimeMetrics });

        await MetricsService.responseTime.getAverage();

        expect(formatRequestParams).toHaveBeenCalledWith({});
        expect(apiClient.get).toHaveBeenCalledWith(
          '/v1/metrics/response_time/average',
          { params: {} }
        );
      });

      test('should propagate errors', async () => {
        const mockError = new Error('API Error');
        (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

        await expect(MetricsService.responseTime.getAverage()).rejects.toThrow(mockError);
      });
    });

    describe('getByModel', () => {
      test('should call apiClient.get with correct parameters', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockModelMetrics });

        const params: MetricsServiceParams = {
          start_time: '2023-01-01T00:00:00Z',
          end_time: '2023-01-31T23:59:59Z'
        };

        const result = await MetricsService.responseTime.getByModel(params);

        expect(formatRequestParams).toHaveBeenCalledWith(params);
        expect(apiClient.get).toHaveBeenCalledWith(
          '/v1/metrics/response_time/by_model',
          { params }
        );
        expect(result).toEqual(mockModelMetrics);
      });
    });

    describe('getForAgent', () => {
      test('should call getAverage with agent_id parameter', async () => {
        const getAverageSpy = jest.spyOn(MetricsService.responseTime, 'getAverage')
          .mockResolvedValueOnce(mockResponseTimeMetrics);

        const agentId = 'agent-1';
        const params = {
          start_time: '2023-01-01T00:00:00Z',
          end_time: '2023-01-31T23:59:59Z'
        };

        await MetricsService.responseTime.getForAgent(agentId, params);

        expect(getAverageSpy).toHaveBeenCalledWith({
          ...params,
          agent_id: agentId
        });

        getAverageSpy.mockRestore();
      });
    });

    describe('getByTimeRange', () => {
      test('should call getAverage with time range parameters', async () => {
        const getAverageSpy = jest.spyOn(MetricsService.responseTime, 'getAverage')
          .mockResolvedValueOnce(mockResponseTimeMetrics);

        const startTime = '2023-01-01T00:00:00Z';
        const endTime = '2023-01-31T23:59:59Z';
        const params = { agent_id: 'agent-1' };

        await MetricsService.responseTime.getByTimeRange(startTime, endTime, params);

        expect(getAverageSpy).toHaveBeenCalledWith({
          ...params,
          start_time: startTime,
          end_time: endTime
        });

        getAverageSpy.mockRestore();
      });

      test('should handle Date objects', async () => {
        const getAverageSpy = jest.spyOn(MetricsService.responseTime, 'getAverage')
          .mockResolvedValueOnce(mockResponseTimeMetrics);

        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-31T23:59:59Z');

        await MetricsService.responseTime.getByTimeRange(startTime, endTime);

        expect(getAverageSpy).toHaveBeenCalledWith({
          start_time: startTime,
          end_time: endTime
        });

        getAverageSpy.mockRestore();
      });
    });
  });
}); 