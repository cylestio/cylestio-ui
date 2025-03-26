'use client';

import { useState, useEffect } from 'react';
import { checkApiStatus } from '../../lib/api/status';

export function ApiStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setChecking(true);
      try {
        const status = await checkApiStatus();
        setIsConnected(status);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  if (checking && isConnected === null) {
    return (
      <div className="text-xs text-gray-500 flex items-center">
        <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
        Checking API Connection...
      </div>
    );
  }

  return (
    <div className={`text-xs flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {isConnected ? 'API Connected' : 'API Disconnected'}
    </div>
  );
} 