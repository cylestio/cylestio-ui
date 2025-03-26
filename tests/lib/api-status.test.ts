import { checkApiStatus } from '../../app/lib/api/status';
import apiClient from '../../app/lib/api/client';

// Mock the API client
jest.mock('../../app/lib/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('API Status Utility', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns true when API is available', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { status: 'ok' },
    });

    const result = await checkApiStatus();
    
    expect(result).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith('/');
  });

  test('returns false when API returns non-ok status', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { status: 'error' },
    });

    const result = await checkApiStatus();
    
    expect(result).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith('/');
  });

  test('returns false when API call throws an error', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await checkApiStatus();
    
    expect(result).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith('/');
  });
}); 