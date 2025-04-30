# Package Exports Guide

This document outlines the components that should be exported from the `@cylestio/ui-dashboard` package.

## Primary Components

These are the main components that should be exported in the `app/index.ts` file:

```typescript
// Core UI Components
export { default as Sidebar } from './components/Sidebar';
export { default as DashboardCharts } from './components/DashboardCharts';
export { default as DashboardMetrics } from './components/DashboardMetrics';
export { default as LoadingSpinner } from './components/LoadingSpinner';
export { default as MetricCard } from './components/MetricCard';
export { default as SimpleDonutChart } from './components/SimpleDonutChart';
export { default as StatusBadge } from './components/StatusBadge';
export { default as TimeRangeSelector } from './components/TimeRangeSelector';

// Layouts
export { default as RootLayout } from './layout';

// Pages
export { default as HomePage } from './page';
export { default as AlertsPage } from './alerts/page';
export { default as EventsPage } from './events/page';
export { default as AnalyticsPage } from './analytics/page';
export { default as SettingsPage } from './settings/page';

// Drilldown Components
export {
  DrilldownTable,
  DrilldownHeader,
  DrilldownSection,
  DrilldownChartElement,
  DrilldownCard,
  DrilldownTabs,
  BreadcrumbNavigation
} from './components/drilldown';

// Type definitions
export type { MetricCardProps } from './components/MetricCard';
export type { StatusType, StatusBadgeProps } from './components/StatusBadge';
export type { ChartData, ChartOptions } from './components/DashboardCharts';
export type { MetricData } from './components/DashboardMetrics';
export type { TimeRange } from './components/TimeRangeSelector';
```

## Component Dependencies

Ensure all exported components:

1. Have proper TypeScript type definitions
2. Do not depend on external unpublished libraries
3. Have all required dependencies listed in package.json
4. Are properly tested before release

## Validation Process

Before publishing:

1. Build the package: `npm run build:package`
2. Verify exports: `npm run verify:package`
3. Check the exported types in the `dist/index.d.ts` file
4. Ensure components can be imported correctly in a test project

## Missing Components

The following components are currently in the codebase but have TypeScript errors that need to be fixed before they can be safely exported:

- DrilldownMetricCard
- LLMRequestDetailPanel
- ToolUsageAnalysis

These should be added to the exports after fixing their TypeScript issues. 