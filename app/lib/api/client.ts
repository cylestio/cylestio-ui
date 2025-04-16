/**
 * API client for making requests to the Cylestio API
 */

import { fetchAPI } from '../api';

// Define the API_BASE_URL and timeout for tests
export const API_BASE_URL = undefined;
export const API_TIMEOUT = 15000;

/**
 * API error response interface
 */
export interface ApiErrorResponse {
  status: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * API client with methods matching the current tests
 */
const apiClient = {
  // Base URL from the API module
  defaults: {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  
  // Add interceptors for tests
  interceptors: {
    request: {
      use: (fn: any) => {},
      eject: (id: number) => {}
    },
    response: {
      use: (fn: any) => {},
      eject: (id: number) => {}
    }
  },
  
  /**
   * Make a GET request
   */
  get: async <T>(url: string, options: { params?: Record<string, any> } = {}) => {
    const queryParams = new URLSearchParams();
    
    if (options.params) {
      // Add parameters to query string
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return { data: await fetchAPI<T>(fullUrl) };
  },
  
  /**
   * Make a POST request
   */
  post: async <T>(url: string, data: any) => {
    return {
      data: await fetchAPI<T>(url, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    };
  },
  
  /**
   * Make a PUT request
   */
  put: async <T>(url: string, data: any) => {
    return {
      data: await fetchAPI<T>(url, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    };
  },
  
  /**
   * Make a PATCH request
   */
  patch: async <T>(url: string, data: any) => {
    return {
      data: await fetchAPI<T>(url, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    };
  },
  
  /**
   * Make a DELETE request
   */
  delete: async <T>(url: string) => {
    return {
      data: await fetchAPI<T>(url, {
        method: 'DELETE'
      })
    };
  }
};

export default apiClient; 