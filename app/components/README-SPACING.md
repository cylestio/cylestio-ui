# Cylestio UI Spacing System

This document provides a comprehensive guide to the spacing system in the Cylestio UI codebase, ensuring consistent layout and spacing across all screens.

## Core Components

The Cylestio UI uses the following core components for consistent layout and spacing:

### 1. PageTemplate

This is the main container for all primary pages. It provides consistent page structure, header, and spacing.

```tsx
import PageTemplate from '../components/PageTemplate';

export default function MyPage() {
  const [timeRange, setTimeRange] = useState('30d');
  
  const breadcrumbs = [
    { label: 'My Section', current: true }
  ];
  
  return (
    <PageTemplate
      title="My Section"
      description="Description of my section..."
      breadcrumbs={breadcrumbs}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      contentSpacing="default" // Use 'none' to disable standard content spacing
    >
      {/* Page content goes here */}
    </PageTemplate>
  );
}
```

### 2. ContentSection

Use ContentSection for all major content blocks within a page to ensure consistent vertical spacing.

```tsx
import ContentSection from '../components/ContentSection';

<ContentSection 
  title="Optional Section Title" 
  description="Optional description"
  spacing="default" // can be 'none' to disable standard spacing
>
  {/* Section content goes here */}
</ContentSection>
```

### 3. MetricsDisplay

For displaying metric cards in a grid with consistent spacing.

```tsx
import MetricsDisplay from '../components/MetricsDisplay';
import MetricCard from '../components/MetricCard';

const metrics = [
  {
    title: 'Total Users',
    value: '1,234',
    icon: <UsersIcon className="h-6 w-6" />,
    variant: 'primary'
  },
  // More metrics...
];

<MetricsDisplay
  metrics={metrics}
  columns={{ default: 1, sm: 2, lg: 4 }}
  metricCardComponent={MetricCard}
/>
```

### 4. ChartsContainer

For displaying charts with consistent spacing.

```tsx
import ChartsContainer from '../components/ChartsContainer';

const charts = [
  {
    title: 'Usage Over Time',
    chart: <MyChart data={chartData} />,
    width: 'full' // or 'half' for a half-width chart
  },
  // More charts...
];

<ChartsContainer charts={charts} />
```

## Spacing Constants

The spacing system defines standard spacing values in `app/components/spacing.ts`. Always use these constants instead of hardcoded values:

```tsx
import { SPACING } from '../components/spacing';

// For padding
<div className={SPACING.TAILWIND.PAGE_X}>
  {/* Content with standard horizontal page padding */}
</div>

// For margins
<div className={SPACING.TAILWIND.SECTION_MB}>
  {/* Content with standard section margin bottom */}
</div>

// For gaps
<div className={`grid grid-cols-2 ${SPACING.TAILWIND.GRID_GAP}`}>
  {/* Grid with standard gap */}
</div>
```

## Common Spacing Classes

| Class Name | Purpose | Applied Value |
|------------|---------|---------------|
| `SPACING.TAILWIND.PAGE_X` | Horizontal page padding | `px-4 sm:px-6 lg:px-8` |
| `SPACING.TAILWIND.PAGE_Y` | Vertical page padding | `py-6 sm:py-8` |
| `SPACING.TAILWIND.CARD` | Card padding | `p-4 sm:p-5 md:p-6` |
| `SPACING.TAILWIND.SECTION_MB` | Section margin bottom | `mb-6 sm:mb-8 md:mb-10` |
| `SPACING.TAILWIND.HEADER_MB` | Header margin bottom | `mb-4 sm:mb-6` |
| `SPACING.TAILWIND.ELEMENT_MB` | Element margin bottom | `mb-4 sm:mb-5` |
| `SPACING.TAILWIND.GRID_GAP` | Grid gap | `gap-4 sm:gap-6 md:gap-8` |
| `SPACING.TAILWIND.FLEX_GAP` | Flex gap | `gap-3 sm:gap-4` |

## Page Structure Pattern

Every page should follow this standard structure:

```tsx
<PageTemplate title="..." description="..." breadcrumbs={...} timeRange={...} onTimeRangeChange={...}>
  {/* Metrics section */}
  <ContentSection spacing="default">
    <MetricsDisplay metrics={...} />
  </ContentSection>
  
  {/* Filters section */}
  <ContentSection spacing="default">
    <MyFilterComponent />
  </ContentSection>
  
  {/* Charts section */}
  <ContentSection spacing="default">
    <ChartsContainer charts={...} />
  </ContentSection>
  
  {/* Table section */}
  <ContentSection spacing="default">
    <MyTableComponent />
  </ContentSection>
</PageTemplate>
```

## Component-Specific Guidelines

### Headers

- Use `PageHeader` within `PageTemplate` (automatic)
- Use `SectionHeader` for section titles (or within ContentSection with title prop)

### Cards

- Use `DashboardCard` for content cards with consistent padding
- Use `MetricCard` for metric displays

### Tables

- Always wrap tables in a `ContentSection`
- Use standard table components with consistent styling

## Responsive Behavior

The spacing system is designed to be responsive:

- Smaller spacing on mobile devices
- Medium spacing on tablets
- Larger spacing on desktops

Always use the spacing constants which include responsive variants.

## Common Mistakes to Avoid

1. ❌ Directly using hardcoded spacing classes like `space-y-6`
2. ❌ Adding custom padding/margins that don't match the system
3. ❌ Nesting `ContentSection` components (use `spacing="none"` for the inner one)
4. ❌ Using direct TailwindCSS classes for spacing rather than constants

## Best Practices

1. ✅ Use `PageTemplate` for every page
2. ✅ Wrap logical content sections in `ContentSection`
3. ✅ Use spacing constants from `spacing.ts`
4. ✅ Maintain consistent spacing between all UI elements
5. ✅ Test on multiple screen sizes to ensure responsive behavior

## Implementation Plan

1. ✅ Create centralized spacing definitions
2. ✅ Update core layout components:
   - ✅ PageContainer
   - ✅ PageHeader
   - ✅ SectionHeader
3. ✅ Update card components:
   - ✅ DashboardCard
   - ✅ MetricCard
4. ✅ Update layout helpers:
   - ✅ ResponsiveContainer
5. 🔲 Apply to all page implementations:
   - 🔲 Dashboard
   - 🔲 Agents Explorer
   - 🔲 Events Explorer
   - 🔲 Tools Explorer
   - 🔲 LLM Explorer
   - 🔲 Security Explorer

## Benefits

By implementing this spacing system, we achieve:

1. **Visual consistency** across all screens
2. **Easier maintenance** with centralized spacing definitions
3. **Improved responsive behavior** with structured breakpoints
4. **Better developer experience** with reusable spacing patterns

## Next Steps

- Apply these spacing constants to all remaining components
- Add component documentation referencing the spacing system
- Review all screens for visual consistency 