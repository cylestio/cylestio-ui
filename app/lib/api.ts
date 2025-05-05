/**
 * API service for making requests to the Cylestio API
 */

// The base URL for the API - using direct connection to API server
// This allows the frontend to directly connect to the API URL
export const API_BASE_URL = process.env.CYLESTIO_SERVER_URL || 'http://127.0.0.1:8000';

// Path prefix for API endpoints - adjust this to match your API structure
// Empty string means no prefix, otherwise should end with a slash
export const API_PATH_PREFIX = '';

// Track in-flight requests to avoid duplicates
const pendingRequests = new Map<string, Promise<any>>();

// Simple throttle to avoid flooding the server with requests
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // ms between requests

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
  
  // Create a request key for deduplication
  const requestKey = `${url}:${JSON.stringify(options)}`;
  
  // Check if this exact request is already in flight
  if (pendingRequests.has(requestKey)) {
    console.log(`Reusing in-flight request to: ${url}`);
    return pendingRequests.get(requestKey) as Promise<T>;
  }
  
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

  // Basic throttling
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();

  // Make the API request and store the promise
  console.log(`Making API request to: ${url}`);
  const fetchPromise = (async () => {
    try {
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
    } finally {
      // Remove this request from pending requests after completion
      pendingRequests.delete(requestKey);
    }
  })();
  
  // Store the promise for potential reuse
  pendingRequests.set(requestKey, fetchPromise);
  
  return fetchPromise;
}

/**
 * Build query parameters for API requests
 * Handles special cases like arrays (ids=[1,2,3] becomes ids=1,2,3)
 */
export function buildQueryParams(params: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    
    if (Array.isArray(value)) {
      queryParams.append(key, value.join(','));
    } else if (value instanceof Date) {
      queryParams.append(key, value.toISOString());
    } else {
      queryParams.append(key, String(value));
    }
  }
  
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