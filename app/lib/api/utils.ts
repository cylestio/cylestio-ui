/**
 * API utility functions
 */

import { formatRequestParams as formatParams, parseApiDates, parseApiDatesList } from './helpers';

// Re-export the helpers
export {
  parseApiDates,
  parseApiDatesList
};

// API Error Response interface
export interface ApiErrorResponse {
  status: string;
  message?: string;
  detail?: {
    errors?: Array<{
      field: string;
      message: string;
      type: string;
    }>;
  };
  errors?: Record<string, string[]>;
}

// Axios-like error interface for compatibility
export interface AxiosError<T = any> {
  response?: {
    data?: T;
    status?: number;
    statusText?: string;
  };
  request?: any;
  message?: string;
  code?: string;
  isAxiosError?: boolean;
}

// Error details interface
export interface ErrorDetails {
  message: string;
  statusCode?: number;
  fieldErrors: Array<{
    field: string;
    message: string;
    type: string;
  }>;
  isNetworkError: boolean;
  isClientError: boolean;
  isServerError: boolean;
}

/**
 * Format request parameters
 * This version matches the test expectations
 */
export function formatRequestParams(params: Record<string, any>): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    
    if (value instanceof Date) {
      result[key] = value.toISOString();
      return;
    }
    
    result[key] = value;
  });
  
  return result;
}

/**
 * Extract a human-readable error message from an API error response
 */
export function extractErrorMessage(error: AxiosError<ApiErrorResponse>): string {
  // If it's an API error with a response
  if (error.response?.data) {
    const { message, detail } = error.response.data;
    
    // Use the message if available
    if (message) {
      return message;
    }
    
    // Otherwise try to extract field errors
    if (detail?.errors && detail.errors.length > 0) {
      const fieldErrors = detail.errors
        .map(error => `${error.field}: ${error.message}`)
        .join(', ');
        
      if (fieldErrors) {
        return fieldErrors;
      }
    }
  }
  
  // Network error
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    return 'Network Error';
  }
  
  // Default fallback message
  return 'An unexpected error occurred';
}

/**
 * Parse API error into more detailed error object
 */
export function parseErrorDetails(error: AxiosError<ApiErrorResponse>): ErrorDetails {
  // Default error structure
  const details: ErrorDetails = {
    message: 'An unexpected error occurred',
    fieldErrors: [],
    isNetworkError: false,
    isClientError: false,
    isServerError: false
  };
  
  // Network error
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    return {
      message: 'Network Error',
      statusCode: undefined,
      fieldErrors: [],
      isNetworkError: true,
      isClientError: false,
      isServerError: false
    };
  }
  
  // If we have a response
  if (error.response) {
    const status = error.response.status;
    details.statusCode = status;
    
    // Extract message
    if (error.response.data?.message) {
      details.message = error.response.data.message;
    } else if (error.response.statusText) {
      details.message = error.response.statusText;
    }
    
    // Extract field errors
    if (error.response.data?.detail?.errors) {
      details.fieldErrors = error.response.data.detail.errors;
    }
    
    // Determine error type
    if (status >= 400 && status < 500) {
      details.isClientError = true;
    } else if (status >= 500) {
      details.isServerError = true;
    }
  }
  
  return details;
} 