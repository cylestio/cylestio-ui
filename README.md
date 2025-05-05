# @cylestio/ui-dashboard

[![CI/CD](https://github.com/cylestio/cylestio-ui/actions/workflows/main.yml/badge.svg)](https://github.com/cylestio/cylestio-ui/actions)
[![npm version](https://badge.fury.io/js/%40cylestio%2Fui-dashboard.svg)](https://www.npmjs.com/package/@cylestio/ui-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Enterprise-grade dashboard components for monitoring AI agent activities and security metrics, designed to integrate with [Cylestio Monitor](https://github.com/cylestio/cylestio-monitor).

![Dashboard Preview](public/images/dashboard-preview.png)

## Installation

This project is currently meant to be used by cloning the repository and running it locally:

```bash
# Clone the repository
git clone https://github.com/cylestio/cylestio-ui.git
cd cylestio-ui

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at http://localhost:3000.

> **Note:** While this package is published to npm as `@cylestio/ui-dashboard`, the recommended approach is to clone and run the repository directly as outlined above.

## Configuration Options

### Configuring the UI Port

By default, the UI runs on port 3000. To change this, you can specify a different port when starting the development server:

```bash
# Run on port 4000 instead of the default 3000
npm run dev -- -p 4000
```

Or set it permanently in your package.json:

```json
"scripts": {
  "dev": "next dev -p 4000"
}
```

### Configuring the API Server URL

By default, the UI connects to an API server at `http://localhost:8000` or `http://127.0.0.1:8000`. There are several ways to configure a different API server URL:

#### Using a .env.local File (Recommended)

Create a `.env.local` file in the project root:

```
CYLESTIO_SERVER_URL=http://your-api-server:9000
```

This is the recommended approach as Next.js will automatically load environment variables from this file.

#### Using Command Line with Next.js Environment Variables

```bash
# For Mac/Linux
CYLESTIO_SERVER_URL=http://your-api-server:9000 npm run dev

# For Windows (PowerShell)
$env:CYLESTIO_SERVER_URL="http://your-api-server:9000"; npm run dev

# For Windows (CMD)
set CYLESTIO_SERVER_URL=http://your-api-server:9000 && npm run dev
```

> **Note:** Using regular shell exports like `export CYLESTIO_SERVER_URL=...` won't work because Next.js needs the environment variable to be available when it starts.

#### Manual Configuration

You can also modify the API server URL directly in `app/lib/api.ts`:

```typescript
export const API_BASE_URL = 'http://your-api-server:9000';
```

## Quick Start

### Running the Dashboard Locally

After installing and starting the dev server per the instructions above, you can access the dashboard at http://localhost:3000.

### Using as a Component Library (Advanced)

If you need to use this as a component library in another project:

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

- [Quick Start Guide](docs/QUICKSTART.md)
- [Installation Guide](docs/installation.md)
- [API Reference](docs/api-reference.md)
- [Customization Guide](docs/customization.md)
- [API Integration Guide](docs/API_INTEGRATION_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Integration with Cylestio Monitor

```jsx
import { useEffect, useState } from 'react'
import { CylestioMonitor } from '@cylestio/monitor'
import { DashboardMetrics, DashboardCharts, LoadingSpinner } from '@cylestio/ui-dashboard'

function MonitoringDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const monitor = new CylestioMonitor({
      apiKey: process.env.NEXT_PUBLIC_CYLESTIO_API_KEY,
      endpoint: process.env.NEXT_PUBLIC_CYLESTIO_ENDPOINT,
    })

    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await monitor.getAgentMetrics()
        setData(result)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="p-4">
      <DashboardMetrics data={data?.metrics} />
      <DashboardCharts data={data?.charts} />
    </div>
  )
}
```

## Requirements

- React 17+
- Next.js 13+ (with App Router)
- Node.js 16+

## Development

To contribute to this package:

1. Clone the repository: `git clone https://github.com/cylestio/cylestio-ui.git`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Building the Package

If you need to build the package for use in another project:

```bash
npm run build:package
```

### Known Development Issues

The project currently has some ESLint and TypeScript errors that may cause build failures but don't affect the development server functionality. These issues are being addressed in upcoming releases.

## Troubleshooting

### Common Issues

1. **Build Failures**: The project may fail to build due to ESLint/TypeScript errors. You can still run the development server with `npm run dev`.

2. **Missing Dependencies**: If you encounter errors related to missing modules, ensure you've installed all dependencies:
   ```bash
   npm install axios react-icons
   ```

3. **Package Installation Errors**: If you try to install `@cylestio/ui-dashboard` from npm, you may get a 404 error. This is expected - see the Installation instructions above for the correct approach.

4. **Port Conflicts**: If port 3000 is already in use, you'll see an error when starting the dev server. You can specify a different port as described in the [Configuration Options](#configuration-options) section:
   ```bash
   npm run dev -- -p 3001
   ```

5. **API Connection Issues**: If you see errors related to API connectivity:
   - Ensure your API server is running and accessible
   - Check that the CYLESTIO_SERVER_URL is correctly configured (default is http://localhost:8000)
   - Verify you're setting the environment variable correctly (see [Configuring the API Server URL](#configuring-the-api-server-url))
   - Note that `export CYLESTIO_SERVER_URL=...` won't work - use the methods described in the Configuration section
   - Look at your browser console for specific error messages
   - Test the API endpoint directly in your browser or with a tool like curl or Postman

### Getting Help

If you encounter issues not covered here, please [open an issue](https://github.com/cylestio/cylestio-ui/issues) on the GitHub repository.

## Publishing

This package is published to npm via GitHub Actions when a new release is created.

To create a new release:

1. Update the version in `package.json`
2. Update the `CHANGELOG.md`
3. Create a new GitHub release with the version as the tag name

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © Cylestio

## Testing Status

> **Note:** Tests are temporarily disabled during the UI revamp period.
>
> The testing infrastructure has been simplified to ensure smooth deployment to npm while the UI undergoes significant changes. Tests will be re-introduced after the UI revamp is complete.
