'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Title, Text, Button, Grid, Flex, Metric, Divider } from '@tremor/react';
import { FaCheck, FaTimes, FaSync, FaInfoCircle } from 'react-icons/fa';

interface StatusResponse {
  status: 'connected' | 'disconnected' | 'error';
  apiServer: string;
  apiStatus: 'healthy' | 'unhealthy' | 'unknown';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
}

// Keep track of connection status history for uptime calculation
const historySize = 100;

export default function ApiStatusPage() {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState<boolean[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get('/api/status', { timeout: 5000 });
      setStatusData(response.data);
      
      // Record connection status in history
      const isConnected = response.data.status === 'connected';
      const newHistory = [...statusHistory, isConnected];
      if (newHistory.length > historySize) {
        newHistory.shift();
      }
      setStatusHistory(newHistory);
      setLastCheckTime(Date.now());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to API');
      const newHistory = [...statusHistory, false];
      if (newHistory.length > historySize) {
        newHistory.shift();
      }
      setStatusHistory(newHistory);
      setLastCheckTime(Date.now());
      
      // Create placeholder status object if we don't have data
      if (!statusData) {
        setStatusData({
          status: 'error',
          apiServer: 'unknown',
          apiStatus: 'unhealthy',
          service: 'unknown',
          version: 'unknown',
          environment: 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate uptime percentage
  const calculateUptime = () => {
    if (statusHistory.length === 0) return '0';
    const upCount = statusHistory.filter(status => status).length;
    const uptimePercentage = Math.round((upCount / statusHistory.length) * 100);
    return `${uptimePercentage}`;
  };
  
  // Determine status message and color based on connection status
  const statusMessage = statusData?.status === 'connected' 
    ? 'Connected' 
    : statusData?.status === 'disconnected' 
      ? 'Disconnected' 
      : 'Error';
  
  const statusColor = statusData?.status === 'connected' 
    ? 'emerald' 
    : statusData?.status === 'disconnected' 
      ? 'amber' 
      : 'rose';
  
  const IconComponent = statusData?.status === 'connected' 
    ? FaCheck
    : statusData?.status === 'disconnected' 
      ? FaSync
      : FaTimes;
  
  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl">
      <Title>API Status</Title>
      <Text>Detailed information about the API connection and health</Text>
      
      <Grid numItemsMd={2} className="mt-6 gap-6">
        {/* Main Status Card */}
        <Card className="p-6">
          <Flex justifyContent="between" alignItems="center">
            <Title>Status</Title>
            <Text>{lastCheckTime ? new Date(lastCheckTime).toLocaleString() : 'Checking...'}</Text>
          </Flex>
          
          <Flex justifyContent="start" alignItems="center" className="mt-4">
            {loading ? (
              <div className="animate-spin">
                <FaSync className="h-5 w-5 text-blue-500" />
              </div>
            ) : (
              <div className={`bg-${statusColor}-100 p-2 rounded-full`}>
                <IconComponent className={`h-5 w-5 text-${statusColor}-500`} />
              </div>
            )}
            <div className="ml-2">
              <Text>API Status</Text>
              <Text className={`text-${statusColor}-500 font-medium`}>
                {loading ? 'Checking...' : statusMessage}
              </Text>
            </div>
          </Flex>
          
          <Divider />
          
          <div className="mt-4">
            <Flex className="mt-2">
              <Text>API Server</Text>
              <Text>{statusData?.apiServer || 'Unknown'}</Text>
            </Flex>
            <Flex className="mt-2">
              <Text>Service</Text>
              <Text>{statusData?.service || 'Unknown'}</Text>
            </Flex>
            <Flex className="mt-2">
              <Text>Environment</Text>
              <Text>{statusData?.environment || 'Unknown'}</Text>
            </Flex>
            <Flex className="mt-2">
              <Text>Version</Text>
              <Text>{statusData?.version || 'Unknown'}</Text>
            </Flex>
          </div>
          
          <Button 
            size="xs" 
            className="mt-4"
            icon={FaSync}
            onClick={checkApiStatus}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Refresh'}
          </Button>
        </Card>
        
        {/* Uptime Card */}
        <Card className="p-6">
          <Title>Uptime</Title>
          <Metric className="mt-2">{calculateUptime()}%</Metric>
          <Text>Based on last {statusHistory.length} checks</Text>
          
          <Divider />
          
          <div className="mt-4">
            <Title className="text-sm">Connection History</Title>
            <div className="flex mt-2">
              {statusHistory.length === 0 ? (
                <Text>No connection data yet</Text>
              ) : (
                statusHistory.map((status, index) => (
                  <div 
                    key={index}
                    className={`h-2 w-2 rounded-full mx-0.5 ${status ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    title={`Check ${index + 1}: ${status ? 'Connected' : 'Disconnected'}`}
                  />
                ))
              )}
            </div>
          </div>
        </Card>
      </Grid>
      
      {/* Diagnostics Section */}
      <Card className="mt-6 p-6">
        <Flex alignItems="center">
          <Title>Diagnostics</Title>
          <FaInfoCircle className="h-5 w-5 ml-2 text-blue-500" />
        </Flex>
        
        <Text className="mt-2">
          If you're experiencing connectivity issues, check the following:
        </Text>
        
        <div className="mt-4 space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <Text className="font-medium">1. API Server</Text>
            <Text>Ensure the API server is running and accessible at: {statusData?.apiServer || 'Unknown'}</Text>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <Text className="font-medium">2. Network Connectivity</Text>
            <Text>Check your network connection and ensure firewall rules allow access</Text>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <Text className="font-medium">3. Error Details</Text>
            <Text className="font-mono text-xs whitespace-pre-wrap break-all">{error || 'No errors'}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
} 