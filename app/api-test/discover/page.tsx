'use client';

import { useState } from 'react';
import { Button, Card, Text, Title, TextInput } from '@tremor/react';

export default function DiscoverApiPage() {
  const [apiUrl, setApiUrl] = useState('http://127.0.0.1:8000');
  const [endpointPath, setEndpointPath] = useState('/security/alerts');
  const [result, setResult] = useState<string>('No test run yet');
  const [loading, setLoading] = useState<boolean>(false);
  const [responseData, setResponseData] = useState<any>(null);

  const testEndpoint = async () => {
    try {
      setLoading(true);
      setResult(`Testing endpoint: ${apiUrl}${endpointPath}`);
      
      // Try to access the endpoint
      const response = await fetch(`${apiUrl}${endpointPath}`);
      
      // Get the response as text first to handle non-JSON responses
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse as JSON
        data = JSON.parse(responseText);
        setResponseData(data);
      } catch {
        // If not JSON, show as text
        data = responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : '');
        setResponseData(null);
      }
      
      if (response.ok) {
        setResult(`Connection successful: Status ${response.status} ${response.statusText}`);
      } else {
        setResult(`Connection returned error: Status ${response.status} ${response.statusText}`);
      }
      
      console.log('Response:', data);
    } catch (error) {
      console.error('Test failed:', error);
      setResult(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
      setResponseData(null);
    } finally {
      setLoading(false);
    }
  };

  // Get available endpoints from FastAPI OpenAPI schema
  const discoverEndpoints = async () => {
    try {
      setLoading(true);
      setResult('Discovering available endpoints...');
      
      // FastAPI provides an OpenAPI schema at /openapi.json
      const response = await fetch(`${apiUrl}/openapi.json`);
      
      if (response.ok) {
        const data = await response.json();
        setResponseData(data);
        
        // Extract and format the endpoints
        const endpoints = Object.keys(data.paths || {});
        if (endpoints.length > 0) {
          setResult(`Found ${endpoints.length} endpoints`);
          console.log('Available endpoints:', endpoints);
        } else {
          setResult('No endpoints found in the OpenAPI schema');
        }
      } else {
        setResult(`Failed to get OpenAPI schema: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Discover failed:', error);
      setResult(`Discover operation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Title>API Discovery Tool</Title>

      <Card className="p-4">
        <Text className="mb-4">Test any API endpoint to see if it exists</Text>
        
        <div className="space-y-4">
          <div>
            <Text>API Base URL</Text>
            <TextInput
              placeholder="API Base URL"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Text>Endpoint Path</Text>
            <TextInput
              placeholder="Endpoint Path (e.g., /security/alerts)"
              value={endpointPath}
              onChange={(e) => setEndpointPath(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testEndpoint}
              loading={loading}
            >
              Test Endpoint
            </Button>
            
            <Button 
              onClick={discoverEndpoints}
              loading={loading}
              variant="secondary"
            >
              Discover Available Endpoints
            </Button>
          </div>
          
          <Card className="p-2 bg-gray-50">
            <Text>{result}</Text>
          </Card>
          
          {responseData && (
            <div className="mt-4">
              <Text className="font-medium mb-2">Response Data:</Text>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-80">
                <pre>{JSON.stringify(responseData, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 