/**
 * Types for data updates in the application
 */

export enum DataUpdateType {
  ALL = 'all',
  EVENTS = 'events',
  SECURITY_ALERTS = 'security_alerts',
  PERFORMANCE_METRICS = 'performance_metrics',
  AGENTS = 'agents'
}

export interface DataUpdate {
  type: DataUpdateType;
  timestamp: string;
  data?: any;
}

export interface DataUpdateOptions {
  pollingInterval?: number;
  autoStart?: boolean;
} 