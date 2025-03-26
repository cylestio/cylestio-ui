'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';

interface ConnectionStatusProps {
  className?: string;
}

interface ApiStatusResponse {
  status: 'connected' | 'disconnected' | 'error';
  apiServer?: string;
  apiStatus?: string;
  service?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Component to display the connection status and controls
 * for the Cylestio API server connection
 */
export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [statusDetails, setStatusDetails] = useState<ApiStatusResponse | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(new Date());
  const [pollingInterval, setPollingIntervalState] = useState(5000);
  const [isChecking, setIsChecking] = useState(false);
  
  // Check API connection status
  const checkConnection = async () => {
    if (isChecking) return; // Prevent multiple simultaneous checks
    
    setIsChecking(true);
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json() as ApiStatusResponse;
        setIsConnected(data.status === 'connected');
        setStatusDetails(data);
        setLastUpdateTime(new Date());
      } else {
        setIsConnected(false);
        setStatusDetails({
          status: 'error',
          error: 'Failed to fetch API status'
        });
      }
    } catch (error) {
      setIsConnected(false);
      setStatusDetails({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsChecking(false);
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
  
  // Check connection manually
  const manualConnectionCheck = async () => {
    await checkConnection();
  };
  
  // Update polling interval
  const updatePollingInterval = (interval: number) => {
    setPollingIntervalState(interval);
  };
  
  // Get status color based on connection state
  const getStatusColor = () => {
    if (isChecking) return 'bg-yellow-500';
    if (isConnected === null) return 'bg-gray-500';
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };
  
  // Get status text based on connection state
  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isConnected === null) return 'Unknown';
    return isConnected ? 'Connected' : 'Disconnected';
  };
  
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
        <span className="text-sm text-gray-600">
          {getStatusText()}
          {statusDetails?.service && isConnected && ` to ${statusDetails.service}`}
        </span>
      </div>
      
      <div className="text-xs text-gray-500">
        Last update: {getTimeSinceLastUpdate()}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={manualConnectionCheck}
          disabled={isChecking}
          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check Now'}
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
      
      {statusDetails?.error && (
        <div className="text-xs text-red-600">
          Error: {statusDetails.error}
        </div>
      )}
    </div>
  );
} 