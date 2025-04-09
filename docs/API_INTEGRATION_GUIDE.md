# Cylestio UI API Integration Guide

## Important: Always Use the Real API

⚠️ **The Cylestio dashboard should ONLY use data from the real API server.**

- **Do NOT use mock data** in production code or any new features
- **Do NOT use direct database access** from UI components
- **Always use the standardized API client** to make requests

## Proper API Integration Pattern

Follow this pattern for all new API integrations:

### 1. Use Centralized API Endpoints

Always import and use endpoint constants from `app/lib/api-endpoints.ts`:

```typescript
import { AGENTS, TELEMETRY, SECURITY } from '../../lib/api-endpoints';

// Example:
const endpoint = AGENTS.LIST; // '/v1/agents'
const detailEndpoint = AGENTS.DETAIL(agentId); // '/v1/agents/{agentId}'
```

### 2. Use the API Client

Always use the `fetchAPI` function from `app/lib/api.ts`:

```typescript
import { fetchAPI, buildQueryParams } from '../../lib/api';

// Define the response type for type safety
type MyResponseType = {
  items: any[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

// Build parameters
const params = {
  page: 1,
  page_size: 10,
  search: 'keyword'
};

// Make the API call with proper typing
const endpoint = `${AGENTS.LIST}${buildQueryParams(params)}`;
const response = await fetchAPI<MyResponseType>(endpoint);
```

### 3. Handle Errors Properly

Always include proper error handling:

```typescript
try {
  const response = await fetchAPI<MyResponseType>(endpoint);
  // Process data...
} catch (error: any) {
  console.error('Error fetching data:', error);
  // Show user-friendly error message
  // NEVER fall back to mock data
}
```

## Accessing API in Components

In React components, follow this pattern:

```typescript
'use client';
import { useState, useEffect } from 'react';
import { fetchAPI, buildQueryParams } from '../../lib/api';
import { ENDPOINT } from '../../lib/api-endpoints';

export function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          // Parameters here
        };
        
        const endpoint = `${ENDPOINT.LIST}${buildQueryParams(params)}`;
        const response = await fetchAPI(endpoint);
        
        setData(response.items || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [/* dependencies */]);
  
  // Render with data, loading, and error states
}
```

## Anti-Patterns to Avoid

❌ **Never import mock data files**
```typescript
// DON'T DO THIS:
import { mockAgents } from '../../mock-data/agents';
```

❌ **Never create hard-coded fallbacks**
```typescript
// DON'T DO THIS:
if (error) {
  // Don't set fake data on error
  setData([
    { id: 1, name: 'Fake Item 1' },
    { id: 2, name: 'Fake Item 2' }
  ]);
}
```

❌ **Never use database connections directly**
```typescript
// DON'T DO THIS:
const dbConnection = DbConnection.getInstance();
const dbUtils = new DbUtils(dbConnection);
const results = dbUtils.queryMany('SELECT * FROM agents');
```

## Why This Matters

- **Consistency**: All components use the same data source
- **Reliability**: API contract is maintained through all environments
- **Testability**: API integrations can be verified independently
- **Security**: Prevents accidental exposure of sensitive data patterns
- **Maintainability**: Changes to data structure only need updates in one place

By following these guidelines, we ensure that the Cylestio dashboard is production-ready, resilient, and properly integrated with the backend services. 