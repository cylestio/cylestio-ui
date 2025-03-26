# API Client

This directory contains the centralized API client implementation for the Cylestio UI dashboard.

## Overview

The API client is built using axios and provides a standardized way to make HTTP requests to the backend API. It includes error handling, request/response interceptors, and utility functions for common API operations.

## Files

- **client.ts**: The main API client implementation with axios configuration and interceptors
- **utils.ts**: Utility functions for API calls, including parameter formatting and error handling
- **index.ts**: Entry point that exports the API client and utilities

## Usage

Import the API client in your components or services:

```typescript
import apiClient from '@/lib/api';

// Making a GET request
apiClient.get('/endpoint')
  .then(response => {
    // Handle success
    console.log(response.data);
  })
  .catch(error => {
    // Error is already formatted by the interceptor
    console.error(error.message);
  });

// Making a POST request with data
apiClient.post('/endpoint', { key: 'value' })
  .then(response => {
    // Handle success
  })
  .catch(error => {
    // Handle error
  });
```

## Error Handling

The API client includes automatic error handling through response interceptors. API errors are formatted to provide user-friendly messages, including field-specific validation errors when available.

## Utility Functions

### formatRequestParams

Formats request parameters, including converting Date objects to ISO strings and filtering out null/undefined values:

```typescript
import { formatRequestParams } from '@/lib/api';

const params = formatRequestParams({
  startDate: new Date(),
  endDate: new Date(),
  name: 'Test',
  nullValue: null // Will be excluded
});
```

### extractErrorMessage and parseErrorDetails

Extract user-friendly error messages and detailed information from API errors:

```typescript
import { extractErrorMessage, parseErrorDetails } from '@/lib/api';

try {
  // Make API call
} catch (error) {
  // Get a simple error message
  const message = extractErrorMessage(error);
  
  // Or get detailed error information
  const details = parseErrorDetails(error);
  if (details.isNetworkError) {
    // Handle network error
  } else if (details.isServerError) {
    // Handle server error
  }
}
```

## Configuration

The API client is configured with:

- Base URL: `http://localhost:8000/api/v1`
- Timeout: 30 seconds
- Default headers: Content-Type and Accept set to application/json 