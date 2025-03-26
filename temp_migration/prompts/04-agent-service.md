# Task: Implement Agents API Service

## Context
We're migrating from direct database access to the new REST API. In this task, you'll implement the Agents API service, which will be the first endpoint group we convert. This service will replace the current `AgentRepository` class and provide methods to interact with agent data via the API.

## Requirements

1. Create an Agents API service module
2. Implement methods for all agent-related endpoints
3. Ensure proper type safety using our API interfaces
4. Implement error handling

## Detailed Steps

1. Create a new file: `app/lib/api/services/agents.ts`
2. Implement service methods for:
   - List all agents
   - Get agent by ID
   - Get agent metrics

## Technical Details

The Agents API service should use our centralized API client to make requests to the following endpoints:

- `GET /v1/agents` - List all agents with pagination
- `GET /v1/agents/{agent_id}` - Get a specific agent
- `GET /v1/agents/{agent_id}/metrics` - Get metrics for a specific agent

Here's the expected response structure for the list endpoint:

```json
{
  "items": [
    {
      "id": 1,
      "agent_id": "assistant-abc123",
      "name": "Customer Support Assistant",
      "description": "AI assistant for customer support",
      "version": "1.0.0",
      "active": true,
      "last_active": "2023-05-11T14:23:45Z",
      "creation_time": "2023-05-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
```

For the individual agent endpoint:

```json
{
  "id": 1,
  "agent_id": "assistant-abc123",
  "name": "Customer Support Assistant",
  "description": "AI assistant for customer support",
  "version": "1.0.0",
  "active": true,
  "last_active": "2023-05-11T14:23:45Z",
  "creation_time": "2023-05-01T10:00:00Z",
  "metrics": {
    "total_sessions": 42,
    "total_conversations": 128,
    "total_events": 1024,
    "llm_calls": 512,
    "tool_calls": 256,
    "security_alerts": 8
  }
}
```

For the metrics endpoint:

```json
{
  "total_sessions": 42,
  "total_conversations": 128,
  "total_events": 1024,
  "llm_calls": 512,
  "tool_calls": 256,
  "security_alerts": 8
}
```

## Implementation Example

Here's a starting point for the agents service:

```typescript
import { apiClient } from '../client';
import { Agent, AgentMetrics, ApiResponse } from '@/app/types/api';

export interface AgentServiceParams {
  page?: number;
  page_size?: number;
  start_time?: Date | string;
  end_time?: Date | string;
}

export const agentsService = {
  /**
   * Get a list of all agents
   */
  async getAll(params: AgentServiceParams = {}): Promise<ApiResponse<Agent>> {
    const response = await apiClient.get('/agents', { params });
    return response.data;
  },

  /**
   * Get a single agent by ID
   */
  async getById(agentId: string): Promise<Agent> {
    const response = await apiClient.get(`/agents/${agentId}`);
    return response.data;
  },

  /**
   * Get metrics for a specific agent
   */
  async getMetrics(
    agentId: string, 
    params: Omit<AgentServiceParams, 'page' | 'page_size'> = {}
  ): Promise<AgentMetrics> {
    const response = await apiClient.get(`/agents/${agentId}/metrics`, { params });
    return response.data;
  },
  
  // Additional methods as needed
};
```

## Current Repository Methods To Replace

For reference, here are the key methods from the current `AgentRepository` class that need to be replaced:

```typescript
// From src/lib/db/repositories/agent-repository.ts
public findByAgentId(agentId: string): Agent | null
public getAllWithStatus(): Array<Agent & { active: boolean, last_active: string | null }>
public getAgentMetrics(agentId: number): { total_sessions, total_conversations, total_events, llm_calls, tool_calls, security_alerts } | null
public getMostActiveAgents(limit: number = 10): Agent[]
```

## Deliverables

1. Complete implementation of `app/lib/api/services/agents.ts`
2. Export the service from an index file: `app/lib/api/services/index.ts`
3. Include appropriate JSDoc comments for methods
4. Ensure all methods have proper type safety

## References

- API Documentation for agents endpoints
- TypeScript interfaces in `app/types/api.ts`
- API client in `app/lib/api/client.ts` 

## UI Integration Recommendations

We've recently created reusable UI components and hooks for API interaction that your Agents Service should work with. Here are key recommendations to ensure compatibility:

1. **Support for Pagination Hook**: The `usePagination` hook generates parameters in this format:
   ```typescript
   {
     page: number,
     page_size: number,
     sort_by?: string,
     sort_order?: 'asc' | 'desc'
   }
   ```
   Make sure your agent service accepts these parameters to work with the hook. Consider extending `AgentServiceParams` to include sorting parameters.

2. **Error Handling for UI**: The `ErrorDisplay` component expects errors in this format:
   ```typescript
   {
     status: 'error',
     message: string,
     detail?: {
       errors: Array<{ field: string, message: string, type: string }>
     }
   }
   ```
   Ensure API client errors are caught and properly formatted for consistent UI display.

3. **Date Formatting**: For the date fields in agent objects (`last_active`, `creation_time`), consider converting ISO string dates to Date objects for consistency with the UI components.

4. **Response Structure**: Maintain the expected response structure with `items`, `total`, `page`, and `page_size` properties for pagination components.

5. **Example Integration**: Your service will be used with our UI components like this:
   ```typescript
   // Example component using your service
   function AgentsList() {
     const pagination = usePagination({ initialPageSize: 25 });
     
     const { data, loading, error, execute } = useApiRequest(
       () => agentsService.getAll(pagination.paginationParams),
       { immediate: true }
     );
     
     return (
       <div>
         {error && <ErrorDisplay error={error} onRetry={execute} />}
         {loading && !data && <LoadingState />}
         {data && (
           <>
             {/* Agent list rendering */}
             <Pagination
               currentPage={pagination.page}
               pageSize={pagination.pageSize}
               totalItems={data.total}
               onPageChange={pagination.setPage}
               onPageSizeChange={pagination.setPageSize}
             />
           </>
         )}
       </div>
     );
   }
   ```

These UI components and hooks are located in:
- `app/components/ui/` - Contains UI components for loading states, errors, pagination
- `app/hooks/` - Contains the useApiRequest and usePagination hooks

Aligning your agent service implementation with these recommendations will ensure a seamless integration with the dashboard UI.

## Additional Context
All migration files and docs, as well as all development phases/prompts (this prompt is only one of them) can be found here in the directory "temp_migration"