/**
 * Application configuration settings
 */

// Load from .env files if available
const useMockData = process.env.USE_MOCK_DATA === 'true' ? true : false;

export const config = {
  /**
   * Controls whether the application should use mock data when real data is not available.
   * When false, the UI will show appropriate error messages instead of mock data.
   * Set to true only for development or demonstration purposes.
   */
  useMockData: useMockData,
}; 