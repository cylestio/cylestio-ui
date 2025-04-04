import { AgentService, EventsService, AlertsService } from '../app/lib/api/services';
import apiClient from '../app/lib/api/client';

// Mock the axios client to prevent actual API calls
jest.mock('../app/lib/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockImplementation((url) => {
      // Mock responses based on the URL
      if (url.includes('/agents')) {
        return Promise.resolve({
          data: {
            items: [],
            total: 0,
            page: 1,
            page_size: 50
          }
        });
      } else if (url.includes('/events')) {
        return Promise.resolve({
          data: {
            items: [],
            total: 0,
            page: 1,
            page_size: 50
          }
        });
      } else if (url.includes('/alerts')) {
        return Promise.resolve({
          data: {
            items: [],
            total: 0,
            page: 1,
            page_size: 50
          }
        });
      }
      
      return Promise.resolve({ data: {} });
    })
  }
}));

describe('API Integration Tests', () => {
  test('Agents API service returns data', async () => {
    const response = await AgentService.getAll();
    expect(response).toBeDefined();
    expect(response.items).toBeDefined();
    expect(Array.isArray(response.items)).toBeTruthy();
  });

  test('Events API service returns data', async () => {
    const response = await EventsService.getAll();
    expect(response).toBeDefined();
    expect(response.items).toBeDefined();
    expect(Array.isArray(response.items)).toBeTruthy();
  });

  test('Alerts API service returns data', async () => {
    const response = await AlertsService.getAll();
    expect(response).toBeDefined();
    expect(response.items).toBeDefined();
    expect(Array.isArray(response.items)).toBeTruthy();
  });
}); 