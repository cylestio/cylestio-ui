# Cylestio UI Troubleshooting Guide

## Hydration Errors in Next.js

### Problem: React Hydration Errors

The dashboard was showing hydration errors like:
- "Error: Hydration failed because the initial UI does not match what was rendered on the server."
- "In HTML, <div> cannot be a descendant of <p>."
- "Error: There was an error while hydrating this Suspense boundary. Switched to client rendering."

### Root Causes and Solutions

1. **Invalid HTML Nesting**
   - **Issue**: Components were creating invalid HTML structure like placing `<div>` elements inside `<p>` tags
   - **Solution**: Updated components to use proper HTML nesting:
     - Changed `<pre>` to `<div>` in CodeBlock component
     - Replaced `<div>` with `<span>` in SimpleDonutChart
     - Fixed JsonViewer component to use Tremor's `<Text>` instead of `<div>`

2. **Outdated Next.js Version**
   - **Issue**: The application was using an outdated version of Next.js (14.2.26)
   - **Solution**: Updated to the latest Next.js version

## Fixing Hydration Errors

When encountering hydration errors:

1. **Identify Invalid HTML Nesting**:
   - Look for components that might be nesting block elements (`<div>`) inside inline elements (`<p>`, `<span>`)
   - Common culprits are custom components that render different HTML than expected

2. **Fix Component Markup**:
   - Replace `<div>` with `<span>` inside text elements
   - Use semantic HTML that follows proper nesting rules
   - Ensure Text components from UI libraries don't render as `<p>` tags with block elements inside

3. **Update Next.js and Dependencies**:
   ```bash
   npm install next@latest
   npm run clean
   npm run dev
   ```

## API Connection Issues

### Problem: Failed to load agents/events data

The UI was showing error messages like "Failed to load agents" and "Failed to load events" despite the API Status page showing "Connected".

### Root Causes and Solutions

1. **API Path Mismatch**
   - **Issue**: Components were making requests to incorrect API paths (e.g., `/api/agents/` instead of `/agents/`)
   - **Solution**: Updated all API endpoint paths in the components to match the actual API server paths

2. **Missing Endpoints in Mock API Server**
   - **Issue**: The mock API server didn't have implementations for all endpoints used by the UI
   - **Solution**: Added implementations for the missing endpoints:
     - `/api/v1/metrics/security`
     - `/api/v1/metrics/alerts/types`
     - Also added handlers for misrouted endpoints with redundant `/api/` prefix

3. **Inconsistent Error Handling**
   - **Issue**: Different components used different approaches to handle API errors
   - **Solution**: Standardized error handling using `createEnhancedApiError` throughout components

## Debugging API Issues

When experiencing API connection issues, you can use these steps to debug:

1. **Check API server is running**:
   ```bash
   curl http://localhost:8000/
   ```
   Should return: `{"status":"ok","version":"1.0.0"}`

2. **Test specific endpoints**:
   ```bash
   curl http://localhost:8000/api/v1/agents/
   curl http://localhost:8000/api/v1/events/
   ```

3. **Check browser console for errors**:
   - Open the browser developer tools (F12)
   - Look for network errors or JavaScript errors in the console

4. **View request URL in network tab**:
   - Verify that the request URLs match the expected API paths
   - Check for duplicate `/api/` segments in the URL

## Common Issues

1. **Duplicate API Prefixes**: 
   - The UI components might be adding `/api/` when the API client already includes it in the base URL
   - Solution: Make sure API calls use the correct path without duplicating `/api/`

2. **Mock API Server Endpoints**:
   - If you add new UI features that require new API endpoints, you must also update the mock API server
   - Add new endpoints to `scripts/mock-api-server.js`

3. **Module Resolution Errors**:
   - If you see `Cannot find module 'next/dist/pages/_error'` errors, try:
     ```bash
     npm run clean
     npm install
     npm run dev
     ```

## Running the Mock API Server

Always run the mock API server during development:

```bash
npm run mock-api
```

The mock server provides test data for all UI components and helps isolate frontend issues from backend dependencies.

## Real API Connection Issues

If you're having issues connecting to the real API server instead of the mock API:

1. **Verify Environment Configuration**
   - Make sure `.env.development` contains `NEXT_PUBLIC_USE_MOCK_API=false`
   - Ensure `API_BASE_URL` is set correctly without `/api/v1` at the end: `API_BASE_URL=http://localhost:8000`

2. **Check API Server Status**
   - Verify the real API server is running
   - Test with a direct request: `curl http://localhost:8000/api/v1/status`
   - Common issue: Missing API endpoints that exist in mock but not real API

3. **API Path Consistency Issues**
   - Components expecting data at `/agents` while API serves at `/api/v1/agents`
   - Response data format differences - mock returns data directly, real API may use `data.items`
   - Case sensitivity - check if real API uses camelCase vs snake_case

4. **Debugging Real API Access**
   - Run the app with additional debugging: `DEBUG=api:* npm run dev`
   - Monitor browser Network tab to see actual API URLs and responses
   - Check browser console for detailed API logs from the client

## Additional API Troubleshooting

When switching between mock and real API, you might encounter these issues:

1. **Different Response Structures**
   - Mock API may return: `{ data: {...} }`
   - Real API might return: `{ items: [...], total: 10, page: 1 }`
   - Fix: Update components to handle both formats

2. **Endpoint Path Differences**
   - Double check trailing slashes (real API may require them)
   - Ensure proper URL encoding for path parameters or query strings

3. **Pagination Parameter Format**
   - Mock: `?page=1&pageSize=10`
   - Real: `?page=1&page_size=10`
   - Verify parameters match what the server expects 