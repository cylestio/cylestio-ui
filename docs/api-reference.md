# API Reference

This document provides detailed information about the components available in the `@cylestio/ui-dashboard` package.

## Components

### Sidebar

A navigation sidebar component that provides links to different sections of the dashboard.

```jsx
import { Sidebar } from '@cylestio/ui-dashboard';

<Sidebar 
  navigation={[
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon }
  ]}
  title="Custom Title" 
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `navigation` | `Array<{ name: string, href: string, icon?: Component }>` | Default navigation | Navigation items to display |
| `logo` | `ReactNode` | Cylestio logo | Custom logo component |
| `title` | `string` | "Cylestio Monitor" | Title to display in the sidebar |
| `className` | `string` | - | Additional CSS classes for the sidebar |
| `testId` | `string` | - | Test ID for testing purposes |

### DashboardMetrics

Displays key metrics in a grid of cards.

```jsx
import { DashboardMetrics } from '@cylestio/ui-dashboard';

<DashboardMetrics 
  data={[
    { 
      title: 'Total Agents', 
      value: '47', 
      change: 12, 
      changeType: 'increase' 
    },
    // More metrics...
  ]} 
  isLoading={false}
  cardClassName="custom-card-class"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Array<MetricsData>` | [] | Array of metrics to display |
| `isLoading` | `boolean` | false | Whether the component is in a loading state |
| `cardClassName` | `string` | - | Additional CSS classes for metric cards |
| `className` | `string` | - | Additional CSS classes for the container |
| `testId` | `string` | - | Test ID for testing purposes |

#### MetricsData Interface

```typescript
interface MetricsData {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: ReactNode;
}
```

### DashboardCharts

Renders a grid of charts for data visualization.

```jsx
import { DashboardCharts } from '@cylestio/ui-dashboard';

<DashboardCharts 
  data={[
    {
      id: 'agent-activity',
      title: 'Agent Activity (24h)',
      type: 'line',
      data: [
        { time: '00:00', value: 10 },
        // More data points...
      ],
      categories: ['time', 'value'],
    },
    // More charts...
  ]} 
  isLoading={false}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Array<ChartData>` | [] | Array of chart configurations |
| `isLoading` | `boolean` | false | Whether the component is in a loading state |
| `gridClassName` | `string` | - | Additional CSS classes for the grid |
| `chartClassName` | `string` | - | Additional CSS classes for individual charts |
| `className` | `string` | - | Additional CSS classes for the container |
| `testId` | `string` | - | Test ID for testing purposes |

#### ChartData Interface

```typescript
interface ChartData {
  id: string;
  title: string;
  data: Array<Record<string, any>>;
  categories?: string[];
  colors?: string[];
  type?: 'bar' | 'line' | 'area' | 'pie';
}
```

### LoadingSpinner

A spinner component for indicating loading states.

```jsx
import { LoadingSpinner } from '@cylestio/ui-dashboard';

<LoadingSpinner size="md" color="blue" />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | 'md' | Size of the spinner |
| `color` | `string` | 'blue' | Color of the spinner |
| `className` | `string` | - | Additional CSS classes |
| `testId` | `string` | - | Test ID for testing purposes |

## Page Components

The package exports pre-built page components that can be used directly:

- `HomePage` - The main dashboard page
- `AlertsPage` - Page for displaying security alerts
- `EventsPage` - Page for displaying agent events
- `AnalyticsPage` - Page for detailed analytics
- `SettingsPage` - Settings page

## Layout Component

### RootLayout

The main layout component that includes the Sidebar and content area.

```jsx
import { RootLayout } from '@cylestio/ui-dashboard';

<RootLayout>
  <YourContent />
</RootLayout>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to display in the main area | 