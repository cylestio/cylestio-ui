# Using the Mock API Server

This document explains how to run the Cylestio UI dashboard with either the real API server or the mock API server.

## Configuration Options

The application supports two modes of operation:

1. **Default Mode**: Uses the real API server running on port 8000
2. **Mock Mode**: Uses the mock API server running on port 8080

## Environment Files

Three environment files control the application's behavior:

- `.env.example`: Template with all available options
- `.env.local`: Local development using the real API (default)
- `.env.mock`: Local development using the mock API

## Running in Default Mode

Default mode connects to the real API server running on port 8000:

```bash
# Start the UI in default mode
npm run dev
```

## Running in Mock Mode

Mock mode starts both the mock API server and the UI application:

```bash
# Start both the mock API server and the UI application
npm run dev:mock
```

This command:
1. Starts the mock API server on port 8080
2. Sets environment variables to use the mock API
3. Starts the Next.js development server 

## Manual Setup (Alternative)

If you prefer to manually control the servers:

1. Start the mock API server:
```bash
npm run mock-api
```

2. In a new terminal, start the UI in mock mode:
```bash
env-cmd -f .env.mock npm run dev
```

## Environment Variables

Key environment variables that control this behavior:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_USE_MOCK_API` | Whether to use mock API | `false` |
| `MOCK_API_PORT` | Port for mock API server | `8080` |
| `NEXT_PUBLIC_MOCK_API_URL` | URL for mock API | `http://localhost:8080/api/v1` |
| `API_BASE_URL` | URL for real API (when not using mock) | `http://localhost:8000/api/v1` |

## Verifying Which API Server is Being Used

To verify which API server your application is using:

1. Open your browser's developer console
2. Look for the startup log message: `API Client Configuration: {...}`
3. Check the `useMockApi` value and `baseUrl` to confirm

## Adding New Endpoints to Mock API

If you add new UI features that require new API endpoints:

1. Add the endpoint implementations to `scripts/mock-api-server.js`
2. Make sure the response data structure matches what the UI expects
3. Test both in mock mode and with the real API to ensure compatibility 