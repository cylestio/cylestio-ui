import React, { useState, useEffect, useCallback } from 'react';
import { Card, Text, Metric, Flex, Button, Badge, ProgressBar } from '@tremor/react';
import { RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { API_BASE_URL } from '@/lib/api/client';
import { createEnhancedApiError } from '@/lib/api/client';
import { ErrorDisplay } from '@/components/ui/error-display';

// Determine if we're using mock API
const IS_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

interface ApiStatusData {
  status: string;
  version: string;
  uptime: number;
  server: string;
  service: string;
  environment: string;
}

export default function ApiStatusDashboard() {
  const [apiStatus, setApiStatus] = useState<ApiStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchApiStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get status from dedicated endpoint
      try {
        const response = await apiClient.get('/status');
        setApiStatus(response.data);
        setLastChecked(new Date());
        return;
      } catch (err) {
        console.log('Could not fetch from /status endpoint, trying root...');
      }
      
      // If that fails, try root endpoint
      const response = await apiClient.get('/');
      setApiStatus({
        status: response.data.status || 'connected',
        version: response.data.version || 'unknown',
        uptime: 100, // Assume 100% if not provided
        server: IS_MOCK_API 
          ? process.env.NEXT_PUBLIC_MOCK_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'
          : API_BASE_URL,
        service: response.data.service || 'cylestio-api',
        environment: response.data.environment || 'development'
      });
      setLastChecked(new Date());
    } catch (err) {
      console.error('Error fetching API status:', err);
      setError(createEnhancedApiError(err));
      
      // Set fallback status to show in UI
      setApiStatus({
        status: 'disconnected',
        version: 'unknown',
        uptime: 0,
        server: IS_MOCK_API 
          ? process.env.NEXT_PUBLIC_MOCK_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'
          : API_BASE_URL,
        service: 'cylestio-api',
        environment: 'unknown'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiStatus();
    // Set up polling for API status every 60 seconds
    const interval = setInterval(fetchApiStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchApiStatus]);

  if (error && !apiStatus) {
    return (
      <ErrorDisplay 
        error={error}
        title="Error checking API status"
        onRetry={fetchApiStatus}
      />
    );
  }

  const isConnected = apiStatus && apiStatus.status === 'connected';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">API Status</h2>
        <div className="flex items-center gap-2">
          {lastChecked && (
            <Text className="text-xs text-gray-500">
              {lastChecked.toLocaleTimeString()}
            </Text>
          )}
          <Button
            size="xs"
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchApiStatus}
            loading={loading}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <Flex className="justify-between items-center mb-4">
          <div>
            <Text>Status</Text>
            <div className="flex items-center mt-1">
              <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <Metric>{apiStatus?.status === 'connected' ? 'Connected' : 'Disconnected'}</Metric>
            </div>
          </div>
          <Badge size="xl" color={isConnected ? 'green' : 'red'}>
            API Status
            {isConnected ? ' Connected' : ' Disconnected'}
          </Badge>
        </Flex>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Text>API Server</Text>
            <div className="mt-1 font-medium">{apiStatus?.server || 'Unknown'}</div>
          </div>
          <div>
            <Text>Service</Text>
            <div className="mt-1 font-medium">{apiStatus?.service || 'Unknown'}</div>
          </div>
          <div>
            <Text>Environment</Text>
            <div className="mt-1 font-medium">{apiStatus?.environment || 'Unknown'}</div>
          </div>
          <div>
            <Text>Version</Text>
            <div className="mt-1 font-medium">{apiStatus?.version || 'Unknown'}</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <Text>Uptime</Text>
            <Text>{apiStatus?.uptime || 0}%</Text>
          </div>
          <ProgressBar value={apiStatus?.uptime || 0} color={isConnected ? 'green' : 'red'} />
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="mb-2">
          <Text>Diagnostics</Text>
        </div>
        
        {isConnected ? (
          <div className="space-y-4">
            <div className="p-3 border rounded-md bg-gray-50">
              <div className="font-medium">1. API Server</div>
              <div className="text-sm text-gray-600 mt-1">
                Ensure the API server is running and accessible at: {apiStatus?.server}
              </div>
            </div>
            
            <div className="p-3 border rounded-md bg-gray-50">
              <div className="font-medium">2. Network Connectivity</div>
              <div className="text-sm text-gray-600 mt-1">
                Check your network connection and ensure firewall rules allow access
              </div>
            </div>
            
            <div className="p-3 border rounded-md bg-gray-50">
              <div className="font-medium">3. Error Details</div>
              <div className="text-sm text-gray-600 mt-1">
                No errors
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 border rounded-md bg-red-50">
              <div className="font-medium text-red-700">API Connection Failed</div>
              <div className="text-sm text-red-600 mt-1">
                Could not connect to API server at {apiStatus?.server}
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="font-medium">Troubleshooting steps:</div>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Check if the API server is running</li>
                <li>Verify network connectivity to {apiStatus?.server}</li>
                <li>Check if authentication credentials are valid</li>
                <li>Check browser console for detailed error messages</li>
              </ol>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 