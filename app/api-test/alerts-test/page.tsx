'use client';

import { useState } from 'react';
import { Button, Card, Text, Title, Badge } from '@tremor/react';
import { SECURITY } from '../../lib/api-endpoints';

export default function AlertsTestPage() {
  const [directResult, setDirectResult] = useState<string>('No test run yet');
  const [proxyResult, setProxyResult] = useState<string>('No test run yet');
  const [loading, setLoading] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  const testDirectAlertsApi = async () => {
    try {
      setLoading(true);
      setDirectResult('Testing direct API connection to alerts endpoint...');
      
      // Try to directly access the alerts API endpoint with the new path
      const apiServerUrl = process.env.NEXT_PUBLIC_API_SERVER_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiServerUrl}${SECURITY.ALERTS}?page=1&page_size=10`);
      
      if (response.ok) {
        const data = await response.json();
        setDirectResult(`Direct connection successful: Got ${data.items?.length || 0} alerts`);
        console.log('Direct API response:', data);
        setAlerts(data.items || []);
      } else {
        setDirectResult(`Direct connection returned status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Direct test failed:', error);
      setDirectResult(`Direct connection failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testProxyAlertsApi = async () => {
    try {
      setLoading(true);
      setProxyResult('Testing proxy API connection to alerts endpoint...');
      
      // Try to access the alerts endpoint through our proxy with the new path
      const response = await fetch(`/api/proxy${SECURITY.ALERTS}?page=1&page_size=10`);
      
      if (response.ok) {
        const data = await response.json();
        setProxyResult(`Proxy connection successful: Got ${data.items?.length || 0} alerts`);
        console.log('Proxy API response:', data);
        setAlerts(data.items || []);
      } else {
        setProxyResult(`Proxy connection returned status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Proxy test failed:', error);
      setProxyResult(`Proxy connection failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Title>Alerts API Test</Title>

      <Card className="p-4">
        <Text className="mb-4">Test connections to the alerts API endpoint</Text>
        
        <div className="space-y-6">
          <div>
            <Button 
              onClick={testDirectAlertsApi}
              loading={loading}
              className="mb-2"
            >
              Test Direct Connection to Alerts API
            </Button>
            <Card className="p-2 bg-gray-50">
              <Text>{directResult}</Text>
            </Card>
          </div>

          <div>
            <Button 
              onClick={testProxyAlertsApi}
              loading={loading}
              className="mb-2"
            >
              Test Proxy Connection to Alerts API
            </Button>
            <Card className="p-2 bg-gray-50">
              <Text>{proxyResult}</Text>
            </Card>
          </div>

          {alerts.length > 0 && (
            <div>
              <Text className="font-medium">Received Alerts:</Text>
              <div className="mt-2 space-y-2">
                {alerts.map((alert, index) => (
                  <Card key={index} className="p-2">
                    <div className="flex justify-between">
                      <Text>{alert.description || 'No description'}</Text>
                      <Badge color="red">{alert.severity || 'Unknown'}</Badge>
                    </div>
                    <Text className="text-xs text-gray-500">
                      ID: {alert.alert_id || 'Unknown'}, 
                      Type: {alert.type || 'Unknown'}
                    </Text>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 