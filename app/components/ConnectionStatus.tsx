'use client';

import React, { useState, useEffect } from 'react';

interface ConnectionStatusProps {
  className?: string;
}

/**
 * Component to display the connection status and controls
 * for the Cylestio database connection
 */
export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(new Date());
  const [pollingInterval, setPollingIntervalState] = useState(5000);
  
  // Check DB connection status
  const checkConnection = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        setIsConnected(true);
        setLastUpdateTime(new Date());
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };
  
  useEffect(() => {
    // Initial connection check
    checkConnection();
    
    // Set up polling interval
    const interval = setInterval(() => {
      checkConnection();
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [pollingInterval]);
  
  // Calculate time since last update
  const getTimeSinceLastUpdate = () => {
    if (!lastUpdateTime) return 'No updates yet';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdateTime.getTime();
    
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)} seconds ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    return `${Math.floor(diff / 3600000)} hours ago`;
  };
  
  // Toggle connection (this would ideally connect/disconnect from the DB)
  const toggleConnection = async () => {
    try {
      const action = isConnected ? 'disconnect' : 'connect';
      const response = await fetch(`/api/status?action=${action}`, { method: 'POST' });
      if (response.ok) {
        setIsConnected(!isConnected);
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
    }
  };
  
  // Update polling interval
  const updatePollingInterval = (interval: number) => {
    setPollingIntervalState(interval);
  };
  
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div className="text-xs text-gray-500">
        Last update: {getTimeSinceLastUpdate()}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={toggleConnection}
          className={`text-xs px-2 py-1 rounded ${
            isConnected
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
        
        <select
          onChange={(e) => updatePollingInterval(Number(e.target.value))}
          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700"
          value={pollingInterval}
        >
          <option value="1000">1s</option>
          <option value="2000">2s</option>
          <option value="5000">5s</option>
          <option value="10000">10s</option>
          <option value="30000">30s</option>
        </select>
      </div>
    </div>
  );
} 