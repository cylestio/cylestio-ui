import { ApiResponse, PaginationParams } from '../../types/api';
import apiClient from './client';

/**
 * Format request parameters for API calls
 * Ensures consistent parameter formatting for API requests
 */
export function formatRequestParams(params: Record<string, any>): Record<string, string> {
  const formattedParams: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    // Skip undefined or null values
    if (value === undefined || value === null) return;
    
    // Convert arrays to comma-separated strings
    if (Array.isArray(value)) {
      formattedParams[key] = value.join(',');
    } 
    // Convert objects to JSON strings
    else if (typeof value === 'object') {
      formattedParams[key] = JSON.stringify(value);
    }
    // Convert Date objects to ISO strings
    else if (value instanceof Date) {
      formattedParams[key] = value.toISOString();
    }
    // Convert other values to strings
    else {
      formattedParams[key] = String(value);
    }
  });
  
  return formattedParams;
}

/**
 * Type-safe function for retrieving paginated data from the API
 */
export async function getPaginatedData<T>(
  endpoint: string, 
  params: Record<string, any> = {}
): Promise<ApiResponse<T>> {
  const formattedParams = formatRequestParams({
    ...params,
    page: params.page || 1,
    page_size: params.page_size || 50
  });
  
  const response = await apiClient.get(endpoint, { params: formattedParams });
  return response.data;
}

/**
 * Type-safe function for retrieving a single item from the API
 */
export async function getSingleItem<T>(
  endpoint: string, 
  id: string | number
): Promise<T> {
  const response = await apiClient.get(`${endpoint}/${id}`);
  return response.data;
}

/**
 * Parse ISO date strings to Date objects
 * Helper utility for converting API date strings
 */
export function parseApiDates<T>(data: T, dateFields: Array<keyof T>): T {
  const parsedData = { ...data };
  
  dateFields.forEach((field) => {
    const value = parsedData[field];
    if (typeof value === 'string') {
      try {
        // @ts-ignore - We know this is a valid assignment since we're checking the type
        parsedData[field] = new Date(value);
      } catch (e) {
        // If conversion fails, keep the original string
        console.warn(`Failed to parse date for field: ${String(field)}`);
      }
    }
  });
  
  return parsedData;
}

/**
 * Parses an array of objects, converting date fields to Date objects
 */
export function parseApiDatesList<T>(
  items: T[], 
  dateFields: Array<keyof T>
): T[] {
  return items.map(item => parseApiDates(item, dateFields));
} 