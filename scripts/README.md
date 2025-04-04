# Scripts

This directory contains utility scripts used for development, testing, and deployment.

## Mock API Server

`mock-api-server.js` provides a simulated API server for local development and testing. This allows development to proceed without requiring a connection to the real backend API.

### Features

- Runs on port 8080 by default (configurable via `MOCK_API_PORT` environment variable)
- Implements key API endpoints including:
  - `/agents` - List and detail views of monitoring agents
  - `/events` - Security events with filtering and pagination
  - `/alerts` - Security alerts with severity levels
  - `/stats` - System statistics and metrics
  - `/users` - User management endpoints

### Usage

Start the mock API server:

```bash
npm run mock-api
```

Or run it alongside the UI application:

```bash
npm run dev:mock
```

### Configuration

The server can be configured via environment variables:

- `MOCK_API_PORT` - The port on which the server will listen (default: 8080)
- `MOCK_API_DELAY` - Simulated response delay in milliseconds (default: 200)

### Adding New Endpoints

To add new endpoints to the mock server:

1. Add a new route handler in `mock-api-server.js`:

```javascript
// Example new endpoint
app.get('/api/v1/new-resource', (req, res) => {
  res.json({
    items: [
      { id: 1, name: 'Resource 1' },
      { id: 2, name: 'Resource 2' }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      itemsPerPage: 10
    }
  });
});
```

2. Make sure the response format matches the real API response format

### Data Structure

The mock server uses consistent response structures:

- Collections return an object with `items` array and `pagination` object
- Detail views return a single object with the requested resource
- Errors return appropriate HTTP status codes with error messages

## Other Scripts

- `build-utils.js` - Utilities for the build process
- `deploy.js` - Deployment automation script 