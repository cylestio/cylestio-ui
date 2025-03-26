import { Event, EventType, ApiResponse, API_PATHS } from '@/types/api';
import { getPaginatedData, getSingleItem, parseApiDates } from '../helpers';
import apiClient from '../client';

/**
 * Parameters for events API requests
 */
export interface EventServiceParams {
  page?: number;
  page_size?: number;
  agent_id?: string;
  session_id?: string;
  conversation_id?: string;
  event_type?: EventType;
  start_time?: Date | string;
  end_time?: Date | string;
}

/**
 * Service for interacting with the Events API
 */
export const EventsService = {
  /**
   * Get a paginated list of events with filtering
   * 
   * @param params - Pagination and filter parameters
   * @returns Paginated list of events
   */
  async getAll(params: EventServiceParams = {}): Promise<ApiResponse<Event>> {
    const response = await getPaginatedData<Event>(API_PATHS.EVENTS, params);
    
    // Convert date strings to Date objects
    response.items = response.items.map(event => 
      parseApiDates(event, ['timestamp'])
    );
    
    return response;
  },

  /**
   * Get a single event by ID
   * 
   * @param eventId - The ID of the event to retrieve
   * @returns The event data
   */
  async getById(eventId: string): Promise<Event> {
    const event = await getSingleItem<Event>(API_PATHS.EVENTS, eventId);
    return parseApiDates(event, ['timestamp']);
  },

  /**
   * Create a new event
   * 
   * @param eventData - The event data to create
   * @returns The created event
   */
  async create(eventData: Partial<Event>): Promise<Event> {
    const response = await apiClient.post(API_PATHS.EVENTS, eventData);
    return parseApiDates(response.data, ['timestamp']);
  },
  
  /**
   * Get events by agent ID
   * 
   * @param agentId - The agent ID to filter by
   * @param params - Additional pagination and filter parameters
   * @returns Paginated list of events for the agent
   */
  async getByAgentId(
    agentId: string,
    params: Omit<EventServiceParams, 'agent_id'> = {}
  ): Promise<ApiResponse<Event>> {
    return this.getAll({ ...params, agent_id: agentId });
  },
  
  /**
   * Get events by session ID
   * 
   * @param sessionId - The session ID to filter by
   * @param params - Additional pagination and filter parameters
   * @returns Paginated list of events for the session
   */
  async getBySessionId(
    sessionId: string,
    params: Omit<EventServiceParams, 'session_id'> = {}
  ): Promise<ApiResponse<Event>> {
    return this.getAll({ ...params, session_id: sessionId });
  },
  
  /**
   * Get events by conversation ID
   * 
   * @param conversationId - The conversation ID to filter by
   * @param params - Additional pagination and filter parameters
   * @returns Paginated list of events for the conversation
   */
  async getByConversationId(
    conversationId: string,
    params: Omit<EventServiceParams, 'conversation_id'> = {}
  ): Promise<ApiResponse<Event>> {
    return this.getAll({ ...params, conversation_id: conversationId });
  },
  
  /**
   * Get events by type
   * 
   * @param eventType - The event type to filter by
   * @param params - Additional pagination and filter parameters
   * @returns Paginated list of events of the specified type
   */
  async getByType(
    eventType: EventType,
    params: Omit<EventServiceParams, 'event_type'> = {}
  ): Promise<ApiResponse<Event>> {
    return this.getAll({ ...params, event_type: eventType });
  },
  
  /**
   * Get events within a time range
   * 
   * @param startTime - Filter by events after this time
   * @param endTime - Filter by events before this time
   * @param params - Additional pagination and filter parameters
   * @returns Paginated list of events within the time range
   */
  async getByTimeRange(
    startTime: Date | string,
    endTime: Date | string,
    params: Omit<EventServiceParams, 'start_time' | 'end_time'> = {}
  ): Promise<ApiResponse<Event>> {
    return this.getAll({
      ...params,
      start_time: startTime,
      end_time: endTime
    });
  }
}; 