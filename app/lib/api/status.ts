import apiClient from './client';

/**
 * Checks if the API is available by making a request to the root endpoint
 * @returns Promise<boolean> True if API is available, false otherwise
 */
export async function checkApiStatus(): Promise<boolean> {
  try {
    // Try the /status endpoint first
    try {
      const response = await apiClient.get('/status');
      return response.data.status === 'connected' || response.data.status === 'ok';
    } catch (error) {
      console.log('Status endpoint failed, trying root endpoint');
    }
    
    // Fall back to root endpoint
    const response = await apiClient.get('/');
    return response.data.status === 'ok' || response.data.status === 'connected';
  } catch (error) {
    console.error('API status check failed:', error);
    return false;
  }
} 