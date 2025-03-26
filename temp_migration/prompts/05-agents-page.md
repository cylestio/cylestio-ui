# Task: Update Agents Page To Use API Instead of Database

## Context
As part of our migration from direct database access to the REST API, we need to update the Agents page to use our new API service instead of the database repository. This will be our first full component migration and will serve as a template for other components.

## Requirements

1. Replace database repository calls with API service calls
2. Implement loading states for API requests
3. Add error handling for API failures
4. Update the component to match API data structure
5. Add pagination for agent lists

## Detailed Steps

1. Identify all database repository calls in the agents page components
2. Replace each repository call with the equivalent API service call
3. Add loading states for each API request
4. Implement error handling for API failures
5. Update the UI to match the API data structure
6. Add pagination controls for lists

## Technical Details

### Files to Update

- `app/agents/page.tsx` - Main agents page
- Any agent-related components in `app/components/agents/`

### Current Implementation

The current implementation uses the `AgentRepository` class directly:

```typescript
// Example from app/agents/page.tsx
import { AgentRepository } from '@/src/lib/db/repositories';

export default function AgentsPage() {
  const agentRepo = new AgentRepository();
  const agents = agentRepo.getAllWithStatus();
  
  return (
    <div>
      <h1>Agents</h1>
      <AgentList agents={agents} />
    </div>
  );
}
```

### Target Implementation

The new implementation should use the `agentsService` and handle loading/error states:

```typescript
// Example structure for updated implementation
'use client';

import { useState, useEffect } from 'react';
import { agentsService } from '@/app/lib/api/services';
import { Agent } from '@/app/types/api';
import { LoadingState } from '@/app/components/ui/loading-state';
import { ErrorDisplay } from '@/app/components/ui/error-display';
import { Pagination } from '@/app/components/ui/pagination';
import { AgentList } from '@/app/components/agents/agent-list';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        const response = await agentsService.getAll({
          page,
          page_size: pageSize
        });
        setAgents(response.items);
        setTotal(response.total);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAgents();
  }, [page, pageSize]);
  
  if (loading && agents.length === 0) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <div>
      <h1>Agents</h1>
      <AgentList agents={agents} loading={loading} />
      
      <Pagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={setPage}
      />
    </div>
  );
}
```

Alternatively, use the custom hooks we created:

```typescript
'use client';

import { useApiRequest } from '@/app/hooks/useApiRequest';
import { usePagination } from '@/app/hooks/usePagination';
import { agentsService } from '@/app/lib/api/services';
import { LoadingState } from '@/app/components/ui/loading-state';
import { ErrorDisplay } from '@/app/components/ui/error-display';
import { Pagination } from '@/app/components/ui/pagination';
import { AgentList } from '@/app/components/agents/agent-list';

export default function AgentsPage() {
  const pagination = usePagination({ initialPage: 1, initialPageSize: 10 });
  
  const { data, loading, error } = useApiRequest(
    () => agentsService.getAll({
      page: pagination.page,
      page_size: pagination.pageSize
    }),
    { immediate: true }
  );
  
  if (loading && !data) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <div>
      <h1>Agents</h1>
      <AgentList agents={data?.items || []} loading={loading} />
      
      {data && (
        <Pagination
          currentPage={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={data.total}
          onPageChange={pagination.setPage}
        />
      )}
    </div>
  );
}
```

### Implementation Notes

1. **Server vs Client Components**: Next.js differentiates between server and client components. Since we're adding client-side state (loading, error, etc.), you'll need to add the `'use client';` directive at the top of components.

2. **Data Fetching**: If possible, use the custom hooks we created in the previous task (`useApiRequest` and `usePagination`) to keep the code cleaner.

3. **Data Adaptation**: The API response structure may differ slightly from what the UI components expect. You may need to transform the data or update the components.

4. **Optimistic Updates**: For a better user experience, maintain the current data while loading new data (e.g., when changing pages).

## Deliverables

1. Updated `app/agents/page.tsx` using the API service
2. Updated agent-related components in `app/components/agents/` (if needed)
3. Proper loading states and error handling
4. Pagination for agent lists

## References

- API Service: `app/lib/api/services/agents.ts`
- UI Components: `app/components/ui/`
- Custom Hooks: `app/hooks/`
- TypeScript Interfaces: `app/types/api.ts` 

## API Service Implementation Notes

1. **Service Naming**: The service was implemented as `AgentService` (capital 'A') but the example code uses `agentsService`. You should import it as:
   ```typescript
   import { AgentService } from '@/lib/api/services';
   ```

2. **Available Methods**: The AgentService has these implemented methods:
   - `getAll(params)`: For paginated list of agents with optional filtering/sorting
   - `getById(agentId)`: For retrieving a single agent by ID
   - `getMetrics(agentId, params)`: For retrieving agent metrics with optional time range
   - `getMostActive(limit)`: For getting the most active agents

3. **Date Handling**: The service automatically converts ISO date strings to Date objects for the fields `last_active` and `creation_time`, which will help with date formatting in the UI.

4. **Parameter Structure**: When calling `getAll()`, use the `AgentServiceParams` interface which extends `PaginationParams`:
   ```typescript
   const response = await AgentService.getAll({
     page: pagination.page,
     page_size: pagination.pageSize,
     sort_by: 'last_active',
     sort_order: 'desc',
     start_time: startDate, // optional
     end_time: endDate // optional
   });
   ```

5. **Response Structure**: The `getAll()` method returns an `ApiResponse<Agent>` with this structure:
   ```typescript
   {
     items: Agent[],
     total: number,
     page: number,
     page_size: number
   }
   ```

6. **Error Handling**: The underlying API client already has error handling that formats errors appropriately for the UI error components.

7. **Test Reference**: See `tests/unit/lib/api/services/agents.test.ts` for examples of all method calls and expected parameters.

## Additional contenxt
All migration files and docs, as well as all development phases/prompts (this prompt is only one of them) can be found here in the directory "temp_migration"