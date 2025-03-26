import { Alert, ApiResponse } from '@/types/api';
import apiClient from '../client';
import { formatRequestParams, parseApiDates, parseApiDatesList } from '../helpers';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Alert types
 */
export type AlertType = 'PROMPT_INJECTION' | 'SENSITIVE_INFORMATION' | 'HARMFUL_CONTENT' | 'ABNORMAL_BEHAVIOR' | 'RESOURCE_ABUSE';

/**
 * Parameters for alerts API requests
 */
export interface AlertServiceParams {
  page?: number;
  page_size?: number;
  agent_id?: string;
  severity?: AlertSeverity;
  alert_type?: AlertType;
  start_time?: Date | string;
  end_time?: Date | string;
  reviewed?: boolean;
}

/**
 * Service for interacting with the Alerts API
 */
export const AlertsService = {
  /**
   * Get a list of alerts with filtering
   * 
   * @param params - Filter parameters
   * @returns Paginated list of alerts
   */
  async getAll(params: AlertServiceParams = {}): Promise<ApiResponse<Alert>> {
    const formattedParams = formatRequestParams(params);
    const response = await apiClient.get('/v1/alerts', { params: formattedParams });
    
    // Parse date fields in the response
    const data = response.data;
    data.items = parseApiDatesList(data.items, ['timestamp', 'reviewed_at']);
    
    return data;
  },

  /**
   * Get a single alert by ID
   * 
   * @param alertId - The unique identifier of the alert
   * @returns Alert details
   */
  async getById(alertId: string): Promise<Alert> {
    const response = await apiClient.get(`/v1/alerts/${alertId}`);
    return parseApiDates(response.data, ['timestamp', 'reviewed_at']);
  },

  /**
   * Mark an alert as reviewed
   * 
   * @param alertId - The alert ID to mark as reviewed
   * @param reviewedBy - The identifier of the user performing the review
   * @returns Updated alert
   */
  async markAsReviewed(alertId: string, reviewedBy: string): Promise<Alert> {
    const response = await apiClient.patch(`/v1/alerts/${alertId}`, {
      reviewed: true,
      reviewed_by: reviewedBy
    });
    return parseApiDates(response.data, ['timestamp', 'reviewed_at']);
  },
  
  /**
   * Get alerts by agent ID
   * 
   * @param agentId - The agent ID to filter by
   * @param params - Additional filter parameters
   * @returns Paginated list of alerts for the agent
   */
  async getByAgentId(
    agentId: string,
    params: Omit<AlertServiceParams, 'agent_id'> = {}
  ): Promise<ApiResponse<Alert>> {
    return this.getAll({ ...params, agent_id: agentId });
  },
  
  /**
   * Get alerts by severity
   * 
   * @param severity - The severity level to filter by
   * @param params - Additional filter parameters
   * @returns Paginated list of alerts with the specified severity
   */
  async getBySeverity(
    severity: AlertSeverity,
    params: Omit<AlertServiceParams, 'severity'> = {}
  ): Promise<ApiResponse<Alert>> {
    return this.getAll({ ...params, severity });
  },
  
  /**
   * Get critical alerts
   * 
   * @param params - Additional filter parameters
   * @returns Paginated list of critical alerts
   */
  async getCritical(params: Omit<AlertServiceParams, 'severity'> = {}): Promise<ApiResponse<Alert>> {
    return this.getBySeverity('critical', params);
  },
  
  /**
   * Get alerts by type
   * 
   * @param alertType - The alert type to filter by
   * @param params - Additional filter parameters
   * @returns Paginated list of alerts of the specified type
   */
  async getByType(
    alertType: AlertType,
    params: Omit<AlertServiceParams, 'alert_type'> = {}
  ): Promise<ApiResponse<Alert>> {
    return this.getAll({ ...params, alert_type: alertType });
  },
  
  /**
   * Get unreviewed alerts
   * 
   * @param params - Additional filter parameters
   * @returns Paginated list of unreviewed alerts
   */
  async getUnreviewed(params: Omit<AlertServiceParams, 'reviewed'> = {}): Promise<ApiResponse<Alert>> {
    return this.getAll({ ...params, reviewed: false });
  },
  
  /**
   * Get alerts within a specific time range
   * 
   * @param startTime - Filter by alerts after this time
   * @param endTime - Filter by alerts before this time
   * @param params - Additional filter parameters
   * @returns Paginated list of alerts within the time range
   */
  async getByTimeRange(
    startTime: Date | string,
    endTime: Date | string,
    params: Omit<AlertServiceParams, 'start_time' | 'end_time'> = {}
  ): Promise<ApiResponse<Alert>> {
    return this.getAll({
      ...params,
      start_time: startTime,
      end_time: endTime
    });
  }
}; 