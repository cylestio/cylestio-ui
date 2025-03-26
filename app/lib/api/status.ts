import apiClient from './client';

/**
 * Checks if the API is available by making a request to the root endpoint
 * @returns Promise<boolean> True if API is available, false otherwise
 */
export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await apiClient.get('/');
    return response.data.status === 'ok';
  } catch (error) {
    return false;
  }
} 