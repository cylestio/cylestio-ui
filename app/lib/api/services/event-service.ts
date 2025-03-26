import { Event, API_PATHS, PaginationParams, ApiResponse } from '@/types/api';
import { getPaginatedData, getSingleItem, parseApiDates } from '../helpers';

/**
 * Service for interacting with the Events API
 */
export const EventService = {
  /**
   * Get a paginated list of events
   * 
   * @param params - Pagination and filter parameters
   * @returns Paginated list of events
   */
  async getEvents(params: PaginationParams & {
    agent_id?: string;
    event_type?: string;
    from_date?: Date;
    to_date?: Date;
  }): Promise<ApiResponse<Event>> {
    // Format date parameters
    const formattedParams: Record<string, any> = { ...params };
    
    if (params.from_date) {
      formattedParams.from_date = params.from_date.toISOString();
    }
    
    if (params.to_date) {
      formattedParams.to_date = params.to_date.toISOString();
    }
    
    const response = await getPaginatedData<Event>(API_PATHS.EVENTS, formattedParams);
    
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
  async getEventById(eventId: string): Promise<Event> {
    const event = await getSingleItem<Event>(`${API_PATHS.EVENTS}`, eventId);
    return parseApiDates(event, ['timestamp']);
  },

  /**
   * Get all events for a specific agent
   * 
   * @param agentId - The agent ID to filter by
   * @param params - Additional pagination parameters
   * @returns Paginated list of events for the agent
   */
  async getEventsByAgent(
    agentId: string, 
    params: PaginationParams = {}
  ): Promise<ApiResponse<Event>> {
    return this.getEvents({
      ...params,
      agent_id: agentId
    });
  },

  /**
   * Get all events for a specific conversation
   * 
   * @param conversationId - The conversation ID to filter by
   * @param params - Additional pagination parameters
   * @returns Paginated list of events for the conversation
   */
  async getEventsByConversation(
    conversationId: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<Event>> {
    const response = await getPaginatedData<Event>(
      API_PATHS.EVENTS, 
      {
        ...params,
        conversation_id: conversationId
      }
    );
    
    // Convert date strings to Date objects
    response.items = response.items.map(event => 
      parseApiDates(event, ['timestamp'])
    );
    
    return response;
  }
}; 