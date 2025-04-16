'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Metric,
  Text,
  Title,
  AreaChart,
  DonutChart,
  BarChart,
  Flex,
  Badge,
  List,
  ListItem,
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@tremor/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fetchAPI } from '../../lib/api';
import { SECURITY } from '../../lib/api-endpoints';
import { formatISOToLocalDisplay } from '../../lib/dateUtils';
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

type RecentAlert = {
  id: string;
  timestamp: string;
  severity: string;
  category: string;
  alert_level: string;
  description: string;
  llm_vendor: string;
  content_sample: string;
  detection_time: string;
  keywords: string[];
  event_id: number;
  agent_id: string;
  schema_version: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  event_name: string;
  log_level: string;
};

type OverviewResponse = {
  metrics: MetricsSummary;
  time_series: ChartDataPoint[];
  recent_alerts: RecentAlert[];
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
  
  // Convert by_category data to chart format
  const formatCategoryData = (data: Record<string, number> = {}) => {
    return Object.entries(data).map(([category, count]) => ({
      name: category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: count,
    }));
  };
  
  // Convert by_severity data to chart format
  const formatSeverityData = (data: Record<string, number> = {}) => {
    return Object.entries(data).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
    }));
  };
  
  // Format category for display
  const formatCategory = (category: string) => {
    if (!category) return '';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get appropriate color for severity
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'rose';
      case 'high': return 'orange';
      case 'medium': return 'amber';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };
  
  // Format change trend with indicator
  const formatTrend = (value: number) => {
    const isPositive = value > 0;
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
    const color = isPositive ? 'rose' : 'emerald';
    
    return (
      <Flex justifyContent="start" alignItems="center" className="gap-1">
        <Icon className={`h-5 w-5 text-${color}-500`} />
        <Text color={color}>{Math.abs(value).toFixed(1)}%</Text>
      </Flex>
    );
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
  const categoryData = formatCategoryData(overview.metrics?.by_category);
  const severityData = formatSeverityData(overview.metrics?.by_severity);
  
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="rose">
          <Flex justifyContent="between">
            <Text>Total Alerts</Text>
          </Flex>
          <Metric className="mt-1">{overview.metrics?.total_count?.toLocaleString() || 0}</Metric>
          <Flex className="mt-4">
            <Text className="text-xs text-gray-500">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              {overview.time_range && overview.time_range.description}
            </Text>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="rose">
          <Text>Critical Alerts</Text>
          <Flex alignItems="baseline" className="space-x-2">
            <Metric className="mt-1">{overview.metrics?.by_severity?.critical || 0}</Metric>
            <Badge color="rose" size="xs">Critical</Badge>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">
            {overview.metrics?.total_count > 0 && overview.metrics?.by_severity?.critical 
              ? Math.round((overview.metrics.by_severity.critical / overview.metrics.total_count) * 100)
              : 0}% of total alerts
          </Text>
        </Card>
        
        <Card decoration="top" decorationColor="orange">
          <Text>High Alerts</Text>
          <Flex alignItems="baseline" className="space-x-2">
            <Metric className="mt-1">{overview.metrics?.by_severity?.high || 0}</Metric>
            <Badge color="orange" size="xs">High</Badge>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">
            {overview.metrics?.total_count > 0 && overview.metrics?.by_severity?.high 
              ? Math.round((overview.metrics.by_severity.high / overview.metrics.total_count) * 100)
              : 0}% of total alerts
          </Text>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <Text>Medium & Low Alerts</Text>
          <Metric className="mt-1">
            {((overview.metrics?.by_severity?.medium || 0) + (overview.metrics?.by_severity?.low || 0))}
          </Metric>
          <Flex className="mt-4 gap-2">
            <Badge color="amber" size="xs">
              Medium: {overview.metrics?.by_severity?.medium || 0}
            </Badge>
            <Badge color="blue" size="xs">
              Low: {overview.metrics?.by_severity?.low || 0}
            </Badge>
          </Flex>
        </Card>
      </Grid>
      
      {/* Charts */}
      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        <Card>
          <Title>Alert Trend</Title>
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
        
        <Card>
          <Title>Alerts by Severity</Title>
          {severityData.length > 0 ? (
            <DonutChart
              className="mt-4 h-80"
              data={severityData}
              category="value"
              index="name"
              colors={["blue", "amber", "orange", "rose"]}
              showLabel={true}
              valueFormatter={(value) => `${value} alerts`}
            />
          ) : (
            <div className="h-80 flex items-center justify-center">
              <Text>No severity data available</Text>
            </div>
          )}
        </Card>
        
        <Card>
          <Title>Alerts by Category</Title>
          {categoryData.length > 0 ? (
            <>
              <DonutChart
                className="mt-4 h-72"
                data={categoryData}
                category="value"
                index="name"
                colors={["indigo", "cyan", "green", "amber", "rose", "pink"]}
                showLabel={true}
                valueFormatter={(value) => `${value} alerts`}
              />
              <Text className="text-xs text-gray-500 text-center mt-2 italic">
                Note: "Sensitive Data" alerts are displayed in the Policy Violations tab
              </Text>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <Text>No category data available</Text>
            </div>
          )}
        </Card>
      </Grid>
      
      {/* Recent Alerts */}
      <Card>
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Title>Recent Critical & High Alerts</Title>
          <Link href="/security?tab=1">
            <Button 
              variant="light" 
              size="xs" 
              icon={EyeIcon}
            >
              View All Security Alerts
            </Button>
          </Link>
        </Flex>
        
        {overview.recent_alerts && overview.recent_alerts.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Severity</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overview.recent_alerts
                .filter(alert => alert.category !== 'sensitive_data')
                .map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Badge color={getSeverityColor(alert.severity)} size="sm">
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Text>{formatCategory(alert.category)}</Text>
                  </TableCell>
                  <TableCell>
                    <Text className="truncate max-w-md">
                      {alert.description}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text>{formatISOToLocalDisplay(alert.timestamp)}</Text>
                  </TableCell>
                  <TableCell>
                    <Link href={`/security/alerts/${alert.id}`}>
                      <Button 
                        variant="light" 
                        size="xs" 
                        icon={EyeIcon}
                        tooltip="View Details"
                      >
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Text>No recent alerts found</Text>
        )}
      </Card>
    </div>
  );
} 