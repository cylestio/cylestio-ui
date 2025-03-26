# Task: Set Up API Client Infrastructure

## Context
We're migrating the Cylestio UI dashboard from direct database connections to a REST API. Your task is to set up the foundational API client infrastructure that all other components will use.

## Requirements

1. Create a centralized API client using axios
2. Implement proper error handling
3. Set up request/response interceptors
4. Create common utility functions for API calls

## Detailed Steps

1. Create directory structure:
   - `app/lib/api/`
   - `app/lib/api/client.ts` (main API client)
   - `app/lib/api/utils.ts` (utility functions)

2. Implement API client in `app/lib/api/client.ts` with:
   - Base URL configuration (`http://localhost:8000/api/v1`)
   - Default headers
   - Timeout settings
   - Response interceptors for error handling

3. Implement utility functions in `app/lib/api/utils.ts`:
   - Function to format request parameters (especially date handling)
   - Error parsing and formatting

## Technical Details

The API client should be implemented using axios. Here's a reference for what to include:

```typescript
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

// Other code will go here
```

### Error Handling Requirements

When API calls fail, we need to extract the error message from the response and format it in a standardized way. Error responses from the API follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "detail": {
    "errors": [
      {
        "field": "field_name",
        "message": "Specific error message",
        "type": "error_type"
      }
    ]
  }
}
```

Your error handler should extract the most useful information for displaying to users.

## Resources

The API server will be running at `http://localhost:8000` with API endpoints accessible at `/api/v1/*`.

For details on the API structure and available endpoints, refer to the API documentation which outlines all available endpoints and their request/response formats.

## Deliverables

1. API client implementation in `app/lib/api/client.ts`
2. Utility functions in `app/lib/api/utils.ts`
3. Proper error handling implementation
4. Exported constants for API URL and other configuration

## References

- API Base URL: `http://localhost:8000/api/v1`
- API Documentation URL: `http://localhost:8000/docs`
- Axios Documentation: https://axios-http.com/docs/intro 

## Additional contenxt
All migration files and docs, as well as all development phases/prompts (this prompt is only one of them) can be found here in the directory "temp_migration"