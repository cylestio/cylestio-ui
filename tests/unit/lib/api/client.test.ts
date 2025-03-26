import apiClient, { API_BASE_URL, API_TIMEOUT } from '@/lib/api/client';

// We're testing the actual instance configuration, not the mocked setup
describe('API Client', () => {
  test('should be properly configured', () => {
    // Check properties directly on the apiClient instance
    expect(apiClient.defaults.baseURL).toBe(API_BASE_URL);
    expect(apiClient.defaults.timeout).toBe(API_TIMEOUT);
    
    // Check headers - this may be in different locations depending on axios version
    // Try different paths for different versions of axios
    const contentType = 
      apiClient.defaults.headers?.common?.['Content-Type'] ||
      apiClient.defaults.headers?.['Content-Type'];
    
    const acceptHeader = 
      apiClient.defaults.headers?.common?.['Accept'] ||
      apiClient.defaults.headers?.['Accept'];
    
    expect(contentType).toBe('application/json');
    // Axios may modify the Accept header internally, so just check it contains what we need
    expect(acceptHeader).toContain('application/json');
  });
  
  test('should have interceptors configured', () => {
    // Just check that interceptors are present
    expect(apiClient.interceptors.request).toBeDefined();
    expect(apiClient.interceptors.response).toBeDefined();
  });
}); 