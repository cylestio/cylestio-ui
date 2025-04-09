# Cylestio UI Components

This directory contains shared React components used throughout the Cylestio Monitor dashboard.

## State Management Components

We've implemented a set of standardized state management components to provide a consistent user experience across the application. These components handle loading, empty, and error states with appropriate visual treatment.

### LoadingState

`LoadingState` provides consistent loading indicators for various data loading scenarios.

```tsx
import LoadingState from './components/LoadingState'

// Basic usage
<LoadingState />

// With specific content type
<LoadingState contentType="metrics" />

// Skeleton loading (for progressive loading patterns)
<LoadingState variant="skeleton" contentType="chart" />

// Minimal inline loading
<LoadingState variant="minimal" card={false} />
```

#### Props

- `message`: Custom loading message
- `variant`: 'default' | 'skeleton' | 'spinner' | 'minimal'
- `contentType`: 'data' | 'chart' | 'metrics' | 'table'
- `skeletonCount`: Number of skeleton items (for skeleton variant)
- `card`: Whether to wrap in a Card
- `showText`: Whether to show loading text
- `icon`: Custom icon
- `height`: Container height (e.g., 'h-40')

### EmptyState

`EmptyState` provides informative empty states when no data is available.

```tsx
import EmptyState from './components/EmptyState'

// Basic usage
<EmptyState />

// With custom content and actions
<EmptyState 
  title="No Data Found"
  description="There are no metrics for the selected time period."
  actionText="Refresh Data"
  onAction={() => fetchData()}
/>

// For specific content types
<EmptyState contentType="table" />
```

#### Props

- `title`: Empty state title
- `description`: Empty state description
- `contentType`: 'data' | 'chart' | 'metrics' | 'table' | 'custom'
- `icon`: Custom icon
- `actionText`: Primary action button text
- `onAction`: Primary action handler
- `secondaryActionText`: Secondary action button text
- `onSecondaryAction`: Secondary action handler
- `card`: Whether to wrap in a Card
- `showIllustration`: Whether to show an icon/illustration
- `iconSize`: 'sm' | 'md' | 'lg'

### ErrorMessage

`ErrorMessage` provides consistent error visualization with different severity levels and recovery options.

```tsx
import ErrorMessage from './components/ErrorMessage'

// Basic usage
<ErrorMessage message="An error occurred while fetching data." />

// With recovery options
<ErrorMessage 
  message="Failed to load dashboard data."
  severity="error"
  retryText="Try Again"
  onRetry={() => fetchData()}
/>

// With more details and help
<ErrorMessage
  title="Connection Error"
  message="Could not connect to the API server."
  details="Error: Network Timeout (30s)"
  severity="critical"
  helpLink="https://docs.cylestio.com/troubleshooting"
/>
```

#### Props

- `title`: Error title (defaults based on severity)
- `message`: Error message content
- `details`: Technical details (for developers)
- `severity`: 'critical' | 'error' | 'warning' | 'info'
- `retryText`: Retry button text
- `onRetry`: Retry handler
- `alternativeActionText`: Alternative action text
- `onAlternativeAction`: Alternative action handler
- `card`: Whether to wrap in a Card
- `helpLink`: Help documentation URL
- `icon`: Custom icon
- `iconSize`: 'sm' | 'md' | 'lg'
- `showBadge`: Whether to show severity badge
- `dismissible`: Whether error can be dismissed
- `onDismiss`: Dismiss handler

## Usage Guidelines

When implementing data fetching components:

1. Use `LoadingState` for initial loading and subsequent data refreshes
2. Use `EmptyState` when there's no data available
3. Use `ErrorMessage` when errors occur, with appropriate recovery options
4. Maintain context during loading with progressive loading patterns
5. Provide actionable guidance in empty states
6. Use appropriate severity levels for different error types

### Example Implementation

```tsx
import { useState, useEffect } from 'react'
import LoadingState from './components/LoadingState'
import EmptyState from './components/EmptyState'
import ErrorMessage from './components/ErrorMessage'

function DataComponent() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getData()
      setData(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <LoadingState contentType="data" />
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        retryText="Try Again"
        onRetry={fetchData}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        actionText="Refresh"
        onAction={fetchData}
      />
    )
  }

  return (
    <div>
      {/* Render actual data */}
    </div>
  )
}
``` 