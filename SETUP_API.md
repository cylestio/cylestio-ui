# Setting Up Cylestio UI with the Real API

This document provides instructions for connecting the Cylestio UI to the real API server instead of using mock data.

## Configuration

1. Create a `.env.local` file in the root directory of the project with the following content:

```
# API Server URL - Replace with your actual API server URL
API_SERVER_URL=http://localhost:8080

# Other environment variables
NODE_ENV=development
USE_MOCK_DATA=false
```

2. Replace `http://localhost:8080` with the actual URL of your API server.

## API Proxy

The UI uses a proxy to forward requests to the API server. The proxy is configured in the following files:

- `app/lib/api.ts`: Contains utility functions for making API requests
- `app/api/proxy/[...path]/route.ts`: Next.js API route that proxies requests to the real API server

## API Endpoints

The UI expects the following API endpoints to be available on the server:

### Security Alerts
- `GET /v1/security/alerts`: Get a list of security alerts with pagination
- `GET /v1/metrics/security/alert_count`: Get alert count metrics (supports time_range, interval, dimensions)

### Events
- `GET /v1/events`: Get a list of events with pagination
- `GET /v1/events/:event_id`: Get details of a specific event
- `GET /v1/metrics/event/count`: Get event count metrics (supports time_range, interval, dimensions)

### Sessions
- `GET /v1/sessions`: Get a list of sessions with pagination
- `GET /v1/sessions/:session_id`: Get details of a specific session
- `GET /v1/sessions/:session_id/messages`: Get messages for a specific session
- `GET /v1/metrics/session/count`: Get session count metrics (supports time_range, interval, dimensions)

### Agents
- `GET /v1/agents`: Get a list of agents
- `GET /v1/agents/:agent_id`: Get details of a specific agent
- `GET /v1/metrics/agent/count`: Get agent count metrics

## Response Format

All API responses should follow this general format:

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total_items": 100,
    "total_pages": 10
  },
  "meta": {
    "time_period": "7d",
    "from_time": "2023-01-01T00:00:00Z",
    "to_time": "2023-01-07T23:59:59Z"
  }
}
```

## Troubleshooting

If you're encountering connection issues:

1. Ensure the API server is running and accessible
2. Check for CORS issues - the API server should allow requests from the UI's origin
3. Verify that all required endpoints are implemented on the API server
4. Check browser console for detailed error messages

## Development

When working on both the UI and API server:

1. Start the API server first
2. Start the UI development server with `npm run dev`
3. Any API changes may require restarting both servers 