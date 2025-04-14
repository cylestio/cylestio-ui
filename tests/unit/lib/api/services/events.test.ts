import { EventsService, EventServiceParams } from '@/lib/api/services';
import { getPaginatedData, getSingleItem, parseApiDates } from '@/lib/api/helpers';
import apiClient from '@/lib/api/client';
import { API_PATHS, Event, EventType } from '@/types/api';

// Mock the helpers and apiClient
jest.mock('@/lib/api/helpers', () => ({
  getPaginatedData: jest.fn(),
  getSingleItem: jest.fn(),
  parseApiDates: jest.fn((item) => item) // Return the item unchanged
}));

jest.mock('@/lib/api/client', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('EventsService', () => {
  // Sample event data for testing
  const mockEvent: Event = {
    id: 1,
    event_id: 'evt_123',
    agent_id: 'agt_456',
    session_id: 'ses_789',
    conversation_id: 'conv_123',
    event_type: 'llm_request',
    timestamp: '2023-01-01T00:00:00Z',
    metadata: {
      model: 'gpt-4',
      temperature: 0.7
    },
    model: 'gpt-4',
    prompt: 'How can I help you today?',
    tokens: 10
  };

  const mockEventList = {
    items: [mockEvent],
    total: 1,
    page: 1,
    page_size: 50
  };

  const mockEmptyEventList = {
    items: [],
    total: 0,
    page: 1,
    page_size: 50
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('should call getPaginatedData with correct parameters', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEventList);

      const params: EventServiceParams = {
        page: 1,
        page_size: 10,
        event_type: 'llm_request'
      };

      const result = await EventsService.getAll(params);

      expect(getPaginatedData).toHaveBeenCalledWith(
        API_PATHS.EVENTS,
        params
      );

      expect(parseApiDates).toHaveBeenCalled();
      expect(result).toEqual(mockEventList);
    });

    test('should handle empty parameters', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEventList);

      await EventsService.getAll();

      expect(getPaginatedData).toHaveBeenCalledWith(
        API_PATHS.EVENTS,
        {}
      );
    });

    test('should handle empty result sets', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEmptyEventList);

      const result = await EventsService.getAll();

      expect(result).toEqual(mockEmptyEventList);
    });

    test('should propagate errors', async () => {
      const mockError = new Error('API Error');
      (getPaginatedData as jest.Mock).mockRejectedValue(mockError);

      await expect(EventsService.getAll()).rejects.toThrow(mockError);
    });
  });

  describe('getById', () => {
    test('should call getSingleItem with correct event ID', async () => {
      (getSingleItem as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventsService.getById('evt_123');

      expect(getSingleItem).toHaveBeenCalledWith(API_PATHS.EVENTS, 'evt_123');
      expect(parseApiDates).toHaveBeenCalledWith(mockEvent, ['timestamp']);
      expect(result).toEqual(mockEvent);
    });
    
    test('should propagate errors if event not found', async () => {
      const notFoundError = new Error('Event not found');
      (getSingleItem as jest.Mock).mockRejectedValue(notFoundError);

      await expect(EventsService.getById('non-existent-id')).rejects.toThrow('Event not found');
    });
  });

  describe('create', () => {
    test('should call apiClient.post with correct data', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockEvent });

      const eventData = {
        agent_id: 'agt_456',
        event_type: 'llm_request' as EventType,
        metadata: { model: 'gpt-4' }
      };

      const result = await EventsService.create(eventData);

      expect(apiClient.post).toHaveBeenCalledWith(
        API_PATHS.EVENTS,
        eventData
      );
      
      expect(parseApiDates).toHaveBeenCalledWith(mockEvent, ['timestamp']);
      expect(result).toEqual(mockEvent);
    });

    test('should propagate errors when creation fails', async () => {
      const createError = new Error('Creation failed');
      (apiClient.post as jest.Mock).mockRejectedValue(createError);

      const eventData = {
        agent_id: 'agt_456',
        event_type: 'llm_request' as EventType
      };

      await expect(EventsService.create(eventData)).rejects.toThrow('Creation failed');
    });
  });

  describe('getByAgentId', () => {
    test('should call getAll with agent_id parameter', async () => {
      // Create a spy on the getAll method
      const getAllSpy = jest.spyOn(EventsService, 'getAll');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEventList);

      await EventsService.getByAgentId('agt_456', { page: 2 });

      expect(getAllSpy).toHaveBeenCalledWith({
        page: 2,
        agent_id: 'agt_456'
      });

      getAllSpy.mockRestore();
    });
  });

  describe('getBySessionId', () => {
    test('should call getAll with session_id parameter', async () => {
      const getAllSpy = jest.spyOn(EventsService, 'getAll');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEventList);

      await EventsService.getBySessionId('ses_789', { page_size: 20 });

      expect(getAllSpy).toHaveBeenCalledWith({
        page_size: 20,
        session_id: 'ses_789'
      });

      getAllSpy.mockRestore();
    });
  });

  describe('getByConversationId', () => {
    test('should call getAll with conversation_id parameter', async () => {
      const getAllSpy = jest.spyOn(EventsService, 'getAll');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEventList);

      await EventsService.getByConversationId('conv_123');

      expect(getAllSpy).toHaveBeenCalledWith({
        conversation_id: 'conv_123'
      });

      getAllSpy.mockRestore();
    });
  });

  describe('getByType', () => {
    test('should call getAll with event_type parameter', async () => {
      const getAllSpy = jest.spyOn(EventsService, 'getAll');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEventList);

      await EventsService.getByType('llm_request', { page: 3 });

      expect(getAllSpy).toHaveBeenCalledWith({
        page: 3,
        event_type: 'llm_request'
      });

      getAllSpy.mockRestore();
    });
  });

  describe('getByTimeRange', () => {
    test('should call getAll with time range parameters', async () => {
      const getAllSpy = jest.spyOn(EventsService, 'getAll');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEventList);

      const startTime = new Date('2023-01-01T00:00:00Z');
      const endTime = new Date('2023-01-02T00:00:00Z');

      await EventsService.getByTimeRange(startTime, endTime, { page_size: 100 });

      expect(getAllSpy).toHaveBeenCalledWith({
        page_size: 100,
        start_time: startTime,
        end_time: endTime
      });

      getAllSpy.mockRestore();
    });

    test('should handle string dates', async () => {
      const getAllSpy = jest.spyOn(EventsService, 'getAll');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEventList);

      const startTime = '2023-01-01T00:00:00Z';
      const endTime = '2023-01-02T00:00:00Z';

      await EventsService.getByTimeRange(startTime, endTime);

      expect(getAllSpy).toHaveBeenCalledWith({
        start_time: startTime,
        end_time: endTime
      });

      getAllSpy.mockRestore();
    });
  });
}); 