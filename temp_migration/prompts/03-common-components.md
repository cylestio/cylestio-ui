# Task: Implement Common UI Components for API Interaction

## Context
As we migrate from direct database access to the REST API, we need reusable UI components to handle common API-related UI patterns like loading states, error displays, and pagination. These components will be used throughout the dashboard to provide a consistent user experience.

## Requirements

1. Create reusable components for:
   - Loading states
   - Error displays
   - Pagination
   - Data refresh controls
2. Ensure components follow the existing design system
3. Implement proper accessibility features
4. Create hooks for common API-related behaviors

## Detailed Steps

1. Create components in `app/components/ui/`:
   - `loading-state.tsx` - For displaying loading states
   - `error-display.tsx` - For showing API errors
   - `pagination.tsx` - For handling paginated data
   - `refresh-button.tsx` - For manually refreshing data

2. Create custom hooks in `app/hooks/`:
   - `usePagination.ts` - For managing pagination state
   - `useApiRequest.ts` - For handling API requests with loading/error states

## Technical Details

### Loading State Component

Should support:
- Different sizes (small, medium, large)
- Full-screen or inline variants
- Optional text message
- Accessibility requirements (aria-* attributes)

### Error Display Component

Should support:
- Different severity levels (error, warning, info)
- Detailed or summary views
- Retry action
- Clear action

### Pagination Component

Should support:
- Page number display
- Previous/Next buttons
- Page size selection
- Total items count display
- Jump to page functionality

### Example Implementation

Here's a starting example for the `useApiRequest` hook:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/app/types/api';

interface UseApiRequestOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiRequestReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: () => Promise<void>;
  reset: () => void;
}

export function useApiRequest<T>(
  requestFn: () => Promise<T>,
  options: UseApiRequestOptions<T> = {}
): UseApiRequestReturn<T> {
  const { immediate = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      onError?.(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [requestFn, onSuccess, onError]);
  
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);
  
  return { data, loading, error, execute, reset };
}
```

## Example Usage

Here's how these components would be used together:

```tsx
import { useApiRequest } from '@/app/hooks/useApiRequest';
import { usePagination } from '@/app/hooks/usePagination';
import { LoadingState } from '@/app/components/ui/loading-state';
import { ErrorDisplay } from '@/app/components/ui/error-display';
import { Pagination } from '@/app/components/ui/pagination';
import { agentsService } from '@/app/lib/api/services/agents';

function AgentsList() {
  const pagination = usePagination({ initialPage: 1, initialPageSize: 10 });
  
  const { 
    data, 
    loading, 
    error, 
    execute: fetchAgents 
  } = useApiRequest(
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
    return <ErrorDisplay error={error} onRetry={fetchAgents} />;
  }
  
  return (
    <div>
      {/* Render agents data */}
      {data && data.items.map(agent => (
        <div key={agent.id}>{agent.name}</div>
      ))}
      
      {data && (
        <Pagination
          currentPage={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={data.total}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      )}
    </div>
  );
}
```

## Deliverables

1. UI Components:
   - `app/components/ui/loading-state.tsx`
   - `app/components/ui/error-display.tsx`
   - `app/components/ui/pagination.tsx`
   - `app/components/ui/refresh-button.tsx`

2. Custom Hooks:
   - `app/hooks/usePagination.ts`
   - `app/hooks/useApiRequest.ts`

3. Exported components and hooks in appropriate index files

## References

- Existing UI components in the codebase
- React Hooks Documentation: https://reactjs.org/docs/hooks-intro.html
- Accessibility Guidelines: https://www.w3.org/WAI/ARIA/apg/ 

## Additional context
All migration files and docs, as well as all development phases/prompts (this prompt is only one of them) can be found here in the directory "temp_migration"

## Recommendations from API implementation

Based on the API interfaces and service implementation completed in the previous step, consider these recommendations:

1. **API Types Integration**: The UI components should directly leverage the type definitions in `app/types/api.ts`, particularly:
   - `ApiResponse<T>` interface for handling paginated responses
   - `ApiError` interface for proper error handling
   - `PaginationParams` type for pagination requests

2. **Error Component Structure**: The `ErrorDisplay` component should handle our `ApiError` interface, including support for displaying nested field-level errors from `ApiErrorDetail[]` in the error response.

3. **Service Pattern**: Follow the pattern implemented in `EventService` for API requests. The `useApiRequest` hook should be compatible with service methods like `EventService.getEvents`.

4. **Date Handling**: The UI components should be aware that date fields are returned as ISO strings from the API and then converted to Date objects by our services, so they should display dates accordingly.

5. **Type Guards**: For components that display events, consider leveraging the type guards (`isLlmRequestEvent`, etc.) we implemented to render different UI based on event types.

6. **API Paths**: Use the `API_PATHS` constants we defined for any direct API calls, to maintain consistency.