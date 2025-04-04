# Cylestio UI Quick Start Guide

This guide will help you set up and run the Cylestio UI for local development.

## Setup

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

## Development with Real API

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

## Development with Mock API

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

Once your development environment is running:

- Check out the dashboard at http://localhost:3000/dashboard
- Try the agents page at http://localhost:3000/agents
- View events at http://localhost:3000/events

For more detailed information, see:
- [Mock API Setup](./MOCK_API_SETUP.md)
- [Data Loading Fix](./DATA_LOADING_FIX.md) 