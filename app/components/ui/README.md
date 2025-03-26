# Common UI Components for API Interaction

This directory contains reusable UI components for handling API-related UI patterns. These components provide a consistent user experience throughout the dashboard.

## Components

### LoadingState

A flexible loading component for displaying various loading states.

```tsx
import { LoadingState } from '@/components/ui/loading-state';

// Default inline loading spinner (medium size)
<LoadingState />

// Large fullscreen loading spinner with message
<LoadingState 
  size="large"
  variant="fullscreen"
  message="Loading your data..."
/>
```

Props:
- `size`: `'small' | 'medium' | 'large'` - Controls the size of the spinner (default: `'medium'`)
- `variant`: `'fullscreen' | 'inline'` - Controls whether the spinner is displayed fullscreen or inline (default: `'inline'`)
- `message`: `string` - Optional message to display below the spinner
- `className`: `string` - Additional CSS classes

### ErrorDisplay

A component for displaying API errors with different severity levels.

```tsx
import { ErrorDisplay } from '@/components/ui/error-display';

// Simple string error
<ErrorDisplay error="Failed to load data" />

// API error with retry functionality
<ErrorDisplay 
  error={apiError}
  severity="warning"
  showDetails={true}
  onRetry={() => fetchData()}
  onClear={() => setError(null)}
/>
```

Props:
- `error`: `ApiError | string` - The error to display
- `severity`: `'error' | 'warning' | 'info'` - The severity level of the error (default: `'error'`)
- `onRetry`: `() => void` - Optional callback for retry button
- `onClear`: `() => void` - Optional callback for clear/dismiss button
- `showDetails`: `boolean` - Whether to show detailed error information (default: `false`)
- `className`: `string` - Additional CSS classes

### Pagination

A component for handling paginated data with navigation controls.

```tsx
import { Pagination } from '@/components/ui/pagination';

<Pagination
  currentPage={page}
  pageSize={pageSize}
  totalItems={totalCount}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

Props:
- `currentPage`: `number` - The current page number
- `pageSize`: `number` - The number of items per page
- `totalItems`: `number` - The total number of items
- `onPageChange`: `(page: number) => void` - Callback for page changes
- `onPageSizeChange`: `(pageSize: number) => void` - Optional callback for page size changes
- `siblingCount`: `number` - Number of sibling pages to show (default: `1`)
- `pageSizeOptions`: `number[]` - Available page size options (default: `[10, 25, 50, 100]`)
- `className`: `string` - Additional CSS classes

### RefreshButton

A button for manually refreshing data with loading state indicator.

```tsx
import { RefreshButton } from '@/components/ui/refresh-button';

<RefreshButton 
  onRefresh={fetchData}
  isLoading={loading}
  showLastRefreshed={true}
  lastRefreshedTime={lastRefreshed}
/>
```

Props:
- `onRefresh`: `() => void` - Callback for refresh action
- `isLoading`: `boolean` - Whether the refresh action is in progress (default: `false`)
- `label`: `string` - Button label (default: `'Refresh'`)
- `showLastRefreshed`: `boolean` - Whether to show the last refreshed time (default: `false`)
- `lastRefreshedTime`: `Date` - Timestamp of the last refresh
- `className`: `string` - Additional CSS classes

## Usage Example

Here's an example of how to use these components together:

```tsx
import { useState } from 'react';
import { useApiRequest, usePagination } from '@/hooks';
import { LoadingState, ErrorDisplay, Pagination, RefreshButton } from '@/components/ui';
import { AgentService } from '@/lib/api/services/agent-service';

function AgentsList() {
  const [lastRefreshed, setLastRefreshed] = useState<Date>();
  const pagination = usePagination({ initialPageSize: 25 });
  
  const {
    data,
    loading,
    error,
    execute: fetchAgents
  } = useApiRequest(
    () => AgentService.getAgents(pagination.paginationParams),
    {
      immediate: true,
      onSuccess: () => setLastRefreshed(new Date())
    }
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Agents</h2>
        <RefreshButton
          onRefresh={fetchAgents}
          isLoading={loading}
          showLastRefreshed={true}
          lastRefreshedTime={lastRefreshed}
        />
      </div>
      
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={fetchAgents}
        />
      )}
      
      {loading && !data && (
        <LoadingState message="Loading agents..." />
      )}
      
      {data && (
        <>
          <div className="border rounded">
            {/* Render agents list */}
            {data.items.map(agent => (
              <div key={agent.id}>{agent.name}</div>
            ))}
          </div>
          
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

## Accessibility

All components include proper accessibility attributes for screen readers and keyboard navigation:
- LoadingState uses `role="status"` and includes a screen reader text
- ErrorDisplay implements appropriate color contrast and focus management
- Pagination includes keyboard accessible navigation and appropriate ARIA attributes
- RefreshButton supports keyboard activation and proper focus management 