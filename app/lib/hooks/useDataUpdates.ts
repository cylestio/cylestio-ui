import { useEffect, useState, useCallback } from 'react';
import { DataUpdateService, DataUpdateType, DataUpdate } from '../../../src/lib/db/data-update-service';

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
  
  const [dataUpdateService, setDataUpdateService] = useState<DataUpdateService | null>(null);
  const [lastUpdate, setLastUpdate] = useState<DataUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Initialize the data update service
  useEffect(() => {
    // Import is done dynamically to avoid SSR issues
    if (typeof window !== 'undefined') {
      const service = DataUpdateService.getInstance({
        pollingInterval,
        autoStart
      });
      
      setDataUpdateService(service);
      setIsConnected(service.isConnected());
      
      return () => {
        service.stopPolling();
      };
    }
    
    return undefined;
  }, [pollingInterval, autoStart]);
  
  // Subscribe to update events
  useEffect(() => {
    if (!dataUpdateService) return undefined;
    
    // Create update handler
    const handleUpdate = (update: DataUpdate) => {
      setLastUpdate(update);
      if (onUpdate) {
        onUpdate(update);
      }
    };
    
    // Add connection status listener
    const handleConnection = ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
    };
    
    // Subscribe to update events
    updateTypes.forEach(type => {
      dataUpdateService.on(type, handleUpdate);
    });
    
    // Subscribe to connection events
    dataUpdateService.on('connection', handleConnection);
    
    // Unsubscribe on cleanup
    return () => {
      updateTypes.forEach(type => {
        dataUpdateService.off(type, handleUpdate);
      });
      dataUpdateService.off('connection', handleConnection);
    };
  }, [dataUpdateService, updateTypes, onUpdate]);
  
  // Toggle connection
  const toggleConnection = useCallback(() => {
    if (!dataUpdateService) return;
    
    if (dataUpdateService.isConnected()) {
      dataUpdateService.stopPolling();
    } else {
      dataUpdateService.startPolling();
    }
  }, [dataUpdateService]);
  
  // Set polling interval
  const setPollingInterval = useCallback((interval: number) => {
    if (!dataUpdateService) return;
    
    dataUpdateService.setPollingInterval(interval);
  }, [dataUpdateService]);
  
  return {
    lastUpdate,
    isConnected,
    toggleConnection,
    setPollingInterval
  };
} 