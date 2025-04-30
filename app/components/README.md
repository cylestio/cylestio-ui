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

## UI Components Documentation

### PageHeader Component

All pages should use the PageHeader component for consistent UI. The PageHeader provides a standard layout for:

1. Clean breadcrumbs with proper hierarchy 
2. Page title and description
3. Time range filter (when applicable)

Example usage:

```tsx
<PageHeader
  title="Dashboard" 
  description="Overview of your system metrics"
  breadcrumbs={[
    { label: 'Dashboard', current: true }
  ]}
  timeRange={timeRange}
  onTimeRangeChange={setTimeRange}
/>
```

#### Props:

- `title`: Page title
- `description`: (Optional) Page description
- `breadcrumbs`: Array of breadcrumb items
- `timeRange`: Current time range value
- `onTimeRangeChange`: Function to handle time range changes
- `className`: (Optional) Additional CSS classes
- `showTimeRangeFilter`: (Optional) Whether to show the time range filter (default: true)
- `children`: (Optional) Additional content to render after the header

#### Breadcrumb Items:

Each breadcrumb item should have:
- `label`: Display text
- `href`: Link path (optional for current item)  
- `current`: Boolean indicating if this is the current page 

## Layout Consistency Guidelines

To maintain visual consistency across all screens, follow these layout standards:

### Page Structure

1. Every page must use the `PageContainer` component as the root element:
   ```tsx
   <PageContainer>
     {/* Page content */}
   </PageContainer>
   ```

2. All pages must use the `PageHeader` component directly inside the container:
   ```tsx
   <PageContainer>
     <PageHeader
       title="Page Title"
       description="Page description that explains its value to users"
       breadcrumbs={breadcrumbItems}
       timeRange={timeRange}
       onTimeRangeChange={handleTimeRangeChange}
     />
     
     {/* Rest of page content */}
   </PageContainer>
   ```

3. Spacing standards:
   - All content sections should have a `mb-6` (margin-bottom) class
   - Content sections should be direct children of PageContainer
   - Filter bars should be placed immediately after the header with their own `mb-6` spacing

### Specific Components

1. **Metric Cards**: Always use a consistent Grid layout with gap-6 and mb-6:
   ```tsx
   <Grid numItemsMd={3} className="gap-6 mb-6">
     {/* Metric cards */}
   </Grid>
   ```

2. **Tabs**: Tabs should be placed below filters with mb-6 spacing:
   ```tsx
   <TabGroup className="mb-6">
     {/* Tab content */}
   </TabGroup>
   ```

3. **Filter Bars**: Should be placed below headers with the same width:
   ```tsx
   <div className="mb-6">
     <FilterBar filters={filterOptions} onFilterChange={handleFilterChange} />
   </div>
   ```

4. **Tables**: Should be placed in Cards with consistent padding:
   ```tsx
   <Card className="mb-6">
     <Table>
       {/* Table content */}
     </Table>
   </Card>
   ``` 