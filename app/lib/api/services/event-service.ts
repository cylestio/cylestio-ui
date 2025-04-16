/**
 * API service for event operations (alternative implementation)
 */

import { getPaginatedData, getSingleItem, parseApiDates } from '../helpers';
import { API_PATHS, Event, ApiResponse } from '@/types/api';

// Interface for event service parameters
export interface EventServiceParams {
  page?: number;
  page_size?: number;
  agent_id?: string;
  session_id?: string;
  conversation_id?: string;
  event_type?: string;
  from_date?: Date | string;
  to_date?: Date | string;
  [key: string]: any;
}

// EventService implementation with methods tested by test suite
export const EventService = {
  /**
   * Get events with optional filtering
   */
  getEvents: async (params: EventServiceParams = {}) => {
    // Format Date parameters
    const formattedParams = { ...params };
    
    if (formattedParams.from_date instanceof Date) {
      formattedParams.from_date = formattedParams.from_date.toISOString();
    }
    
    if (formattedParams.to_date instanceof Date) {
      formattedParams.to_date = formattedParams.to_date.toISOString();
    }
    
    const result = await getPaginatedData<Event>(API_PATHS.EVENTS, formattedParams);
    
    // Parse dates for all items
    const parsedItems = result.items.map(item => parseApiDates(item, ['timestamp']));
    
    return {
      items: parsedItems,
      total: result.total,
      page: result.page,
      page_size: result.page_size
    };
  },
  
  /**
   * Get event by ID
   */
  getEventById: async (eventId: string) => {
    const event = await getSingleItem<Event>(`${API_PATHS.EVENTS}`, eventId);
    return parseApiDates(event, ['timestamp']);
  },
  
  /**
   * Get events by agent ID
   */
  getEventsByAgent: async (agentId: string, params: EventServiceParams = {}) => {
    return EventService.getEvents({
      ...params,
      agent_id: agentId
    });
  },
  
  /**
   * Get events by conversation ID
   */
  getEventsByConversation: async (conversationId: string, params: EventServiceParams = {}) => {
    return EventService.getEvents({
      ...params,
      conversation_id: conversationId
    });
  },
  
  /**
   * Get events by session ID
   */
  getEventsBySession: async (sessionId: string, params: EventServiceParams = {}) => {
    return EventService.getEvents({
      ...params,
      session_id: sessionId
    });
  },
  
  /**
   * Get events by type
   */
  getEventsByType: async (eventType: string, params: EventServiceParams = {}) => {
    return EventService.getEvents({
      ...params,
      event_type: eventType
    });
  }
}; 