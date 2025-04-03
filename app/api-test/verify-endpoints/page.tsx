'use client';

import { useState } from 'react';
import { Button, Card, Text, Title, Badge, Flex, Grid } from '@tremor/react';
import { SECURITY, EVENTS, SESSIONS, AGENTS } from '../../lib/api-endpoints';

type EndpointTest = {
  name: string;
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  message: string;
};

export default function VerifyEndpointsPage() {
  const [results, setResults] = useState<EndpointTest[]>([
    { name: 'Alerts', endpoint: SECURITY.ALERTS, status: 'pending', message: 'Not tested yet' },
    { name: 'Alert Metrics', endpoint: SECURITY.ALERT_METRICS, status: 'pending', message: 'Not tested yet' },
    { name: 'Events', endpoint: EVENTS.LIST, status: 'pending', message: 'Not tested yet' },
    { name: 'Event Metrics', endpoint: EVENTS.EVENT_METRICS, status: 'pending', message: 'Not tested yet' },
    { name: 'Sessions', endpoint: SESSIONS.LIST, status: 'pending', message: 'Not tested yet' },
    { name: 'Session Metrics', endpoint: SESSIONS.SESSION_METRICS, status: 'pending', message: 'Not tested yet' },
    { name: 'Agents', endpoint: AGENTS.LIST, status: 'pending', message: 'Not tested yet' },
    { name: 'Agent Metrics', endpoint: AGENTS.AGENT_METRICS, status: 'pending', message: 'Not tested yet' },
  ]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [apiServerUrl, setApiServerUrl] = useState<string>(process.env.NEXT_PUBLIC_API_SERVER_URL || 'http://127.0.0.1:8000');

  const testEndpoint = async (index: number) => {
    const endpoint = results[index];
    
    try {
      setResults(prev => {
        const updated = [...prev];
        updated[index] = {
          ...endpoint,
          status: 'pending',
          message: 'Testing...',
        };
        return updated;
      });
      
      // Try to directly access the API endpoint
      const response = await fetch(`${apiServerUrl}${endpoint.endpoint}?page=1&page_size=10`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(prev => {
          const updated = [...prev];
          updated[index] = {
            ...endpoint,
            status: 'success',
            message: `Status: ${response.status} | Items: ${data.items?.length || 'N/A'}`,
          };
          return updated;
        });
      } else {
        setResults(prev => {
          const updated = [...prev];
          updated[index] = {
            ...endpoint,
            status: 'error',
            message: `Error: ${response.status} ${response.statusText}`,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error(`Test failed for ${endpoint.name}:`, error);
      setResults(prev => {
        const updated = [...prev];
        updated[index] = {
          ...endpoint,
          status: 'error',
          message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        };
        return updated;
      });
    }
  };

  const testAllEndpoints = async () => {
    setLoading(true);
    
    for (let i = 0; i < results.length; i++) {
      await testEndpoint(i);
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <Title>API Endpoints Verification</Title>
      <Text>This page tests connectivity to all major API endpoints.</Text>
      
      <Flex justifyContent="between" alignItems="center">
        <Text>API Server URL: {apiServerUrl}</Text>
        <Button 
          onClick={testAllEndpoints}
          loading={loading}
        >
          Test All Endpoints
        </Button>
      </Flex>
      
      <Grid numItemsMd={2} className="gap-6">
        {results.map((result, index) => (
          <Card key={index} className="p-4">
            <Flex justifyContent="between">
              <div>
                <Text className="font-medium">{result.name}</Text>
                <Text className="text-xs text-gray-600">{result.endpoint}</Text>
              </div>
              <Badge
                color={
                  result.status === 'success' ? 'green' 
                  : result.status === 'error' ? 'red' 
                  : 'gray'
                }
              >
                {result.status === 'pending' ? 'Pending' : result.status === 'success' ? 'Success' : 'Error'}
              </Badge>
            </Flex>
            
            <Text className="mt-2 text-sm">{result.message}</Text>
            
            <Button 
              size="xs" 
              variant="secondary" 
              onClick={() => testEndpoint(index)}
              className="mt-2"
              disabled={loading}
            >
              Test Endpoint
            </Button>
          </Card>
        ))}
      </Grid>
    </div>
  );
} 