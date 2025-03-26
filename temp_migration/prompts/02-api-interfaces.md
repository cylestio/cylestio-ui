# Task: Define TypeScript Interfaces for API Responses

## Context
As part of our migration from direct database access to REST API, we need to define TypeScript interfaces that match the API response structures. These interfaces will be used throughout the codebase to ensure type safety when working with API data.

## Requirements

1. Create TypeScript interfaces for all API response types
2. Define common interface patterns (e.g., pagination responses)
3. Ensure interfaces are compatible with existing UI components
4. Create appropriate type guards where needed

## Detailed Steps

1. Create a new file `app/types/api.ts` to store all API-related interfaces
2. Define base interfaces for common patterns:
   - `ApiResponse<T>` for paginated list responses
   - `ApiError` for error responses
3. Define specific interfaces for each API resource:
   - Agents
   - Events
   - Alerts
   - Metrics
   - Telemetry

## Technical Details

The API returns data in a standardized format. For lists of items, the response follows this pattern:

```json
{
  "items": [
    {
      // item data
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 50
}
```

For single item responses, the API returns the item directly:

```json
{
  "id": 1,
  "name": "Example Item",
  // other item properties
}
```

For error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "detail": {
    "errors": [
      {
        "field": "field_name",
        "message": "Specific error message",
        "type": "error_type"
      }
    ]
  }
}
```

## Example Interfaces

Here's a starting point for some of the interfaces:

```typescript
// Base pagination interface
export interface ApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Error interfaces
export interface ApiErrorDetail {
  field: string;
  message: string;
  type: string;
}

export interface ApiError {
  status: 'error';
  message: string;
  detail?: {
    errors: ApiErrorDetail[];
  };
}

// Extend for specific resources
// Example - not complete:
export interface Agent {
  id: number;
  agent_id: string;
  name: string;
  description: string;
  version: string;
  active: boolean;
  last_active: string;
  creation_time: string;
}
```

## Resource Data Structures

You'll need to implement interfaces for all API resources. Here's a snapshot of each resource's key properties:

### Agent
```
id, agent_id, name, description, version, active, last_active, creation_time
```

### Event
```
id, event_id, agent_id, session_id, conversation_id, event_type, timestamp, metadata
+ specialized fields depending on event_type (llm_request, llm_response, tool_call, etc.)
```

### Alert
```
id, alert_id, event_id, agent_id, timestamp, alert_type, severity, description, metadata
```

### Metrics (Token Usage)
```
total, prompt_tokens, completion_tokens, by_model
```

### Metrics (Response Time)
```
average_ms, min_ms, max_ms, median_ms, p95_ms, p99_ms, by_model
```

### Telemetry Event
```
id, timestamp, event_type, metadata
```

## Recommendations from previous step

Based on the API client implementation that has been completed, consider these recommendations:

1. **Align error interfaces**: The `ApiError` interface should align with the existing `ApiErrorResponse` interface in the client.ts file to ensure consistency.

2. **Type helpers for pagination**: Create utility types for working with paginated responses:
   ```typescript
   // Helper type for making paginated requests
   export type PaginationParams = {
     page?: number;
     page_size?: number;
     sort_by?: string;
     sort_order?: 'asc' | 'desc';
   };
   ```

3. **Response wrapper functions**: Consider adding helper functions that leverage the API client and type system:
   ```typescript
   // Type-safe function for getting paginated data
   export async function getPaginatedData<T>(
     endpoint: string, 
     params?: Record<string, any>
   ): Promise<ApiResponse<T>> {
     const formattedParams = formatRequestParams(params || {});
     const response = await apiClient.get(endpoint, { params: formattedParams });
     return response.data;
   }
   ```

4. **Type guards**: For resources with varying subtypes (like different event types), implement proper type guards:
   ```typescript
   export function isLlmRequestEvent(event: Event): event is LlmRequestEvent {
     return event.event_type === 'llm_request';
   }
   ```

5. **Date handling**: Handle date fields consistently - our API client formats dates to ISO strings, so responses should parse those strings back to Date objects when needed.

6. **Resource paths**: Define constants for API endpoint paths alongside the interfaces to ensure consistency.

## Deliverables

1. Complete TypeScript interfaces for all API responses in `app/types/api.ts`
2. Update exports in `app/types/index.ts` to include the new interfaces
3. Add appropriate documentation comments for each interface

## References

- API Documentation for detailed response structures
- TypeScript Documentation: https://www.typescriptlang.org/docs/handbook/interfaces.html 

## Additional contenxt
All migration files and docs, as well as all development phases/prompts (this prompt is only one of them) can be found here in the directory "temp_migration"