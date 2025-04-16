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

type AlertSummary = {
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
};

type AlertTrends = {
  '24h_change_percent': number;
  '7d_change_percent': number;
  '30d_change_percent': number;
};

type AlertByCategory = Record<string, number>;
type AlertBySeverity = Record<string, number>;

type RecentAlert = {
  id: string;
  timestamp: string;
  severity: string;
  category: string;
  alert_level: string;
  title: string;
};

type OverviewResponse = {
  summary: AlertSummary;
  trends: AlertTrends;
  by_category: AlertByCategory;
  by_severity: AlertBySeverity;
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
  const formatCategoryData = (data: AlertByCategory) => {
    if (!data) return [];
    return Object.entries(data).map(([category, count]) => ({
      name: category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: count,
    }));
  };
  
  // Convert by_severity data to chart format
  const formatSeverityData = (data: AlertBySeverity) => {
    if (!data) return [];
    return Object.entries(data).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
    }));
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
  const categoryData = formatCategoryData(overview.by_category);
  const severityData = formatSeverityData(overview.by_severity);
  
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="rose">
          <Flex justifyContent="between">
            <Text>Total Alerts</Text>
            {overview.trends && overview.trends['7d_change_percent'] !== 0 && formatTrend(overview.trends['7d_change_percent'])}
          </Flex>
          <Metric className="mt-1">{overview.summary && overview.summary.total_alerts.toLocaleString()}</Metric>
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
            <Metric className="mt-1">{overview.summary && overview.summary.critical_alerts.toLocaleString()}</Metric>
            <Badge color="rose" size="xs">Critical</Badge>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">
            {overview.summary && Math.round((overview.summary.critical_alerts / overview.summary.total_alerts) * 100)}% of total alerts
          </Text>
        </Card>
        
        <Card decoration="top" decorationColor="orange">
          <Text>High Alerts</Text>
          <Flex alignItems="baseline" className="space-x-2">
            <Metric className="mt-1">{overview.summary && overview.summary.high_alerts.toLocaleString()}</Metric>
            <Badge color="orange" size="xs">High</Badge>
          </Flex>
          <Text className="mt-4 text-xs text-gray-500">
            {overview.summary && Math.round((overview.summary.high_alerts / overview.summary.total_alerts) * 100)}% of total alerts
          </Text>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <Text>Medium & Low Alerts</Text>
          <Metric className="mt-1">
            {overview.summary && (overview.summary.medium_alerts + overview.summary.low_alerts).toLocaleString()}
          </Metric>
          <Flex className="mt-4 gap-2">
            <Badge color="amber" size="xs">
              Medium: {overview.summary && overview.summary.medium_alerts.toLocaleString()}
            </Badge>
            <Badge color="blue" size="xs">
              Low: {overview.summary && overview.summary.low_alerts.toLocaleString()}
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
              className="h-72 mt-4"
              data={timeSeriesData}
              index="date"
              categories={["Alerts"]}
              colors={["rose"]}
              showLegend={false}
              curveType="monotone"
              showAnimation
            />
          ) : (
            <div className="h-72 mt-4 flex items-center justify-center">
              <Text>No trend data available</Text>
            </div>
          )}
        </Card>
        
        <Card>
          <Title>Alerts by Severity</Title>
          {severityData.length > 0 ? (
            <DonutChart
              className="h-72 mt-4"
              data={severityData}
              category="value"
              index="name"
              colors={["rose", "orange", "amber", "blue"]}
              showAnimation
            />
          ) : (
            <div className="h-72 mt-4 flex items-center justify-center">
              <Text>No severity data available</Text>
            </div>
          )}
        </Card>
        
        <Card>
          <Title>Alerts by Category</Title>
          {categoryData.length > 0 ? (
            <BarChart
              className="h-72 mt-4"
              data={categoryData}
              index="name"
              categories={["value"]}
              colors={["purple"]}
              showLegend={false}
              showAnimation
            />
          ) : (
            <div className="h-72 mt-4 flex items-center justify-center">
              <Text>No category data available</Text>
            </div>
          )}
        </Card>
      </Grid>
      
      {/* Recent alerts */}
      <Card>
        <Flex justifyContent="between" alignItems="center">
          <Title>Recent Critical & High Alerts</Title>
          <Link href="/security?tab=1">
            <Button size="xs" icon={EyeIcon} variant="light">
              View All Alerts
            </Button>
          </Link>
        </Flex>
        
        <List className="mt-4">
          {!overview.recent_alerts || overview.recent_alerts.length === 0 ? (
            <Text className="py-2 text-gray-500">No recent alerts</Text>
          ) : (
            overview.recent_alerts.map((alert) => (
              <ListItem key={alert.id}>
                <Flex justifyContent="between" alignItems="center">
                  <Flex justifyContent="start" alignItems="center" className="gap-2">
                    <Badge size="xs" color={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Link href={`/security/alerts/${alert.id}`}>
                      <Text className="font-medium hover:text-blue-500 cursor-pointer">
                        {alert.title}
                      </Text>
                    </Link>
                  </Flex>
                  <Text className="text-gray-500 text-sm">
                    {formatISOToLocalDisplay(alert.timestamp)}
                  </Text>
                </Flex>
              </ListItem>
            ))
          )}
        </List>
      </Card>
    </div>
  );
} 