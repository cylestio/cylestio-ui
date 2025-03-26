'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { Card, Metric, Text, Flex, Grid } from '@tremor/react';
import { 
  FaServer, 
  FaClock, 
  FaExclamationTriangle, 
  FaBolt
} from 'react-icons/fa';
import { useDataUpdates } from '../lib/hooks/useDataUpdates';
import { DataUpdateType } from '../lib/types';
import { ConnectionStatus } from './ConnectionStatus';

type Metric = {
  name: string;
  stat: string | number;
  statLabel?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'moderateIncrease' | 'moderateDecrease' | 'unchanged';
  icon: React.ComponentType<any>;
  iconBgColor: string;
  iconTextColor: string;
};

export interface DashboardMetricsProps {
  metrics: Metric[];
  isLoading?: boolean;
  className?: string;
  cardClassName?: string;
}

// Default metrics for demo purposes
const defaultMetrics: Metric[] = [
  {
    name: 'Total Agents',
    stat: '42',
    change: 12,
    changeType: 'increase',
    icon: FaServer,
    iconBgColor: 'bg-blue-50',
    iconTextColor: 'text-blue-500',
  },
  {
    name: 'Uptime',
    stat: '99.9%',
    statLabel: '8m downtime',
    change: 0.1,
    changeType: 'moderateIncrease',
    icon: FaClock,
    iconBgColor: 'bg-emerald-50',
    iconTextColor: 'text-emerald-500',
  },
  {
    name: 'Alerts',
    stat: '3',
    statLabel: '0 critical',
    change: 25,
    changeType: 'decrease',
    icon: FaExclamationTriangle,
    iconBgColor: 'bg-amber-50',
    iconTextColor: 'text-amber-500',
  },
  {
    name: 'Processing Rate',
    stat: '1.2k',
    statLabel: 'logs/sec',
    change: 12.3,
    changeType: 'increase',
    icon: FaBolt,
    iconBgColor: 'bg-violet-50',
    iconTextColor: 'text-violet-500',
  },
];

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
  metrics, 
  isLoading: externalLoading, 
  className = '', 
  cardClassName = '' 
}: DashboardMetricsProps) {
  const [metricsData, setMetricsData] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    blockedRequests: 0,
    suspiciousRequests: 0
  });
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates
  const { lastUpdate, isConnected } = useDataUpdates({
    updateTypes: [
      DataUpdateType.EVENTS,
      DataUpdateType.SECURITY_ALERTS,
      DataUpdateType.PERFORMANCE_METRICS
    ],
    onUpdate: (update) => {
      // Handle different update types
      if (update.type === DataUpdateType.EVENTS || update.type === DataUpdateType.ALL) {
        // Update total requests count if new events arrived
        if (update.data && Array.isArray(update.data) && update.data.length > 0) {
          setMetricsData(prev => ({
            ...prev,
            totalRequests: prev.totalRequests + update.data.length
          }));
        }
      }

      if (update.type === DataUpdateType.SECURITY_ALERTS || update.type === DataUpdateType.ALL) {
        // Update security metrics if new alerts arrived
        if (update.data && Array.isArray(update.data) && update.data.length > 0) {
          const blockedCount = update.data.filter(alert => alert.action_taken === 'blocked').length;
          const suspiciousCount = update.data.filter(alert => 
            alert.action_taken !== 'blocked' && alert.severity !== 'LOW'
          ).length;
          
          setMetricsData(prev => ({
            ...prev,
            blockedRequests: prev.blockedRequests + blockedCount,
            suspiciousRequests: prev.suspiciousRequests + suspiciousCount
          }));
        }
      }

      if (update.type === DataUpdateType.PERFORMANCE_METRICS || update.type === DataUpdateType.ALL) {
        // Update performance metrics
        if (update.data && Array.isArray(update.data) && update.data.length > 0) {
          const responseTimeMetrics = update.data.filter(
            metric => metric.metric_type === 'response_time'
          );
          
          if (responseTimeMetrics.length > 0) {
            const avgTime = responseTimeMetrics.reduce(
              (sum, metric) => sum + metric.value, 0
            ) / responseTimeMetrics.length;
            
            setMetricsData(prev => ({
              ...prev,
              avgResponseTime: Math.round(avgTime)
            }));
          }
        }
      }
    }
  });

  useEffect(() => {
    // Only fetch from API if no data is provided as props
    if (metrics) {
      setLoading(false);
      return;
    }

    const getMetrics = async () => {
      setLoading(true);
      const data = await fetchMetrics();
      setMetricsData(data);
      setLoading(false);
    };

    getMetrics();
  }, [metrics]);

  // Use external loading state if provided
  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  // If data is provided through props, render those instead
  if (metrics && !isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
          {metrics.map((item, index) => (
            <Card 
              key={index} 
              decoration="top" 
              decorationColor={item.changeType === 'increase' ? 'blue' : 'red'}
              className={cardClassName}
            >
              <Flex justifyContent="start" className="space-x-4">
                <item.icon className="h-8 w-8 text-blue-500" />
                <div>
                  <Text>{item.name}</Text>
                  <Metric>{item.stat}</Metric>
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
  if (!metrics && !metricsData.totalRequests) {
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
        <ConnectionStatus />
      </div>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="blue" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <FaBolt className="h-8 w-8 text-blue-500" />
            <div>
              <Text>Total Requests</Text>
              <Metric>{metricsData.totalRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="teal" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <FaClock className="h-8 w-8 text-teal-500" />
            <div>
              <Text>Avg Response Time</Text>
              <Metric>{`${metricsData.avgResponseTime.toLocaleString()} ms`}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="red" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-500" />
            <div>
              <Text>Blocked Requests</Text>
              <Metric>{metricsData.blockedRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="amber" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <FaExclamationTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <Text>Suspicious Requests</Text>
              <Metric>{metricsData.suspiciousRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>
    </div>
  );
} 