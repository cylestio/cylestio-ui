'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Metric,
  Text,
  Title,
  AreaChart,
  Flex,
} from '@tremor/react';
import { 
  ClockIcon, 
  ShieldExclamationIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { fetchAPI } from '../../lib/api';
import { SECURITY } from '../../lib/api-endpoints';
import LoadingState from '../../components/LoadingState';

interface SecurityDashboardProps {
  timeRange: string;
  filters: Record<string, any>;
}

type ChartDataPoint = {
  timestamp: string;
  count: number;
};

// Updated to match actual API response
type MetricsSummary = {
  total_count: number;
  by_severity: Record<string, number>;
  by_category: Record<string, number>;
  by_alert_level: Record<string, number>;
  by_llm_vendor: Record<string, number>;
};

type OverviewResponse = {
  metrics: MetricsSummary;
  time_series: ChartDataPoint[];
  time_range: {
    from: string;
    to: string;
    description: string;
  };
};

export default function SecurityDashboard({ timeRange, filters }: SecurityDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  
  // Convert raw data to chart format
  const formatChartData = (data: ChartDataPoint[]) => {
    return data.map(point => ({
      date: new Date(point.timestamp).toLocaleDateString(),
      Alerts: point.count,
    }));
  };
  
  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        
        // Build query params for overview
        const params = new URLSearchParams();
        params.append('time_range', timeRange);
        
        if (filters.agent_id) {
          params.append('agent_id', filters.agent_id);
        }
        
        const data = await fetchAPI<OverviewResponse>(`${SECURITY.ALERTS_OVERVIEW}?${params.toString()}`);
        
        // Validate that we received data in the expected format
        if (data && typeof data === 'object') {
          setOverview(data);
          setError(null);
        } else {
          console.error('Invalid response format:', data);
          setError('Received invalid data format from the server.');
        }
      } catch (err) {
        console.error('Error fetching security overview:', err);
        setError('Failed to load security overview. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOverview();
  }, [timeRange, filters.agent_id]);
  
  if (loading) {
    return <LoadingState message="Loading security dashboard..." />;
  }
  
  if (error) {
    return <Card className="mt-6"><Text color="rose">{error}</Text></Card>;
  }
  
  if (!overview) {
    return <Card className="mt-6"><Text>No security data available.</Text></Card>;
  }
  
  // Format the data for charts
  const timeSeriesData = overview.time_series ? formatChartData(overview.time_series) : [];

  // Calculate policy violations count (assuming sensitive_data category represents policy violations)
  const policyViolationsCount = overview.metrics?.by_category?.sensitive_data || 0;
  
  // Calculate security alerts (total minus policy violations)
  const securityAlertsCount = (overview.metrics?.total_count || 0) - policyViolationsCount;
  
  return (
    <div className="space-y-6">
      {/* Summary cards with agents screen design */}
      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        <Card className="bg-blue-50 p-4 border border-blue-100 rounded-lg shadow-sm">
          <Flex alignItems="center" className="mb-2">
            <ClockIcon className="h-6 w-6 text-blue-500 mr-2" />
            <Text className="text-blue-800">Total Alerts</Text>
          </Flex>
          <Metric className="text-4xl font-bold text-blue-900">
            {overview.metrics?.total_count?.toLocaleString() || 0}
          </Metric>
        </Card>
        
        <Card className="bg-rose-50 p-4 border border-rose-100 rounded-lg shadow-sm">
          <Flex alignItems="center" className="mb-2">
            <ShieldExclamationIcon className="h-6 w-6 text-rose-500 mr-2" />
            <Text className="text-rose-800">Security Alerts</Text>
          </Flex>
          <Metric className="text-4xl font-bold text-rose-900">
            {securityAlertsCount.toLocaleString()}
          </Metric>
        </Card>
        
        <Card className="bg-orange-50 p-4 border border-orange-100 rounded-lg shadow-sm">
          <Flex alignItems="center" className="mb-2">
            <DocumentTextIcon className="h-6 w-6 text-orange-500 mr-2" />
            <Text className="text-orange-800">Policy Violations</Text>
          </Flex>
          <Metric className="text-4xl font-bold text-orange-900">
            {policyViolationsCount.toLocaleString()}
          </Metric>
        </Card>
      </Grid>
      
      {/* Alert Trend chart */}
      <Card>
        <Title className="text-gray-700">Alert Trend</Title>
        {timeSeriesData.length > 0 ? (
          <AreaChart
            className="mt-4 h-80"
            data={timeSeriesData}
            index="date"
            categories={["Alerts"]}
            colors={["rose"]}
            showLegend={false}
            valueFormatter={(value) => `${value} alerts`}
          />
        ) : (
          <div className="h-80 flex items-center justify-center">
            <Text>No trend data available</Text>
          </div>
        )}
      </Card>
    </div>
  );
} 