/**
 * API service for event-related operations
 */

import apiClient from '../client';
import { getPaginatedData, getSingleItem, parseApiDates } from '../helpers';
import { API_PATHS, Event, EventType, ApiResponse } from '@/types/api';

// Parameters for the events service
export interface EventServiceParams {
  page?: number;
  page_size?: number;
  agent_id?: string;
  session_id?: string;
  conversation_id?: string;
  event_type?: EventType;
  start_time?: Date | string;
  end_time?: Date | string;
  [key: string]: any;
}

// Events Service with all methods required by tests
export const EventsService = {
  /**
   * Get all events with optional filtering
   */
  getAll: async (params: EventServiceParams = {}) => {
    const result = await getPaginatedData<Event>(API_PATHS.EVENTS, params);
    
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
  getById: async (eventId: string) => {
    const event = await getSingleItem<Event>(API_PATHS.EVENTS, eventId);
    return parseApiDates(event, ['timestamp']);
  },
  
  /**
   * Create a new event
   * This method is designed for test compatibility
   * by returning the promise from apiClient.post
   */
  create: (eventData: Partial<Event>) => {
    return apiClient.post(API_PATHS.EVENTS, eventData).then(response => {
      return parseApiDates(response.data, ['timestamp']);
    });
  },
  
  /**
   * Get events by agent ID
   */
  getByAgentId: async (agentId: string, params: EventServiceParams = {}) => {
    return EventsService.getAll({
      ...params,
      agent_id: agentId
    });
  },
  
  /**
   * Get events by session ID
   */
  getBySessionId: async (sessionId: string, params: EventServiceParams = {}) => {
    return EventsService.getAll({
      ...params,
      session_id: sessionId
    });
  },
  
  /**
   * Get events by conversation ID
   */
  getByConversationId: async (conversationId: string, params: EventServiceParams = {}) => {
    return EventsService.getAll({
      ...params,
      conversation_id: conversationId
    });
  },
  
  /**
   * Get events by type
   */
  getByType: async (eventType: EventType, params: EventServiceParams = {}) => {
    return EventsService.getAll({
      ...params,
      event_type: eventType
    });
  },
  
  /**
   * Get events within a time range
   */
  getByTimeRange: async (
    startTime: Date | string, 
    endTime: Date | string,
    params: EventServiceParams = {}
  ) => {
    return EventsService.getAll({
      ...params,
      start_time: startTime,
      end_time: endTime
    });
  }
}; 