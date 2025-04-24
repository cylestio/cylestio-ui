/**
 * Application-wide configuration settings
 */

export const appSettings = {
  /**
   * Agents configuration
   */
  agents: {
    /**
     * Time threshold in hours to consider an agent "active"
     * An agent that has activity within this time period is considered active
     */
    activeThresholdHours: 24,
    
    /**
     * Configuration for agent charts
     */
    charts: {
      /**
       * Whether to show the agent type distribution chart
       */
      showAgentTypeDistribution: false
    }
  },
  
  /**
   * Time range options for filtering
   */
  timeRanges: {
    default: '30d',
    options: ['24h', '7d', '30d']
  },
  
  /**
   * API configuration
   */
  api: {
    // Use the real API server, not the local mock API
    // This should match the API_BASE_URL and API_PATH_PREFIX from lib/api.ts
    baseUrl: ''  // Empty string means use the current host with the path prefix
  }
};

export default appSettings; 