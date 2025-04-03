/**
 * API service for making requests to the Cylestio API
 */

// The base URL for the API - using direct connection to API server
// This allows the frontend to directly connect to the API URL
export const API_BASE_URL = 'http://127.0.0.1:8000';

// Path prefix for API endpoints - adjust this to match your API structure
// Empty string means no prefix, otherwise should end with a slash
export const API_PATH_PREFIX = '';

/**
 * Generic function to make API requests with appropriate error handling
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Add the path prefix to the endpoint if needed
  const adjustedEndpoint = endpoint.startsWith('/') 
    ? `${API_PATH_PREFIX}${endpoint}` 
    : `${API_PATH_PREFIX}/${endpoint}`;
    
  const url = `${API_BASE_URL}${adjustedEndpoint}`;
  
  // Set default headers for JSON API
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Merge default options with provided options
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log(`Making API request to: ${url}`);
    // Make the API request
    const response = await fetch(url, requestOptions);

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
      );
    }

    // Parse and return the JSON response
    return await response.json();
  } catch (error) {
    // Log the error and rethrow it
    console.error(`Error in API request to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Helper function to build query parameters
 */
export function buildQueryParams(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  
  // Add each parameter to the query string if it has a value
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Type for pagination parameters
 */
export type PaginationParams = {
  page?: number;
  page_size?: number;
};

/**
 * Type for common filter parameters
 */
export type TimeRangeParams = {
  time_range?: string;
  from_time?: string;
  to_time?: string;
};

/**
 * Type for common search parameters
 */
export type SearchParams = {
  search?: string;
}; 