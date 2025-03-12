# Customization Guide

The `@cylestio/ui-dashboard` package is designed to be highly customizable to fit your application's design system and branding requirements.

## Styling Options

### Using Tailwind CSS Classes

All components accept a `className` prop that allows you to add custom Tailwind CSS classes:

```jsx
import { DashboardMetrics } from '@cylestio/ui-dashboard';

<DashboardMetrics 
  className="p-8 bg-slate-50 rounded-xl" 
  cardClassName="bg-white hover:bg-blue-50 transition-colors"
/>
```

### Component-Specific Styling

Many components have specific styling props:

```jsx
import { DashboardCharts } from '@cylestio/ui-dashboard';

<DashboardCharts 
  gridClassName="grid-cols-1 md:grid-cols-2 gap-8" 
  chartClassName="p-6 shadow-lg rounded-xl"
/>
```

## Customizing the Sidebar

The Sidebar component is highly customizable:

```jsx
import { Sidebar } from '@cylestio/ui-dashboard';
import { RocketIcon, ShieldIcon, SettingsIcon } from './icons';
import YourLogo from './YourLogo';

<Sidebar 
  logo={<YourLogo width={48} height={48} />}
  title="Your Dashboard" 
  navigation={[
    { name: 'Home', href: '/', icon: RocketIcon },
    { name: 'Security', href: '/security', icon: ShieldIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ]}
/>
```

## Theming with Tailwind

You can customize your application's theme by extending your Tailwind configuration:

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@cylestio/ui-dashboard/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

## Custom Charts

You can customize the charts with your own data and colors:

```jsx
import { DashboardCharts } from '@cylestio/ui-dashboard';

<DashboardCharts 
  data={[
    {
      id: 'agent-activity',
      title: 'Agent Activity',
      type: 'line',
      data: yourCustomData,
      categories: ['time', 'value'],
      colors: ['#0ea5e9', '#f97316'], // Custom colors
    },
  ]}
/>
```

## Creating Custom Components

You can create your own custom components that use the Cylestio UI Dashboard components as building blocks:

```jsx
import { DashboardMetrics, DashboardCharts } from '@cylestio/ui-dashboard';

export function CustomDashboard({ metricsData, chartsData }) {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
        <DashboardMetrics 
          data={metricsData} 
          cardClassName="bg-slate-50"
        />
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Performance Charts</h2>
        <DashboardCharts 
          data={chartsData}
          gridClassName="grid-cols-1 xl:grid-cols-3 gap-6" 
        />
      </div>
    </div>
  );
}
```

## Responsive Design

All components are built with responsive design in mind:

```jsx
<DashboardMetrics 
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" 
/>
```

## Dark Mode Support

The components support Tailwind's dark mode:

```jsx
// In your layout component
<div className="dark">
  <DashboardMetrics 
    className="dark:bg-gray-900" 
    cardClassName="dark:bg-gray-800 dark:text-white"
  />
</div>
```

Make sure your Tailwind config includes dark mode support:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  // rest of your config
};
```

## Internationalization (i18n)

You can provide translated content to all components:

```jsx
import { Sidebar } from '@cylestio/ui-dashboard';

// Example with i18n
const navigation = t => [
  { name: t('sidebar.dashboard'), href: '/', icon: HomeIcon },
  { name: t('sidebar.analytics'), href: '/analytics', icon: ChartBarIcon },
];

<Sidebar 
  title={t('app.title')}
  navigation={navigation(t)}
/>
```

## Accessibility

When customizing components, ensure you maintain good accessibility practices:

1. Maintain sufficient color contrast
2. Keep text readable
3. Ensure keyboard navigation works
4. Add appropriate ARIA attributes when needed

## Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Accessibility Guide](https://reactjs.org/docs/accessibility.html)
- [Next.js Internationalization](https://nextjs.org/docs/pages/building-your-application/routing/internationalization) 