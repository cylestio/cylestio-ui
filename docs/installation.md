# Installation Guide

## Installing as an NPM Package

The Cylestio UI Dashboard is available as an npm package, making it easy to integrate into your existing applications.

### Prerequisites

- Node.js (v16.0.0 or higher)
- A React project (preferably using Next.js 13+ with App Router)

### Installation Steps

1. Install the package using your preferred package manager:

```bash
# Using npm
npm install @cylestio/ui-dashboard

# Using yarn
yarn add @cylestio/ui-dashboard

# Using pnpm
pnpm add @cylestio/ui-dashboard
```

2. Install peer dependencies if not already present:

```bash
npm install react react-dom next
```

### Configuration

1. Create or update your `tailwind.config.js` file to include the required paths:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@cylestio/ui-dashboard/**/*.{js,ts,jsx,tsx}', // Add this line
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

2. If you're using Next.js, update your `next.config.js` to handle the dependencies:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cylestio/ui-dashboard'],
  // Your other Next.js config
};

module.exports = nextConfig;
```

## Basic Usage

### Importing Components

```jsx
import { 
  Sidebar, 
  DashboardMetrics, 
  DashboardCharts 
} from '@cylestio/ui-dashboard';
```

### Example Implementation

```jsx
// app/dashboard/page.tsx
'use client';

import { Sidebar, DashboardCharts, DashboardMetrics } from '@cylestio/ui-dashboard';

export default function DashboardPage() {
  const metricsData = [
    { title: 'Total Agents', value: '47', change: 12, changeType: 'increase' },
    { title: 'Active Sessions', value: '153', change: 8, changeType: 'increase' },
    { title: 'Alerts', value: '3', change: 2, changeType: 'decrease' },
    { title: 'Avg. Response Time', value: '245ms', change: 18, changeType: 'decrease' },
  ];

  const chartsData = [
    {
      id: 'agent-activity',
      title: 'Agent Activity (24h)',
      type: 'line',
      data: [
        { time: '00:00', value: 10 },
        { time: '04:00', value: 5 },
        { time: '08:00', value: 15 },
        { time: '12:00', value: 30 },
        { time: '16:00', value: 40 },
        { time: '20:00', value: 25 },
      ],
      categories: ['time', 'value'],
    },
    // More charts...
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <DashboardMetrics data={metricsData} />
        <DashboardCharts data={chartsData} />
      </main>
    </div>
  );
}
```

## Integration with Cylestio Monitor

To use with the Cylestio Monitor package for live data:

```jsx
import { useEffect, useState } from 'react';
import { CylestioMonitor } from '@cylestio/monitor';
import { 
  LoadingSpinner, 
  DashboardMetrics, 
  DashboardCharts 
} from '@cylestio/ui-dashboard';

export default function LiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const monitor = new CylestioMonitor({
      apiKey: process.env.NEXT_PUBLIC_CYLESTIO_API_KEY,
      endpoint: process.env.NEXT_PUBLIC_CYLESTIO_ENDPOINT,
    });
    
    async function fetchData() {
      setLoading(true);
      try {
        const result = await monitor.getAgentMetrics();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (loading) return <LoadingSpinner size="lg" />;
  
  return (
    <div className="p-4">
      <DashboardMetrics data={data?.metrics} />
      <DashboardCharts data={data?.charts} />
    </div>
  );
}
```

## Next Steps

- Check out the [API Reference](./api-reference.md) for detailed component documentation
- See [Customization](./customization.md) for styling and theming options
- Read [Deployment](./deployment.md) for production deployment guidelines 