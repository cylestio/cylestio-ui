import { useEffect, useState, useCallback } from 'react';
import { DataUpdateType, DataUpdate } from '../types';

/**
 * Options for the useDataUpdates hook
 */
export interface UseDataUpdatesOptions {
  /**
   * Data update types to subscribe to
   * @default [DataUpdateType.ALL]
   */
  updateTypes?: DataUpdateType[];
  
  /**
   * Polling interval in milliseconds
   * @default 5000 (5 seconds)
   */
  pollingInterval?: number;
  
  /**
   * Whether to start polling automatically
   * @default true
   */
  autoStart?: boolean;
  
  /**
   * Callback function for handling updates
   */
  onUpdate?: (update: DataUpdate) => void;
}

/**
 * Result of the useDataUpdates hook
 */
export interface UseDataUpdatesResult {
  /**
   * Last received update
   */
  lastUpdate: DataUpdate | null;
  
  /**
   * Whether the data update service is connected
   */
  isConnected: boolean;
  
  /**
   * Toggle the connection status
   */
  toggleConnection: () => void;
  
  /**
   * Set the polling interval
   */
  setPollingInterval: (interval: number) => void;
}

/**
 * Hook for subscribing to real-time data updates
 * @param options Options for the hook
 * @returns Hook result
 */
export function useDataUpdates(options: UseDataUpdatesOptions = {}): UseDataUpdatesResult {
  const {
    updateTypes = [DataUpdateType.ALL],
    pollingInterval,
    autoStart = true,
    onUpdate
  } = options;
  
  const [lastUpdate, setLastUpdate] = useState<DataUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Mock implementation - in a real app, this would connect to a real-time API
  useEffect(() => {
    if (!autoStart) return;
    
    const interval = setInterval(() => {
      setIsConnected(true);
    }, pollingInterval || 5000);
    
    return () => clearInterval(interval);
  }, [autoStart, pollingInterval]);
  
  // Toggle connection - mock implementation
  const toggleConnection = useCallback(() => {
    setIsConnected(prev => !prev);
  }, []);
  
  // Set polling interval - mock implementation
  const setPollingInterval = useCallback(() => {
    // This would normally change the polling interval
  }, []);
  
  return {
    lastUpdate,
    isConnected,
    toggleConnection,
    setPollingInterval
  };
} 