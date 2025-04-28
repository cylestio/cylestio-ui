'use client';

import { useEffect, useState } from 'react';
import { Card, Metric, Text, Flex, Grid } from '@tremor/react';
import { 
  ClockIcon, 
  ExclamationTriangleIcon, 
  ShieldExclamationIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useDataUpdates } from '../lib/hooks/useDataUpdates';
import { DataUpdateType } from '../../src/lib/db/data-update-service';
import { ConnectionStatus } from './ConnectionStatus';
import { fetchAPI } from '../lib/api';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

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

// Define dashboard metrics response type
type DashboardResponse = {
  request_count: number;
  token_usage: number;
  avg_response_time_ms: number;
  error_count: number;
  security_alerts_count: number;
  policy_violations_count: number;
};

// In a real implementation, this would fetch from the API
async function fetchMetrics() {
  try {
    // Call the real API endpoint
    const response = await fetchAPI<DashboardResponse>('/v1/dashboard');
    
    if (!response) {
      throw new Error('Failed to fetch metrics');
    }
    
    // Return data in the expected format
    return {
      totalRequests: response.request_count || 0,
      avgResponseTime: response.avg_response_time_ms || 0,
      blockedRequests: response.error_count || 0,  // Using error_count for blocked requests
      suspiciousRequests: response.security_alerts_count || 0,  // Using security alerts for suspicious requests
      tokenUsage: response.token_usage || 0,
      policyViolations: response.policy_violations_count || 0
    };
  } catch (error) {
    console.error('Error fetching metrics from API:', error);
    // Return fallback data for development
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      blockedRequests: 0,
      suspiciousRequests: 0,
      tokenUsage: 0,
      policyViolations: 0
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
    suspiciousRequests: 0,
    tokenUsage: 0,
    policyViolations: 0
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
          setMetrics(prev => ({
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
          
          setMetrics(prev => ({
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
            
            setMetrics(prev => ({
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
    if (data) {
      setLoading(false);
      return;
    }

    const getMetrics = async () => {
      setLoading(true);
      const data = await fetchMetrics();
      setMetrics(data);
      setLoading(false);
    };

    getMetrics();
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
    return <LoadingState variant="skeleton" contentType="metrics" />
  }

  // Show empty state if no data
  if (!data && !metrics.totalRequests) {
    return (
      <EmptyState 
        contentType="metrics"
        actionText="Refresh Metrics"
        onAction={() => {
          // Use the existing fetchMetrics function from this component
          const refreshData = async () => {
            setLoading(true);
            const newData = await fetchMetrics();
            setMetrics(newData);
            setLoading(false);
          };
          refreshData();
        }}
      />
    );
  }

  // Default view with API-fetched data
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <ConnectionStatus />
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        <Card decoration="top" decorationColor="blue" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <BoltIcon className="h-8 w-8 text-blue-500" />
            <div>
              <Text>Total Requests</Text>
              <Metric>{metrics.totalRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="amber" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-amber-500" />
            <div>
              <Text>Token Usage</Text>
              <Metric>{metrics.tokenUsage.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="red" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div>
              <Text>Errors</Text>
              <Metric>{metrics.blockedRequests.toLocaleString()}</Metric>
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
        
        <Card decoration="top" decorationColor="rose" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <ShieldExclamationIcon className="h-8 w-8 text-rose-500" />
            <div>
              <Text>Security Alerts</Text>
              <Metric>{metrics.suspiciousRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="orange" className={cardClassName}>
          <Flex justifyContent="start" className="space-x-4">
            <DocumentTextIcon className="h-8 w-8 text-orange-500" />
            <div>
              <Text>Policy Violations</Text>
              <Metric>{metrics.policyViolations.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>
    </div>
  );
} 