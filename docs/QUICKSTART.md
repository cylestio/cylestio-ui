# Cylestio UI Quick Start Guide

This guide will help you get started with the Cylestio UI Dashboard.

## Using as an NPM Package

The easiest way to use Cylestio UI is to install it from npm:

```bash
npm install @cylestio/ui-dashboard
```

### Basic Implementation

```jsx
import { 
  Sidebar, 
  DashboardMetrics, 
  DashboardCharts 
} from '@cylestio/ui-dashboard';

export default function Dashboard() {
  // Example data
  const metricsData = [
    { title: 'Total Agents', value: '47', change: 12, changeType: 'increase' },
    { title: 'Active Sessions', value: '153', change: 8, changeType: 'increase' },
    { title: 'Alerts', value: '3', change: 2, changeType: 'decrease' },
    { title: 'Response Time', value: '245ms', change: 18, changeType: 'decrease' },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <DashboardMetrics data={metricsData} />
        <DashboardCharts data={yourChartsData} />
      </main>
    </div>
  );
}
```

### Configuration

1. Make sure your project includes the peer dependencies:
   - React 17+ or 18+
   - Next.js 13+ or 14+

2. If using Tailwind CSS, update your `tailwind.config.js`:

```js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './node_modules/@cylestio/ui-dashboard/**/*.{js,ts,jsx,tsx}', // Add this line
  ],
  // rest of your config
};
```

## Development of Cylestio UI (Contributors)

If you're contributing to this repository, follow these steps for local development:

1. **Clone the repository**

```bash
git clone https://github.com/cylestio/cylestio-ui.git
cd cylestio-ui
```

2. **Install dependencies**

```bash
npm install
```

3. **Choose your development mode**

You can run the UI in two modes:
- With the real API server (requires API access)
- With the mock API server (for isolated UI development)

### Development with Real API

This mode requires access to the actual Cylestio API server running on port 8000.

1. **Start the real API server** (if you have access to it)

```bash
# In a separate terminal
cd path/to/cylestio-api
npm run dev
```

2. **Start the UI development server**

```bash
npm run dev
```

The UI will be available at http://localhost:3000 and will connect to the real API at http://localhost:8000.

### Development with Mock API

This mode doesn't require the real API server and uses a mock implementation instead.

1. **Start the UI with mock API in a single command**

```bash
npm run dev:mock
```

This command starts both the mock API server (port 8080) and the UI development server with the correct configuration.

The UI will be available at http://localhost:3000 and will connect to the mock API at http://localhost:8080.

## Verifying API Mode

To verify which API your UI is connected to:

1. Open your browser's developer tools console
2. Look for the startup message: `API Client Configuration: {...}`
3. Check the `useMockApi` and `baseUrl` values

## Working with Environment Files

The repository includes three environment files:

- `.env.example` - Template with all available options
- `.env.local` - Used for development with the real API
- `.env.mock` - Used for development with the mock API

If you need to customize settings:

1. Create a copy of the relevant environment file
2. Make your changes
3. Use env-cmd to run with your custom file:

```bash
env-cmd -f .env.custom npm run dev
```

## Next Steps

- Check out the [Installation Guide](./installation.md) for detailed setup instructions
- See the [API Reference](./api-reference.md) for component documentation
- View the [Customization Guide](./customization.md) for styling options 