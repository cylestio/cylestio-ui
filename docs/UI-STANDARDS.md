# UI Standards - Page Structure

This document outlines the standard structure for pages in the application.

## Standard Page Structure

All main pages should use the `PageTemplate` component to ensure consistent layout and behavior.

```jsx
<PageTemplate
  title="Page Title"
  description="Brief description of the page"
  breadcrumbs={breadcrumbs}
  timeRange={timeRange}
  onTimeRangeChange={setTimeRange}
  headerContent={optionalHeaderContent}
  contentSpacing="default" // Controls spacing between content sections
>
  <ContentSection spacing="default">
    {/* Main content blocks */}
  </ContentSection>
  
  <ContentSection title="Section Title" spacing="default">
    {/* Additional content with a title */}
  </ContentSection>
</PageTemplate>
```

## Component Responsibilities

### PageTemplate
- Provides consistent structure for all pages
- Handles page header, breadcrumbs, time filters
- Manages spacing and layout
- Props:
  - `title`: Page title
  - `description`: Brief page description
  - `breadcrumbs`: Array of breadcrumb items
  - `timeRange`: Current time range selection
  - `onTimeRangeChange`: Handler for time range changes
  - `headerContent`: Optional content for the header section
  - `showTimeRangeFilter`: Whether to show time range filter (default: true)
  - `contentSpacing`: Controls spacing between sections ('default' or 'none')
  - `className`: Additional CSS classes

### ContentSection
- Provides consistent spacing and structure for content sections
- Handles optional section headers
- Props:
  - `title`: Optional section title
  - `description`: Optional section description
  - `icon`: Optional icon
  - `children`: Section content
  - `className`: Additional CSS classes
  - `rightContent`: Optional content for the right side of section header
  - `showDivider`: Whether to show a divider (default: true)
  - `spacing`: Controls section bottom margin ('default' or 'none')

## Spacing Guidelines

To ensure consistent spacing across all screens:

1. Always use the `PageTemplate` component for main pages
2. Always set `contentSpacing="default"` on PageTemplate to maintain consistent vertical spacing
3. Always use `ContentSection` components to wrap discrete content blocks
4. Always set `spacing="default"` on ContentSection components
5. Use spacing constants from `SPACING` for any custom spacing needs:
   - `SPACING.TAILWIND.SECTION_MB` for vertical spacing between sections
   - `SPACING.TAILWIND.HEADER_MB` for spacing after headers
   - `SPACING.TAILWIND.CARD` for padding inside cards
   - `SPACING.TAILWIND.PAGE_X` and `PAGE_Y` for page padding

## Examples

### Dashboard Page
```jsx
export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('30d');
  
  const breadcrumbs = [
    { label: 'Dashboard', current: true }
  ];

  return (
    <PageTemplate
      title="Dashboard"
      description="Overview of system performance"
      breadcrumbs={breadcrumbs}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      contentSpacing="default"
    >
      <ContentSection spacing="default">
        <MetricsOverview />
      </ContentSection>
      
      <ContentSection title="Usage Analytics" spacing="default">
        <UsageChart />
      </ContentSection>
    </PageTemplate>
  );
}
```

### List Page
```jsx
export default function ListPage() {
  const [timeRange, setTimeRange] = useState('7d');
  
  const breadcrumbs = [
    { label: 'Items', current: true }
  ];

  return (
    <PageTemplate
      title="Items"
      description="Manage your items"
      breadcrumbs={breadcrumbs}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      headerContent={<Button>Add New</Button>}
      contentSpacing="default"
    >
      <ContentSection spacing="default">
        <FilterBar />
      </ContentSection>
      
      <ContentSection spacing="default">
        <ItemsTable />
      </ContentSection>
    </PageTemplate>
  );
}
``` 