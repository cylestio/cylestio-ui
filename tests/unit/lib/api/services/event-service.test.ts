import { EventService } from '@/lib/api/services/event-service';
import { getPaginatedData, getSingleItem, parseApiDates } from '@/lib/api/helpers';
import { API_PATHS, Event } from '@/types/api';

// Mock the helpers
jest.mock('@/lib/api/helpers', () => ({
  getPaginatedData: jest.fn(),
  getSingleItem: jest.fn(),
  parseApiDates: jest.fn((item) => item) // Return the item unchanged
}));

describe('EventService', () => {
  // Sample event data for testing
  const mockEvent: Event = {
    id: 1,
    event_id: 'evt_123',
    agent_id: 'agt_456',
    session_id: 'ses_789',
    conversation_id: 'conv_123',
    event_type: 'user_message',
    timestamp: '2023-01-01T00:00:00Z',
    metadata: {},
    message: 'Hello, this is a test message'
  };

  const mockEvents = {
    items: [mockEvent],
    total: 1,
    page: 1,
    page_size: 50
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    test('should call getPaginatedData with correct parameters', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEvents);

      const result = await EventService.getEvents({
        page: 1,
        page_size: 10,
        event_type: 'user_message'
      });

      expect(getPaginatedData).toHaveBeenCalledWith(
        API_PATHS.EVENTS,
        {
          page: 1,
          page_size: 10,
          event_type: 'user_message'
        }
      );

      expect(parseApiDates).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });

    test('should format date parameters correctly', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEvents);

      const fromDate = new Date('2023-01-01T00:00:00Z');
      const toDate = new Date('2023-01-02T00:00:00Z');

      await EventService.getEvents({
        from_date: fromDate,
        to_date: toDate
      });

      expect(getPaginatedData).toHaveBeenCalledWith(
        API_PATHS.EVENTS,
        expect.objectContaining({
          from_date: fromDate.toISOString(),
          to_date: toDate.toISOString()
        })
      );
    });
  });

  describe('getEventById', () => {
    test('should call getSingleItem with correct parameters', async () => {
      (getSingleItem as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.getEventById('evt_123');

      expect(getSingleItem).toHaveBeenCalledWith(`${API_PATHS.EVENTS}`, 'evt_123');
      expect(parseApiDates).toHaveBeenCalledWith(mockEvent, ['timestamp']);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('getEventsByAgent', () => {
    test('should call getEvents with agent_id', async () => {
      // Create a spy on the getEvents method
      const getEventsSpy = jest.spyOn(EventService, 'getEvents');
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEvents);

      await EventService.getEventsByAgent('agt_456', { page: 2 });

      expect(getEventsSpy).toHaveBeenCalledWith({
        page: 2,
        agent_id: 'agt_456'
      });

      getEventsSpy.mockRestore();
    });
  });

  describe('getEventsByConversation', () => {
    test('should call getPaginatedData with conversation_id', async () => {
      (getPaginatedData as jest.Mock).mockResolvedValue(mockEvents);

      const result = await EventService.getEventsByConversation('conv_123');

      expect(getPaginatedData).toHaveBeenCalledWith(
        API_PATHS.EVENTS,
        {
          conversation_id: 'conv_123'
        }
      );

      expect(result).toEqual(mockEvents);
    });
  });
}); 