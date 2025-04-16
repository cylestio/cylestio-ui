/**
 * API service for alert-related operations
 */

import apiClient from '../client';
import { formatRequestParams, parseApiDates, parseApiDatesList } from '../helpers';
import { API_PATHS, Alert, ApiResponse, AlertType, AlertSeverity } from '@/types/api';

// Alert data interface
export interface Alert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed';
  agent_id: string;
  agent_name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

// Parameters for alerts service
export interface AlertServiceParams {
  page?: number;
  page_size?: number;
  agent_id?: string;
  severity?: AlertSeverity;
  alert_type?: AlertType;
  start_time?: Date | string;
  end_time?: Date | string;
  reviewed?: boolean;
  [key: string]: any;
}

// Alerts Service implementation
export const AlertsService = {
  /**
   * Get all alerts with optional filtering
   */
  getAll: async (params: AlertServiceParams = {}): Promise<ApiResponse<Alert>> => {
    const formattedParams = formatRequestParams(params);
    const response = await apiClient.get<ApiResponse<Alert>>('/v1/alerts', { params: formattedParams });
    
    const items = parseApiDatesList(response.data.items, ['timestamp', 'reviewed_at']);
    
    return {
      ...response.data,
      items
    };
  },
  
  /**
   * Get alert by ID
   */
  getById: async (alertId: string): Promise<Alert> => {
    const response = await apiClient.get<Alert>(`/v1/alerts/${alertId}`);
    return parseApiDates(response.data, ['timestamp', 'reviewed_at']);
  },
  
  /**
   * Mark an alert as reviewed
   */
  markAsReviewed: async (alertId: string, reviewedBy: string): Promise<Alert> => {
    const response = await apiClient.patch<Alert>(`/v1/alerts/${alertId}`, {
      reviewed: true,
      reviewed_by: reviewedBy
    });
    
    return parseApiDates(response.data, ['timestamp', 'reviewed_at']);
  },
  
  /**
   * Get alerts by agent ID
   */
  getByAgentId: async (agentId: string, params: AlertServiceParams = {}): Promise<ApiResponse<Alert>> => {
    return AlertsService.getAll({
      ...params,
      agent_id: agentId
    });
  },
  
  /**
   * Get alerts by severity
   */
  getBySeverity: async (severity: AlertSeverity, params: AlertServiceParams = {}): Promise<ApiResponse<Alert>> => {
    return AlertsService.getAll({
      ...params,
      severity
    });
  },
  
  /**
   * Get critical alerts (shorthand for severity='critical')
   */
  getCritical: async (params: AlertServiceParams = {}): Promise<ApiResponse<Alert>> => {
    return AlertsService.getBySeverity('critical', params);
  },
  
  /**
   * Get alerts by type
   */
  getByType: async (alertType: AlertType, params: AlertServiceParams = {}): Promise<ApiResponse<Alert>> => {
    return AlertsService.getAll({
      ...params,
      alert_type: alertType
    });
  },
  
  /**
   * Get unreviewed alerts
   */
  getUnreviewed: async (params: AlertServiceParams = {}): Promise<ApiResponse<Alert>> => {
    return AlertsService.getAll({
      ...params,
      reviewed: false
    });
  },
  
  /**
   * Get alerts within a time range
   */
  getByTimeRange: async (
    startTime: Date | string,
    endTime: Date | string,
    params: AlertServiceParams = {}
  ): Promise<ApiResponse<Alert>> => {
    return AlertsService.getAll({
      ...params,
      start_time: startTime,
      end_time: endTime
    });
  }
};

/**
 * Update alert status
 */
export function updateStatus(id: string, status: Alert['status']) {
  return apiClient.put(`/alerts/${id}/status`, { status });
} 