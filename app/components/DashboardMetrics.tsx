'use client';

import { useEffect, useState } from 'react';
import { Card, Metric, Text, Flex, Grid } from '@tremor/react';
import { 
  ClockIcon, 
  ExclamationTriangleIcon, 
  ShieldExclamationIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

// In a real implementation, this would fetch from the API
async function fetchMetrics() {
  try {
    const response = await fetch('/api/metrics');
    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching metrics:', error);
    // Return fallback data for development
    return {
      totalRequests: 1254,
      avgResponseTime: 320,
      blockedRequests: 12,
      suspiciousRequests: 48
    };
  }
}

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    blockedRequests: 0,
    suspiciousRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const getMetrics = async () => {
      setLoading(true);
      const data = await fetchMetrics();
      setMetrics(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    };

    getMetrics();
    
    // Set up polling every 30 seconds
    const interval = setInterval(getMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        {lastUpdated && (
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </div>
        )}
      </div>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" className="space-x-4">
            <BoltIcon className="h-8 w-8 text-blue-500" />
            <div>
              <Text>Total Requests</Text>
              <Metric>{loading ? '...' : metrics.totalRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="teal">
          <Flex justifyContent="start" className="space-x-4">
            <ClockIcon className="h-8 w-8 text-teal-500" />
            <div>
              <Text>Avg Response Time</Text>
              <Metric>{loading ? '...' : `${metrics.avgResponseTime.toLocaleString()} ms`}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="red">
          <Flex justifyContent="start" className="space-x-4">
            <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
            <div>
              <Text>Blocked Requests</Text>
              <Metric>{loading ? '...' : metrics.blockedRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <Flex justifyContent="start" className="space-x-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
            <div>
              <Text>Suspicious Requests</Text>
              <Metric>{loading ? '...' : metrics.suspiciousRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>
    </div>
  );
} 