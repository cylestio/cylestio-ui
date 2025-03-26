import { AlertsService, AlertServiceParams, AlertType, AlertSeverity } from '@/lib/api/services';
import { formatRequestParams, parseApiDates, parseApiDatesList } from '@/lib/api/helpers';
import apiClient from '@/lib/api/client';
import { Alert, ApiResponse } from '@/types/api';

// Mock the helpers and apiClient
jest.mock('@/lib/api/helpers', () => ({
  formatRequestParams: jest.fn(params => params),
  parseApiDates: jest.fn(data => data),
  parseApiDatesList: jest.fn(items => items)
}));

jest.mock('@/lib/api/client');

describe('AlertsService', () => {
  // Sample alert data for testing
  const mockAlert: Alert = {
    id: 1,
    alert_id: 'alert_abc123',
    event_id: 'evt_def456',
    agent_id: '42',
    timestamp: '2023-05-11T14:22:30Z',
    alert_type: 'PROMPT_INJECTION',
    severity: 'high',
    description: 'Potential prompt injection attempt detected',
    metadata: {
      input_text: 'Ignore previous instructions and...',
      confidence_score: 0.92
    },
    reviewed: false,
    reviewed_at: null,
    reviewed_by: null
  };

  const mockApiResponse: ApiResponse<Alert> = {
    items: [mockAlert],
    total: 1,
    page: 1,
    page_size: 50
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockClear();
    (apiClient.patch as jest.Mock).mockClear();
  });

  describe('getAll', () => {
    test('should call apiClient.get with correct parameters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockApiResponse });

      const params: AlertServiceParams = {
        agent_id: '42',
        severity: 'high',
        alert_type: 'PROMPT_INJECTION',
        start_time: '2023-01-01T00:00:00Z',
        end_time: '2023-01-31T23:59:59Z',
        reviewed: false
      };

      const result = await AlertsService.getAll(params);

      expect(formatRequestParams).toHaveBeenCalledWith(params);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/alerts',
        { params }
      );
      expect(parseApiDatesList).toHaveBeenCalledWith(
        mockApiResponse.items,
        ['timestamp', 'reviewed_at']
      );
      expect(result).toEqual(mockApiResponse);
    });

    test('should handle empty parameters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockApiResponse });

      await AlertsService.getAll();

      expect(formatRequestParams).toHaveBeenCalledWith({});
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/alerts',
        { params: {} }
      );
    });

    test('should propagate errors', async () => {
      const mockError = new Error('API Error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(AlertsService.getAll()).rejects.toThrow(mockError);
    });
  });

  describe('getById', () => {
    test('should call apiClient.get with correct parameters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAlert });

      const alertId = 'alert_abc123';
      const result = await AlertsService.getById(alertId);

      expect(apiClient.get).toHaveBeenCalledWith(`/v1/alerts/${alertId}`);
      expect(parseApiDates).toHaveBeenCalledWith(
        mockAlert,
        ['timestamp', 'reviewed_at']
      );
      expect(result).toEqual(mockAlert);
    });

    test('should propagate errors', async () => {
      const mockError = new Error('API Error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(AlertsService.getById('alert_abc123')).rejects.toThrow(mockError);
    });
  });

  describe('markAsReviewed', () => {
    test('should call apiClient.patch with correct parameters', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: { ...mockAlert, reviewed: true, reviewed_by: 'user123', reviewed_at: '2023-05-11T15:00:00Z' } });

      const alertId = 'alert_abc123';
      const reviewedBy = 'user123';
      
      const result = await AlertsService.markAsReviewed(alertId, reviewedBy);

      expect(apiClient.patch).toHaveBeenCalledWith(
        `/v1/alerts/${alertId}`,
        {
          reviewed: true,
          reviewed_by: reviewedBy
        }
      );
      expect(parseApiDates).toHaveBeenCalledWith(
        { ...mockAlert, reviewed: true, reviewed_by: 'user123', reviewed_at: '2023-05-11T15:00:00Z' },
        ['timestamp', 'reviewed_at']
      );
      expect(result).toEqual({ ...mockAlert, reviewed: true, reviewed_by: 'user123', reviewed_at: '2023-05-11T15:00:00Z' });
    });

    test('should propagate errors', async () => {
      const mockError = new Error('API Error');
      (apiClient.patch as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(AlertsService.markAsReviewed('alert_abc123', 'user123')).rejects.toThrow(mockError);
    });
  });

  describe('getByAgentId', () => {
    test('should call getAll with agent_id parameter', async () => {
      const getAllSpy = jest.spyOn(AlertsService, 'getAll')
        .mockResolvedValueOnce(mockApiResponse);

      const agentId = '42';
      const params = {
        start_time: '2023-01-01T00:00:00Z',
        end_time: '2023-01-31T23:59:59Z'
      };

      await AlertsService.getByAgentId(agentId, params);

      expect(getAllSpy).toHaveBeenCalledWith({
        ...params,
        agent_id: agentId
      });

      getAllSpy.mockRestore();
    });
  });

  describe('getBySeverity', () => {
    test('should call getAll with severity parameter', async () => {
      const getAllSpy = jest.spyOn(AlertsService, 'getAll')
        .mockResolvedValueOnce(mockApiResponse);

      const severity: AlertSeverity = 'high';
      const params = {
        agent_id: '42',
        start_time: '2023-01-01T00:00:00Z',
        end_time: '2023-01-31T23:59:59Z'
      };

      await AlertsService.getBySeverity(severity, params);

      expect(getAllSpy).toHaveBeenCalledWith({
        ...params,
        severity
      });

      getAllSpy.mockRestore();
    });
  });

  describe('getCritical', () => {
    test('should call getBySeverity with critical severity', async () => {
      const getBySeveritySpy = jest.spyOn(AlertsService, 'getBySeverity')
        .mockResolvedValueOnce(mockApiResponse);

      const params = {
        agent_id: '42',
        start_time: '2023-01-01T00:00:00Z',
        end_time: '2023-01-31T23:59:59Z'
      };

      await AlertsService.getCritical(params);

      expect(getBySeveritySpy).toHaveBeenCalledWith('critical', params);

      getBySeveritySpy.mockRestore();
    });
  });

  describe('getByType', () => {
    test('should call getAll with alert_type parameter', async () => {
      const getAllSpy = jest.spyOn(AlertsService, 'getAll')
        .mockResolvedValueOnce(mockApiResponse);

      const alertType: AlertType = 'PROMPT_INJECTION';
      const params = {
        agent_id: '42',
        start_time: '2023-01-01T00:00:00Z',
        end_time: '2023-01-31T23:59:59Z'
      };

      await AlertsService.getByType(alertType, params);

      expect(getAllSpy).toHaveBeenCalledWith({
        ...params,
        alert_type: alertType
      });

      getAllSpy.mockRestore();
    });
  });

  describe('getUnreviewed', () => {
    test('should call getAll with reviewed: false parameter', async () => {
      const getAllSpy = jest.spyOn(AlertsService, 'getAll')
        .mockResolvedValueOnce(mockApiResponse);

      const params = {
        agent_id: '42',
        start_time: '2023-01-01T00:00:00Z',
        end_time: '2023-01-31T23:59:59Z'
      };

      await AlertsService.getUnreviewed(params);

      expect(getAllSpy).toHaveBeenCalledWith({
        ...params,
        reviewed: false
      });

      getAllSpy.mockRestore();
    });
  });

  describe('getByTimeRange', () => {
    test('should call getAll with time range parameters', async () => {
      const getAllSpy = jest.spyOn(AlertsService, 'getAll')
        .mockResolvedValueOnce(mockApiResponse);

      const startTime = '2023-01-01T00:00:00Z';
      const endTime = '2023-01-31T23:59:59Z';
      const params = { agent_id: '42' };

      await AlertsService.getByTimeRange(startTime, endTime, params);

      expect(getAllSpy).toHaveBeenCalledWith({
        ...params,
        start_time: startTime,
        end_time: endTime
      });

      getAllSpy.mockRestore();
    });

    test('should handle Date objects', async () => {
      const getAllSpy = jest.spyOn(AlertsService, 'getAll')
        .mockResolvedValueOnce(mockApiResponse);

      const startTime = new Date('2023-01-01T00:00:00Z');
      const endTime = new Date('2023-01-31T23:59:59Z');

      await AlertsService.getByTimeRange(startTime, endTime);

      expect(getAllSpy).toHaveBeenCalledWith({
        start_time: startTime,
        end_time: endTime
      });

      getAllSpy.mockRestore();
    });
  });
}); 