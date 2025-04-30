# Cylestio UI Spacing Implementation Guide

This guide provides instructions for developers on how to implement the new spacing system consistently across all screens in the Cylestio UI.

## Overview

We've created a set of standardized components to enforce consistent spacing and layout:

1. **PageTemplate** - Base layout for all main pages
2. **ContentSection** - Standard section with proper spacing
3. **MetricsDisplay** - Standard grid display for metric cards
4. **ChartsContainer** - Standard container for charts with proper spacing

## How to Use the Components

### 1. Page Template

Wrap your page with the `PageTemplate` component to ensure consistent page structure:

```tsx
import PageTemplate from '../components/PageTemplate';
import MetricCard from '../components/MetricCard';

export function MyPageComponent() {
  const [timeRange, setTimeRange] = useState('30d');
  
  const breadcrumbs = [
    { label: 'My Section', current: true }
  ];
  
  return (
    <PageTemplate
      title="My Section"
      description="Description of the section..."
      breadcrumbs={breadcrumbs}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    >
      {/* Page content goes here */}
    </PageTemplate>
  );
}
```

### 2. Metrics Display

Use the `MetricsDisplay` component to create a grid of metric cards:

```tsx
import MetricCard from '../components/MetricCard';
import MetricsDisplay from '../components/MetricsDisplay';
import { CpuChipIcon } from '@heroicons/react/24/outline';

// Your page component
function MyPage() {
  // ...other code...
  
  const metrics = [
    {
      title: 'Active Agents',
      value: 4,
      icon: <CpuChipIcon />,
      variant: 'primary',
      linkHref: '/agents'
    },
    {
      title: 'Security Alerts',
      value: 17,
      icon: <ShieldExclamationIcon />,
      variant: 'error',
      linkHref: '/security'
    }
    // Add more metrics...
  ];
  
  return (
    <PageTemplate title="Dashboard" /* other props... */>
      <MetricsDisplay
        metrics={metrics}
        metricCardComponent={MetricCard}
        columns={{ default: 1, md: 2, lg: 4 }}
      />
      
      {/* Other content */}
    </PageTemplate>
  );
}
```

### 3. Charts Container

Use the `ChartsContainer` for displaying charts with consistent spacing:

```tsx
import ChartsContainer from '../components/ChartsContainer';
import { AreaChart } from '@tremor/react';

// Your page component
function MyPage() {
  // ...other code...
  
  const charts = [
    {
      title: 'Requests Over Time',
      chart: <AreaChart data={requestsData} /* other props... */ />,
      width: 'full'
    },
    {
      title: 'Response Times',
      chart: <AreaChart data={responseTimeData} /* other props... */ />,
      width: 'half'
    }
    // Add more charts...
  ];
  
  return (
    <PageTemplate title="Dashboard" /* other props... */>
      {/* Metrics display */}
      
      <ChartsContainer 
        charts={charts}
        sectionTitle="Performance Metrics"
      />
      
      {/* Other content */}
    </PageTemplate>
  );
}
```

### 4. Content Section

Use `ContentSection` for other content that needs consistent section spacing:

```tsx
import ContentSection from '../components/ContentSection';
import { UsersIcon } from '@heroicons/react/24/outline';

<ContentSection
  title="User Activity"
  description="Overview of user activities in the system"
  icon={<UsersIcon className="w-6 h-6" />}
>
  {/* Section content */}
</ContentSection>
```

## Using Spacing Constants Directly

For cases where you need to apply spacing directly, use the constants from `spacing.ts`:

```tsx
import { SPACING } from '../components/spacing';

<div className={SPACING.TAILWIND.SECTION_MB}>
  {/* Content with section margin bottom */}
</div>

<div className={SPACING.TAILWIND.CARD}>
  {/* Content with card padding */}
</div>

<div className={SPACING.TAILWIND.GRID_GAP}>
  {/* Grid with standard gap */}
</div>
```

## Checking Your Implementation

After implementing the spacing system, verify that:

1. All pages have consistent outer padding (from PageContainer)
2. All section titles have the same spacing (from SectionHeader)
3. Card components have consistent internal padding
4. Grids have consistent gaps
5. The overall visual rhythm is maintained across different screens

## Getting Help

If you're unsure about how to implement spacing for a specific UI element, refer to:

1. This implementation guide
2. The `README-SPACING.md` document
3. The `spacing.ts` file for available constants

Remember that consistency is the primary goal - when in doubt, follow the patterns established in the Dashboard screen. 