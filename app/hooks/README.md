# API Interaction Hooks

This directory contains custom hooks for managing API requests and UI state.

## Hooks

### useApiRequest

A hook for handling API requests with loading and error states.

```tsx
import { useApiRequest } from '@/hooks/useApiRequest';
import { AgentService } from '@/lib/api/services/agent-service';

function AgentDetails({ agentId }) {
  const { 
    data, 
    loading, 
    error, 
    execute: fetchAgent,
    reset 
  } = useApiRequest(
    () => AgentService.getAgent(agentId),
    {
      immediate: true, // Execute the request immediately
      onSuccess: (data) => {
        console.log('Agent loaded:', data);
      },
      onError: (error) => {
        console.error('Failed to load agent:', error);
      }
    }
  );

  // Re-fetch when needed
  const handleRefresh = () => {
    fetchAgent();
  };

  // Reset the state
  const handleReset = () => {
    reset();
  };

  // ...
}
```

Parameters:
- `requestFn`: `() => Promise<T>` - The API request function
- `options`: (Optional)
  - `immediate`: `boolean` - Whether to execute the request immediately (default: `true`)
  - `onSuccess`: `(data: T) => void` - Callback for successful requests
  - `onError`: `(error: ApiError) => void` - Callback for failed requests

Returns:
- `data`: `T | null` - The response data (null if not loaded)
- `loading`: `boolean` - Whether the request is in progress
- `error`: `ApiError | null` - The error (null if no error)
- `execute`: `() => Promise<T | void>` - Function to execute the request
- `reset`: `() => void` - Function to reset the state

### usePagination

A hook for managing pagination state and parameters.

```tsx
import { usePagination } from '@/hooks/usePagination';

function EventsList() {
  const { 
    page, 
    pageSize, 
    sortBy, 
    sortOrder,
    setPage,
    setPageSize,
    setSortBy,
    setSortOrder,
    nextPage,
    prevPage,
    resetPagination,
    paginationParams
  } = usePagination({
    initialPage: 1,
    initialPageSize: 25,
    initialSortBy: 'timestamp',
    initialSortOrder: 'desc'
  });

  // Use paginationParams in API calls
  useEffect(() => {
    fetchEvents(paginationParams);
  }, [paginationParams]);

  // ...
}
```

Parameters:
- `options`: (Optional)
  - `initialPage`: `number` - Initial page number (default: `1`)
  - `initialPageSize`: `number` - Initial page size (default: `10`)
  - `initialSortBy`: `string` - Initial sort field
  - `initialSortOrder`: `'asc' | 'desc'` - Initial sort order (default: `'desc'`)

Returns:
- `page`: `number` - Current page number
- `pageSize`: `number` - Current page size
- `sortBy`: `string | undefined` - Current sort field
- `sortOrder`: `'asc' | 'desc' | undefined` - Current sort order
- `setPage`: `(page: number) => void` - Function to set page
- `setPageSize`: `(size: number) => void` - Function to set page size
- `setSortBy`: `(field: string) => void` - Function to set sort field
- `setSortOrder`: `(order: 'asc' | 'desc') => void` - Function to set sort order
- `nextPage`: `() => void` - Function to go to next page
- `prevPage`: `() => void` - Function to go to previous page
- `resetPagination`: `() => void` - Function to reset pagination to initial values
- `paginationParams`: `PaginationParams` - Object with all pagination parameters for API requests

## Integration with API Services

These hooks are designed to work seamlessly with the API services:

```tsx
import { useApiRequest, usePagination } from '@/hooks';
import { EventService } from '@/lib/api/services/event-service';

function Events() {
  const pagination = usePagination({
    initialSortBy: 'timestamp',
    initialSortOrder: 'desc'
  });
  
  const { data, loading, error, execute } = useApiRequest(
    () => EventService.getEvents(pagination.paginationParams),
    { immediate: true }
  );
  
  // The above will automatically handle:
  // - Loading states
  // - Error handling
  // - Data fetching with pagination
  // - Re-fetching when pagination changes
}
``` 