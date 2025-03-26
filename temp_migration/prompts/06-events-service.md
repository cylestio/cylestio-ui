# Task: Implement Events API Service

## Context
Continuing our migration from direct database access to the REST API, we now need to implement the Events API service. This service will replace the current `EventRepository` and related repositories (LLM calls, tool calls) with a unified API-based approach.

## Requirements

1. Create an Events API service module
2. Implement methods for all event-related endpoints
3. Ensure proper type safety using our API interfaces
4. Implement support for filtering and pagination

## Detailed Steps

1. Create a new file: `app/lib/api/services/events.ts`
2. Implement service methods for:
   - List events with filtering
   - Get event by ID
   - Create new event (if needed)
3. Add support for event type-specific data

## Technical Details

The Events API service should use our centralized API client to make requests to the following endpoints:

- `GET /v1/events` - List events with filtering and pagination
- `GET /v1/events/{event_id}` - Get a specific event
- `POST /v1/events` - Create a new event (if your app needs this)

The events endpoint supports these filtering parameters:
- `agent_id` - Filter by agent ID
- `session_id` - Filter by session ID
- `conversation_id` - Filter by conversation ID
- `event_type` - Filter by event type (LLM_REQUEST, LLM_RESPONSE, TOOL_CALL, etc.)
- `start_time` - Filter by events after this time
- `end_time` - Filter by events before this time

Here's the expected response structure for the list endpoint:

```json
{
  "items": [
    {
      "id": 1,
      "event_id": "evt_abc123",
      "agent_id": 1,
      "session_id": 1,
      "conversation_id": 1,
      "event_type": "LLM_REQUEST",
      "timestamp": "2023-05-11T14:22:30Z",
      "metadata": {
        "model": "gpt-4",
        "temperature": 0.7
      },
      "llm_request": {
        "prompt": "How can I help you today?",
        "model_params": {
          "temperature": 0.7,
          "max_tokens": 500
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
```

Notice that event objects contain specialized fields based on their `event_type` (such as `llm_request` in the example above).

## Event Types and Specialized Data

Events can be of different types, each with its own specialized data:

1. `LLM_REQUEST` - Contains the `llm_request` field with prompt and model parameters
2. `LLM_RESPONSE` - Contains the `llm_response` field with completion text and usage statistics
3. `TOOL_CALL` - Contains the `tool_call` field with tool name and parameters
4. `TOOL_RESPONSE` - Contains the `tool_response` field with tool output
5. `SECURITY_ALERT` - Contains security alert information

Your interface and implementation should account for these different event types.

## Implementation Example

Here's a starting point for the events service:

```typescript
import { apiClient } from '../client';
import { Event, ApiResponse } from '@/app/types/api';

export interface EventServiceParams {
  page?: number;
  page_size?: number;
  agent_id?: string;
  session_id?: string;
  conversation_id?: string;
  event_type?: string;
  start_time?: Date | string;
  end_time?: Date | string;
}

export const eventsService = {
  /**
   * Get a list of events with filtering
   */
  async getAll(params: EventServiceParams = {}): Promise<ApiResponse<Event>> {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  /**
   * Get a single event by ID
   */
  async getById(eventId: string): Promise<Event> {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  },

  /**
   * Create a new event
   */
  async create(eventData: Partial<Event>): Promise<Event> {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },
  
  /**
   * Get events by agent ID
   */
  async getByAgentId(
    agentId: string,
    params: Omit<EventServiceParams, 'agent_id'> = {}
  ): Promise<ApiResponse<Event>> {
    return this.getAll({ ...params, agent_id: agentId });
  },
  
  /**
   * Get events by conversation ID
   */
  async getByConversationId(
    conversationId: string,
    params: Omit<EventServiceParams, 'conversation_id'> = {}
  ): Promise<ApiResponse<Event>> {
    return this.getAll({ ...params, conversation_id: conversationId });
  },
  
  /**
   * Get events by type
   */
  async getByType(
    eventType: string,
    params: Omit<EventServiceParams, 'event_type'> = {}
  ): Promise<ApiResponse<Event>> {
    return this.getAll({ ...params, event_type: eventType });
  }
};
```

## Current Repository Methods To Replace

For reference, here are some key methods from the current event-related repositories that need to be replaced:

```typescript
// From EventRepository
public findByAgentId(agentId: number, limit: number = 100): Event[]
public findBySessionId(sessionId: number, limit: number = 100): Event[]
public findByConversationId(conversationId: number, limit: number = 100): Event[]
public findByType(eventType: EventType, limit: number = 100): Event[]
public findByTimeRange(startTime: string, endTime: string, limit: number = 100): Event[]

// From LlmCallRepository
public findByEventId(eventId: number): LlmCall | null
public findByAgentId(agentId: number, limit: number = 100): LlmCall[]

// From ToolCallRepository
public findByEventId(eventId: number): ToolCall | null
public findByAgentId(agentId: number, limit: number = 100): ToolCall[]
```

## Deliverables

1. Complete implementation of `app/lib/api/services/events.ts`
2. Export the service from `app/lib/api/services/index.ts`
3. Update or add any necessary TypeScript interfaces in `app/types/api.ts`
4. Include appropriate JSDoc comments for all methods

## References

- API Documentation for events endpoints
- TypeScript interfaces in `app/types/api.ts`
- API client in `app/lib/api/client.ts`
- Existing repository implementations for reference 

## Integration Notes from Previous Migrations

Based on the completed Agents page migration (task #5), here are important considerations for implementing the Events API service:

1. **Component Integration Pattern**: 
   - The AgentDetail component has been updated to use the `useApiRequest` hook for data fetching
   - Currently, it makes multiple API requests that refresh together (agent data + metrics)
   - The component contains placeholder code for events data that will need to be integrated with your Events API service

2. **Type Compatibility**: 
   - The AgentDetail component expects event data in this format:
   ```typescript
   type EventData = {
     id: number;
     timestamp: string;
     event_type: string;
     agent_id: number;
     session_id?: number;
     conversation_id?: number;
     status?: string;
   };
   ```
   - Ensure your Events API service returns data compatible with this format or provide transformation functions

3. **UI Integration Points**:
   - The AgentDetail component has a "Recent Events" tab that currently uses placeholder data
   - There are also "Response Times" and "Event Types" tabs with chart visualizations that should be populated with event data
   - The UI already handles both empty states and data display

4. **Error Handling Pattern**:
   - We're using the ErrorDisplay component to handle API errors in a user-friendly way
   - The service should pass through error information in a format compatible with this component

5. **Event Type Handling**:
   - The AgentDetail component has a `getEventTypeName()` function that maps event types to display names:
   ```typescript
   const getEventTypeName = (type: string) => {
     const eventTypes: Record<string, string> = {
       'llm_request': 'LLM Request',
       'llm_response': 'LLM Response',
       'tool_call': 'Tool Call',
       'tool_response': 'Tool Response',
       'user_message': 'User Message',
       'agent_message': 'Agent Message',
       'session_start': 'Session Start',
       'session_end': 'Session End',
       'error': 'Error',
     };
     
     return eventTypes[type.toLowerCase()] || type;
   };
   ```
   - Ensure your API service returns event types that work with this function

For successful integration, your Events API service implementation should support all these requirements while maintaining the patterns established in the Agents service migration.

## Additional contenxt
All migration files and docs, as well as all development phases/prompts (this prompt is only one of them) can be found here in the directory "temp_migration"