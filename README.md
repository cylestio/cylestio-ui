# @cylestio/ui-dashboard

[![CI/CD](https://github.com/cylestio/cylestio-ui/actions/workflows/main.yml/badge.svg)](https://github.com/cylestio/cylestio-ui/actions)
[![npm version](https://badge.fury.io/js/%40cylestio%2Fui-dashboard.svg)](https://www.npmjs.com/package/@cylestio/ui-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Enterprise-grade dashboard components for monitoring AI agent activities and security metrics, designed to integrate with [Cylestio Monitor](https://github.com/cylestio/cylestio-monitor).

![Dashboard Preview](public/images/dashboard-preview.png)

## Installation

```bash
npm install @cylestio/ui-dashboard
```

## Quick Start

```jsx
import { Sidebar, DashboardMetrics, DashboardCharts } from '@cylestio/ui-dashboard'

function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <DashboardMetrics data={yourMetricsData} />
        <DashboardCharts data={yourChartsData} />
      </main>
    </div>
  )
}
```

## Key Features

- 📊 **Pre-built Components**: Ready-to-use UI components for AI agent monitoring
- 🔄 **Cylestio Integration**: Seamless integration with [Cylestio Monitor](https://github.com/cylestio/cylestio-monitor)
- 🎨 **Customizable**: Fully customizable with Tailwind CSS
- 📱 **Responsive**: Mobile-friendly UI that works on all devices
- 🔒 **Secure**: Enterprise-grade security built-in
- 🌗 **Dark Mode**: Support for light and dark themes

## Documentation

For complete documentation, visit:

- [Installation Guide](docs/installation.md)
- [API Reference](docs/api-reference.md)
- [Customization Guide](docs/customization.md)
- [API Integration Guide](docs/API_INTEGRATION_GUIDE.md)

## Integration with Cylestio Monitor

```jsx
import { useEffect, useState } from 'react'
import { CylestioMonitor } from '@cylestio/monitor'
import { DashboardMetrics, DashboardCharts } from '@cylestio/ui-dashboard'

function MonitoringDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const monitor = new CylestioMonitor({
      apiKey: process.env.NEXT_PUBLIC_CYLESTIO_API_KEY,
    })

    const fetchData = async () => {
      const result = await monitor.getAgentMetrics()
      setData(result)
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return <div>Loading...</div>

  return (
    <div className="p-4">
      <DashboardMetrics data={data.metrics} />
      <DashboardCharts data={data.charts} />
    </div>
  )
}
```

## Advanced Usage

### Standalone Usage

You can use the components without integrating with Cylestio Monitor:

```jsx
import { AgentsList, SecurityAlerts } from '@cylestio/ui-dashboard'

function CustomDashboard({ agents, alerts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AgentsList agents={agents} />
      <SecurityAlerts alerts={alerts} />
    </div>
  )
}
```

### Theming

The dashboard supports custom theming:

```jsx
import { ThemeProvider } from '@cylestio/ui-dashboard'

function App() {
  return (
    <ThemeProvider theme={{
      colors: {
        primary: '#4f46e5',
        secondary: '#7c3aed',
        // ...other custom colors
      }
    }}>
      <YourDashboard />
    </ThemeProvider>
  )
}
```

## Requirements

- React 17+
- Next.js 13+ (with App Router)
- Node.js 16+

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © Cylestio
