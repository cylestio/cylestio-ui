'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';
import { Button, Card, Text, Title } from '@tremor/react';
import config from '../../config';

export default function ApiTestPage() {
  const [testResult, setTestResult] = useState<string>('No test run yet');
  const [loading, setLoading] = useState<boolean>(false);
  const [directResult, setDirectResult] = useState<string>('No direct test run yet');
  const [proxyResult, setProxyResult] = useState<string>('No proxy test run yet');

  // Use centralized configuration
  const apiServerUrl = config.api.serverUrl;

  const runApiTest = async () => {
    try {
      setLoading(true);
      setTestResult('Testing API connection...');
      
      // First try the /v1/health endpoint
      const result = await fetchAPI('/v1/health');
      setTestResult(`API connection successful: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('API test failed:', error);
      setTestResult(`API connection failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectConnection = async () => {
    try {
      setLoading(true);
      setDirectResult('Testing direct API connection...');
      
      // Try to directly access the API server without the proxy
      const response = await fetch(`${apiServerUrl}/docs`);
      
      if (response.ok) {
        setDirectResult(`Direct connection successful: Status ${response.status}`);
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

  const testProxyConnection = async () => {
    try {
      setLoading(true);
      setProxyResult('Testing proxy API connection...');
      
      // Try to access the API through our proxy
      const response = await fetch('/api/proxy/docs');
      
      if (response.ok) {
        setProxyResult(`Proxy connection successful: Status ${response.status}`);
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
      <Title>API Connection Test</Title>

      <Card className="p-4">
        <Text className="mb-4">Test the API connections to diagnose issues</Text>
        
        <div className="space-y-6">
          <div>
            <Button 
              onClick={runApiTest}
              loading={loading}
              className="mb-2"
            >
              Test API Connection using fetchAPI
            </Button>
            <Card className="p-2 bg-gray-50">
              <Text>{testResult}</Text>
            </Card>
          </div>

          <div>
            <Button 
              onClick={testDirectConnection}
              loading={loading}
              className="mb-2"
            >
              Test Direct Connection to API
            </Button>
            <Card className="p-2 bg-gray-50">
              <Text>{directResult}</Text>
            </Card>
          </div>

          <div>
            <Button 
              onClick={testProxyConnection}
              loading={loading}
              className="mb-2"
            >
              Test Proxy Connection to API
            </Button>
            <Card className="p-2 bg-gray-50">
              <Text>{proxyResult}</Text>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
} 