/**
 * Application configuration settings
 */

import rootConfig from '../../config';

// Export configuration values from the central config file
export const useMockData = false;
export const apiServerUrl = rootConfig.api.serverUrl;

// Export other configuration values
export const appConfig = {
  /**
   * Controls whether the application should use mock data when real data is not available.
   * When false, the UI will show appropriate error messages instead of mock data.
   * Set to true only for development or demonstration purposes.
   */
  useMockData,
  // Other application-specific config can go here
}; 