'use client';

import { useEffect, useState } from 'react';
import { Card, Metric, Text, Flex, Grid } from '@tremor/react';
import { 
  ClockIcon, 
  ExclamationTriangleIcon, 
  ShieldExclamationIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

// Define metric data type
export interface MetricsData {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | string;
  icon?: React.ReactNode;
}

// Define props interface
export interface DashboardMetricsProps {
  data?: MetricsData[];
  isLoading?: boolean;
  className?: string;
  cardClassName?: string;
}

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

export default function DashboardMetrics({ 
  data, 
  isLoading: externalLoading, 
  className = '', 
  cardClassName = '' 
}: DashboardMetricsProps) {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    blockedRequests: 0,
    suspiciousRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Only fetch from API if no data is provided as props
    if (data) {
      setLoading(false);
      return;
    }

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
  }, [data]);

  // Use external loading state if provided
  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  // If data is provided through props, render those instead
  if (data && !isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
          {data.map((item, index) => (
            <Card 
              key={index} 
              decoration="top" 
              decorationColor={item.changeType === 'increase' ? 'blue' : 'red'}
              className={cardClassName}
            >
              <Flex justifyContent="start" className="space-x-4">
                {item.icon || <BoltIcon className="h-8 w-8 text-blue-500" />}
                <div>
                  <Text>{item.title}</Text>
                  <Metric>{item.value}</Metric>
                  {item.change && (
                    <Text color={item.changeType === 'increase' ? 'blue' : 'red'}>
                      {item.changeType === 'increase' ? '+' : '-'}{item.change}%
                    </Text>
                  )}
                </div>
              </Flex>
            </Card>
          ))}
        </Grid>
      </div>
    );
  }

  // Show loading skeleton if loading
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className={`animate-pulse ${cardClassName}`} data-testid="metric-skeleton">
              <div className="h-8 bg-gray-200 rounded mb-2 w-1/2"></div>
              <div className="h-10 bg-gray-300 rounded w-1/3"></div>
            </Card>
          ))}
        </Grid>
      </div>
    );
  }

  // Show empty state if no data
  if (!data && !metrics.totalRequests) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <p className="text-lg text-gray-500">No metrics available</p>
      </div>
    );
  }

  // Default view with API-fetched data
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        {lastUpdated && (
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </div>
        )}
      </div>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="blue" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <BoltIcon className="h-8 w-8 text-blue-500" />
            <div>
              <Text>Total Requests</Text>
              <Metric>{metrics.totalRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="teal" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <ClockIcon className="h-8 w-8 text-teal-500" />
            <div>
              <Text>Avg Response Time</Text>
              <Metric>{`${metrics.avgResponseTime.toLocaleString()} ms`}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="red" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
            <div>
              <Text>Blocked Requests</Text>
              <Metric>{metrics.blockedRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="amber" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
            <div>
              <Text>Suspicious Requests</Text>
              <Metric>{metrics.suspiciousRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>
    </div>
  );
} 