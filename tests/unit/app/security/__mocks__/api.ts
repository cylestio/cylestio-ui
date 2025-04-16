// Mock API functions for testing
import { mockSecurityAlerts, mockAlertDetail, mockSecurityOverview, mockAlertsResponse } from '../mocks';

export const fetchAPI = jest.fn().mockImplementation((endpoint: string) => {
  // Mock different API endpoint responses based on the endpoint
  if (endpoint.includes('/v1/alerts?')) {
    return Promise.resolve(mockAlertsResponse);
  }
  
  if (endpoint.includes('/v1/alerts/overview')) {
    return Promise.resolve(mockSecurityOverview);
  }
  
  if (endpoint.match(/\/v1\/alerts\/[a-z0-9-]+/)) {
    return Promise.resolve(mockAlertDetail);
  }
  
  // Default fallback for unknown endpoints
  return Promise.resolve({});
});

export const buildQueryParams = jest.fn().mockImplementation((params: Record<string, any>) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}); 