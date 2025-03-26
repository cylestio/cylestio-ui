import { AxiosError } from 'axios';
import { ApiErrorResponse } from './client';

/**
 * Formats request parameters, especially handling date objects
 * @param params The parameters to format
 * @returns Formatted parameters
 */
export function formatRequestParams(params: Record<string, any>): Record<string, any> {
  const formattedParams: Record<string, any> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    // Skip null or undefined values
    if (value === null || value === undefined) return;
    
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      formattedParams[key] = value.toISOString();
    } else {
      formattedParams[key] = value;
    }
  });
  
  return formattedParams;
}

/**
 * Extract a user-friendly error message from an API error
 * @param error The axios error object
 * @returns A formatted error message
 */
export function extractErrorMessage(error: AxiosError<ApiErrorResponse>): string {
  if (!error.response) {
    return error.message || 'Network error occurred';
  }
  
  const { data } = error.response;
  
  if (data.message) {
    return data.message;
  }
  
  if (data.detail?.errors?.length) {
    return data.detail.errors.map(err => `${err.field}: ${err.message}`).join(', ');
  }
  
  return 'An unexpected error occurred';
}

/**
 * Parse the error details from an API error
 * @param error The axios error object
 * @returns An object with details about the error
 */
export function parseErrorDetails(error: AxiosError<ApiErrorResponse>) {
  return {
    message: extractErrorMessage(error),
    statusCode: error.response?.status,
    fieldErrors: error.response?.data?.detail?.errors || [],
    isNetworkError: !error.response,
    isClientError: error.response?.status ? error.response.status >= 400 && error.response.status < 500 : false,
    isServerError: error.response?.status ? error.response.status >= 500 : false
  };
} 