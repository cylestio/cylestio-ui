'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Grid,
  Metric,
  Text,
  Title,
  AreaChart,
  Flex,
  Badge,
  Select,
  SelectItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Divider,
  BarChart,
  DonutChart,
  Color,
  Legend,
  List,
  ListItem,
  Bold
} from '@tremor/react'
import {
  BoltIcon,
  ClockIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  ServerIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon as ClockIconOutline,
  RocketLaunchIcon,
  CpuChipIcon as CpuChipIconOutline,
  EyeIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ChevronDoubleRightIcon,
  ChartPieIcon,
  HomeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { ConnectionStatus } from './ConnectionStatus'
import { SimpleDonutChart } from './SimpleDonutChart'
import SectionHeader from './SectionHeader'
import ExpandableSection from './ExpandableSection'
import Breadcrumbs from './Breadcrumbs'
import MetricCard from './MetricCard'
import DashboardCard from './DashboardCard'
import Link from 'next/link'
import { fetchAPI, buildQueryParams } from '../lib/api'
import { DASHBOARD, AGENTS, METRICS } from '../lib/api-endpoints'
import { colors } from './DesignSystem'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorMessage from './ErrorMessage'
import ResponsiveContainer from './ResponsiveContainer'
import TokenUsageBreakdown from './TokenUsageBreakdown'
import ToolUsageAnalysis from './ToolUsageAnalysis'
import { formatISOToLocalDisplay, formatChartDate as formatChartTimestamp } from '../lib/dateUtils'

// Define types based on the new API
type DashboardMetric = {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
};

type TimeSeriesData = {
  timestamp: string;
  value: number;
  dimensions?: Record<string, string>;
};

type MetricsResponse = {
  period: string;
  time_range: string;
  from_time: string;
  to_time: string;
  agent_id: string | null;
  metrics: DashboardMetric[];
};

type Agent = {
  agent_id: string;
  name: string;
  type: string;
  status: string;
  request_count: number;
  token_usage: number;
  error_count: number;
};

type TopAgentsResponse = {
  items: Agent[];
};

type MetricChartData = {
  metric: string;
  from_time: string;
  to_time: string;
  interval: string;
  data: TimeSeriesData[];
};

// Add ToolInteraction and ToolInteractionsResponse types to match the API response
type ToolInteraction = {
  id: number;
  event_id: number;
  tool_name: string;
  interaction_type: string;
  status: string;
  status_code: number;
  parameters: any;
  result: any;
  request_timestamp: string;
  response_timestamp: string;
  duration_ms: number;
  framework_name: string;
  agent_id: string;
};

type ToolInteractionsResponse = {
  total: number;
  page: number;
  page_size: number;
  from_time: string;
  to_time: string;
  interactions: ToolInteraction[];
};

// Calculate health score based on metrics
const calculateHealthScore = (metrics: DashboardMetric[]): number => {
  if (!metrics || metrics.length === 0) return 100;
  
  // Base score
  let score = 100;
  
  // Find error metrics and reduce score if they exist
  const errorMetrics = metrics.filter(m => 
    m.metric.includes('error') || 
    m.metric.includes('failure')
  );
  
  if (errorMetrics.length > 0) {
    errorMetrics.forEach(m => {
      if (m.value > 0) {
        score -= Math.min(25, m.value * 5); // Reduce score based on error count
      }
    });
  }
  
  // Reduce score for poor response times
  const responseTimeMetric = metrics.find(m => m.metric.includes('response_time'));
  if (responseTimeMetric && responseTimeMetric.value > 3000) {
    score -= Math.min(15, (responseTimeMetric.value - 3000) / 200);
  }
  
  return Math.max(0, Math.min(100, score));
};

// Get health status based on score
const getHealthStatus = (score: number): { status: string; color: Color } => {
  if (score >= 90) return { status: 'Healthy', color: 'green' };
  if (score >= 75) return { status: 'Good', color: 'emerald' };
  if (score >= 60) return { status: 'Fair', color: 'yellow' };
  if (score >= 40) return { status: 'Degraded', color: 'amber' };
  return { status: 'Critical', color: 'red' };
};

// Convert API's 'stable' trend to 'flat' for our components
const mapTrendDirection = (apiTrend: 'up' | 'down' | 'stable'): 'up' | 'down' | 'flat' => {
  if (apiTrend === 'stable') return 'flat';
  return apiTrend;
};

type OverviewDashboardProps = {
  timeRange: string;
};

export default function OverviewDashboard({ timeRange }: OverviewDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [topAgents, setTopAgents] = useState<Agent[]>([])
  const [llmRequests, setLlmRequests] = useState<TimeSeriesData[]>([])
  const [tokenUsage, setTokenUsage] = useState<TimeSeriesData[]>([])
  const [toolExecutions, setToolExecutions] = useState<TimeSeriesData[]>([])
  const [sessionCounts, setSessionCounts] = useState<TimeSeriesData[]>([])
  
  // Using timeRange from props instead of state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [healthScore, setHealthScore] = useState(100)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Track if we received any data at all
      let receivedAnyData = false;

      // Fetch top-level metrics
      try {
        const params = { time_range: timeRange };
        console.log(`Fetching dashboard metrics from: ${DASHBOARD.METRICS}${buildQueryParams(params)}`);
        
        const metricsData = await fetchAPI<MetricsResponse>(`${DASHBOARD.METRICS}${buildQueryParams(params)}`);
        if (metricsData && metricsData.metrics && metricsData.metrics.length > 0) {
          setMetrics(metricsData.metrics);
          // Calculate health score
          setHealthScore(calculateHealthScore(metricsData.metrics));
          receivedAnyData = true;
        } else {
          console.log('No metrics data received from API');
          // If we don't have metrics data, set empty array rather than leaving previous data
          setMetrics([]);
        }
      } catch (error) {
        console.warn('Failed to fetch metrics data:', error);
        // Don't set empty metrics on error to avoid hiding entire dashboard
      }
      
      // Fetch top agents
      try {
        const agentsParams = {
          page: 1,
          page_size: 5,
          sort_by: 'request_count',
          sort_dir: 'desc',
          status: 'active'
        };
        
        const agentsData = await fetchAPI<TopAgentsResponse>(`${AGENTS.LIST}${buildQueryParams(agentsParams)}`);
        if (agentsData && agentsData.items && agentsData.items.length > 0) {
          setTopAgents(agentsData.items);
          receivedAnyData = true;
        }
      } catch (error) {
        console.warn('Failed to fetch top agents:', error);
      }
      
      // Calculate date range for API requests
      const currentTime = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      // Fetch chart data for LLM requests
      try {
        const llmRequestsResponse = await fetchAPI<MetricChartData>(
          `${METRICS.LLM_REQUEST_COUNT}?time_range=${timeRange}`
        );
        
        if (llmRequestsResponse && llmRequestsResponse.data) {
          setLlmRequests(llmRequestsResponse.data);
          receivedAnyData = true;
        }
      } catch (error) {
        console.warn('Failed to fetch LLM requests chart data:', error);
      }
      
      // Fetch token usage data
      try {
        const tokenUsageResponse = await fetchAPI<MetricChartData>(
          `${METRICS.LLM_TOKEN_USAGE}?time_range=${timeRange}`
        );
        
        if (tokenUsageResponse && tokenUsageResponse.data) {
          setTokenUsage(tokenUsageResponse.data);
          receivedAnyData = true;
        }
      } catch (error) {
        console.warn('Failed to fetch token usage chart data:', error);
      }
      
      // Fetch tool execution data
      try {
        const toolExecutionsResponse = await fetchAPI<ToolInteractionsResponse>(
          `${METRICS.TOOL_INTERACTIONS}?time_range=${timeRange}&interaction_type=execution`
        );
        
        if (toolExecutionsResponse && toolExecutionsResponse.interactions) {
          // Process tool executions into time series data
          const processedData = toolExecutionsResponse.interactions.reduce((acc: TimeSeriesData[], interaction) => {
            const timestamp = interaction.request_timestamp;
            const existingPoint = acc.find(point => point.timestamp === timestamp);
            
            if (existingPoint) {
              existingPoint.value += 1;
            } else {
              acc.push({
                timestamp,
                value: 1
              });
            }
            
            return acc;
          }, []);
          
          setToolExecutions(processedData);
          receivedAnyData = true;
        } else {
          setToolExecutions([]);
        }
      } catch (error) {
        console.error('Failed to fetch tool executions:', error);
        setToolExecutions([]);
      }
      
      // Fetch session counts data
      try {
        const sessionCountsResponse = await fetchAPI<MetricChartData>(
          `${METRICS.SESSION_COUNT}?time_range=${timeRange}`
        );
        
        if (sessionCountsResponse && sessionCountsResponse.data) {
          setSessionCounts(sessionCountsResponse.data);
          receivedAnyData = true;
        }
      } catch (error) {
        console.warn('Failed to fetch session counts chart data:', error);
      }
      
      // After all data is fetched
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError('Error fetching dashboard data. Please try again.');
      setLoading(false);
      console.error('Dashboard data fetch error:', err);
    }
  }

  // Helper functions
  const getInterval = (range: string): string => {
    switch (range) {
      case '24h':
        return '1h';
      case '7d':
        return '1d';
      case '30d':
        return '1d';
      case '90d':
        return '1w';
      default:
        return '1d';
    }
  }

  const formatMetricName = (metric: string) => {
    return metric
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatMetricValue = (metric: string, value: number) => {
    if (metric.includes('time') && !metric.includes('count')) {
      return `${value} ms`;
    } else if (metric.includes('percentage') || metric.includes('rate')) {
      return `${value}%`;
    } else {
      return value.toLocaleString();
    }
  }

  const formatChartDate = (timestamp: string, range: string) => {
    return formatChartTimestamp(timestamp, range);
  }

  const formatTimestamp = (timestamp: string) => {
    return formatISOToLocalDisplay(timestamp, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const StatusBadge = ({ status }: { status: string }) => {
    let color: Color = 'gray';
    if (status === 'active') color = 'green';
    if (status === 'error') color = 'red';
    if (status === 'warning') color = 'amber';
    if (status === 'stale') color = 'gray';
    
    return (
      <Badge color={color} size="sm">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const prepareChartData = (data: TimeSeriesData[]) => {
    if (!data || data.length === 0) {
      // Return at least one data point for empty data
      return [{
        date: formatChartDate(new Date().toISOString(), timeRange),
        value: 0
      }];
    }
    
    return data.map(item => ({
      date: formatChartDate(item.timestamp, timeRange),
      value: item.value
    }));
  }

  const getMetricIcon = (metric: string) => {
    if (metric.includes('error') || metric.includes('failure')) return <XCircleIcon className="h-5 w-5 text-red-500" />;
    if (metric.includes('time')) return <ClockIcon className="h-5 w-5 text-emerald-500" />;
    if (metric.includes('token')) return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    if (metric.includes('request')) return <BoltIcon className="h-5 w-5 text-purple-500" />;
    if (metric.includes('session')) return <UserCircleIcon className="h-5 w-5 text-indigo-500" />;
    return <ChartBarIcon className="h-5 w-5 text-blue-500" />;
  }

  const getMetricColor = (metric: string): Color => {
    if (metric.includes('error') || metric.includes('failure')) return 'red';
    if (metric.includes('time')) return 'emerald';
    if (metric.includes('token')) return 'blue';
    if (metric.includes('request')) return 'purple';
    if (metric.includes('session')) return 'indigo';
    return 'blue';
  }

  const isPositiveTrend = (metric: string, trend: string): boolean => {
    if (metric.includes('error') || metric.includes('failure') || metric.includes('time')) {
      return trend === 'down';
    }
    return trend === 'up';
  }

  // Categorize metrics by type
  const getMetricsByCategory = () => {
    const categories = {
      performance: {
        title: 'Performance',
        icon: <ChartBarIcon className="h-6 w-6" />,
        description: 'Key performance metrics including response times and throughput',
        metrics: metrics.filter(m => 
          m.metric.includes('time') || 
          m.metric.includes('throughput') ||
          m.metric.includes('performance')
        )
      },
      usage: {
        title: 'Usage',
        icon: <ChartPieIcon className="h-6 w-6" />,
        description: 'System usage patterns and resource utilization metrics',
        metrics: metrics.filter(m => 
          m.metric.includes('request_count') || 
          m.metric.includes('call_count') ||
          m.metric.includes('usage') ||
          m.metric.includes('rate')
        )
      },
      security: {
        title: 'Security',
        icon: <ShieldExclamationIcon className="h-6 w-6" />,
        description: 'Security-related metrics including errors and alerts',
        metrics: metrics.filter(m => 
          m.metric.includes('error') || 
          m.metric.includes('alert') ||
          m.metric.includes('security') ||
          m.metric.includes('block')
        )
      },
      tokens: {
        title: 'Tokens',
        icon: <DocumentTextIcon className="h-6 w-6" />,
        description: 'Token usage statistics and cost analysis',
        metrics: metrics.filter(m => 
          m.metric.includes('token')
        )
      },
      tools: {
        title: 'Tools',
        icon: <CpuChipIcon className="h-6 w-6" />,
        description: 'Tool execution metrics and performance',
        metrics: metrics.filter(m => 
          m.metric.includes('tool')
        )
      },
      sessions: {
        title: 'Sessions',
        icon: <UserCircleIcon className="h-6 w-6" />,
        description: 'User session statistics and engagement metrics',
        metrics: metrics.filter(m => 
          m.metric.includes('session')
        )
      }
    };
    
    return categories;
  }

  const getAgentComparisonData = () => {
    return topAgents.map(agent => ({
      name: agent.name,
      requests: agent.request_count,
      tokens: agent.token_usage,
      errors: agent.error_count
    }));
  }
  
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  // Get the top 4 metrics for summary section
  const getSummaryMetrics = () => {
    const summaryMetrics = [
      metrics.find(m => m.metric.includes('request_count')),
      metrics.find(m => m.metric.includes('token_usage')),
      metrics.find(m => m.metric.includes('response_time')),
      metrics.find(m => m.metric.includes('error_count'))
    ].filter(Boolean) as DashboardMetric[];
    
    // If we don't have enough, add more metrics
    if (summaryMetrics.length < 4 && metrics.length >= 4) {
      const additionalMetrics = metrics
        .filter(m => !summaryMetrics.some(sm => sm.metric === m.metric))
        .slice(0, 4 - summaryMetrics.length);
      
      return [...summaryMetrics, ...additionalMetrics];
    }
    
    return summaryMetrics;
  }

  // Reload data when time range changes
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Check if we're in mobile view on mount and when window resizes
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobileView(window.innerWidth < 768) // 768px is the md breakpoint
    }
    
    // Set initial value
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  // Loading state
  if (loading) {
    return <LoadingState variant="skeleton" contentType="metrics" />
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage 
        message={error}
        severity="error"
        retryText="Retry"
        onRetry={fetchDashboardData}
        alternativeActionText="Switch to Default View"
        onAlternativeAction={fetchDashboardData}
      />
    )
  }

  // Empty state
  if (metrics.length === 0 && error) {
    return (
      <EmptyState 
        title="No Dashboard Data Available"
        description="There is no metrics data collected for the selected time period."
        actionText="Refresh Data"
        onAction={fetchDashboardData}
        secondaryActionText="Reload"
        onSecondaryAction={fetchDashboardData}
      />
    )
  }

  // Even if metrics are empty, we'll show the dashboard if other data is available
  const metricCategories = getMetricsByCategory();
  const summaryMetrics = getSummaryMetrics();
  const healthStatus = getHealthStatus(healthScore);
  
  return (
    <div className="p-4 sm:p-6 pt-0">
      <div>
        {/* Time range filter moved to page.tsx for better layout */}
        
        <div className="mb-4 md:mb-6">
          {/* System Overview metric cards */}
          <ResponsiveContainer
            defaultLayout="grid"
            columns={{ default: 2, md: 2, lg: 4 }}
            spacing="md"
          >
            <MetricCard
              title="LLM Request Count"
              value={metrics.find(m => m.metric === 'llm_request_count')?.value || 0}
              icon={<BoltIcon className="w-5 h-5" />}
              variant="primary"
              trend={{
                value: metrics.find(m => m.metric === 'llm_request_count')?.change || 0,
                direction: mapTrendDirection(metrics.find(m => m.metric === 'llm_request_count')?.trend || 'stable'),
                isPositive: true
              }}
            />
            
            <MetricCard
              title="LLM Token Usage"
              value={metrics.find(m => m.metric === 'token_usage')?.value || 0}
              icon={<DocumentTextIcon className="w-5 h-5" />}
              variant="secondary"
              trend={{
                value: metrics.find(m => m.metric === 'token_usage')?.change || 0,
                direction: mapTrendDirection(metrics.find(m => m.metric === 'token_usage')?.trend || 'stable'),
                isPositive: true
              }}
            />
            
            <MetricCard
              title="LLM Avg Response Time"
              value={`${formatMetricValue('response_time_ms', metrics.find(m => m.metric === 'response_time_ms')?.value || 0)}`}
              icon={<ClockIcon className="w-5 h-5" />}
              variant="success"
              trend={{
                value: metrics.find(m => m.metric === 'response_time_ms')?.change || 0,
                direction: mapTrendDirection(metrics.find(m => m.metric === 'response_time_ms')?.trend || 'stable'),
                isPositive: false
              }}
            />
            
            <MetricCard
              title="Error Count"
              value={metrics.find(m => m.metric === 'error_count')?.value || 0}
              icon={<ExclamationTriangleIcon className="w-5 h-5" />}
              variant="error"
              trend={{
                value: metrics.find(m => m.metric === 'error_count')?.change || 0,
                direction: mapTrendDirection(metrics.find(m => m.metric === 'error_count')?.trend || 'stable'),
                isPositive: false
              }}
            />
          </ResponsiveContainer>
        </div>
        
        <ResponsiveContainer
          defaultLayout="grid"
          columns={{ default: 1, md: 3 }}
          spacing="md"
          className="mb-6 md:mb-8"
        >
          <DashboardCard
            title="System Health"
            icon={<ServerIcon className="h-5 w-5" />}
            variant="primary"
            className="md:col-span-1"
          >
            <div className="flex flex-col items-center justify-center p-4">
              <SimpleDonutChart
                value={healthScore}
                label="Health Score"
                color={healthStatus.color === 'red' ? 'error' : 
                       healthStatus.color === 'amber' ? 'warning' : 
                       healthStatus.color === 'green' ? 'success' : 
                       healthStatus.color === 'emerald' ? 'success' : 'primary'}
              />
              <div className="mt-2 text-center">
                <div className="flex items-center justify-center">
                  <span className={`status-indicator ${
                    healthStatus.color === 'red' ? 'status-error' : 
                    healthStatus.color === 'amber' ? 'status-warning' : 
                    healthStatus.color === 'green' || healthStatus.color === 'emerald' ? 'status-active' : ''
                  }`}></span>
                  <span className="font-medium">{healthStatus.status} ({healthScore}%)</span>
                </div>
                <Text className="text-sm text-neutral-500 mt-2">
                  The health score is calculated based on error rates, response times, and overall system performance.
                </Text>
              </div>
            </div>
          </DashboardCard>
          
          <DashboardCard
            title="LLM Requests Over Time"
            description="Number of LLM requests processed"
            icon={<ChartBarIcon className="h-5 w-5" />}
            className="md:col-span-2"
          >
            <AreaChart
              className="h-64 mt-4"
              data={prepareChartData(llmRequests)}
              index="date"
              categories={["value"]}
              colors={["blue"]}
              valueFormatter={(value) => `${formatNumber(value)} requests`}
              showLegend={false}
              showXAxis={!isMobileView} 
              showGridLines={!isMobileView}
              showYAxis={!isMobileView}
              showTooltip={true}
              autoMinValue={true}
            />
          </DashboardCard>
        </ResponsiveContainer>

        {/* Continue with other sections... */}
        
        {/* Use ResponsiveContainer for token usage and tool executions */}
        <ResponsiveContainer
          defaultLayout="grid"
          columns={{ default: 1, md: 2 }}
          spacing="md"
          className="mb-6 md:mb-8"
        >
          <DashboardCard
            title="Token Usage"
            description="Total tokens used by LLMs"
            icon={<DocumentTextIcon className="h-5 w-5" />}
          >
            <AreaChart
              className="h-64 mt-4"
              data={prepareChartData(tokenUsage)}
              index="date"
              categories={["value"]}
              colors={["indigo"]}
              valueFormatter={(value) => `${formatNumber(value)} tokens`}
              showLegend={false}
              showXAxis={!isMobileView}
              showGridLines={!isMobileView}
              showYAxis={!isMobileView}
              showTooltip={true}
              autoMinValue={true}
            />
          </DashboardCard>
          
          <DashboardCard
            title="Tool Executions"
            description="Count of tool executions by AI agents"
            icon={<CpuChipIcon className="h-5 w-5" />}
          >
            <AreaChart
              className="h-64 mt-4"
              data={prepareChartData(toolExecutions)}
              index="date"
              categories={["value"]}
              colors={["cyan"]}
              valueFormatter={(value) => `${formatNumber(value)} executions`}
              showLegend={false}
              showXAxis={!isMobileView}
              showGridLines={!isMobileView}
              showYAxis={!isMobileView}
              showTooltip={true}
              autoMinValue={true}
            />
          </DashboardCard>
        </ResponsiveContainer>
        
        {/* Token Usage Breakdown Section */}
        <div className="mt-6">
          <TokenUsageBreakdown 
            timeRange={timeRange}
            className="h-full" 
          />
        </div>
        
        {/* Tool Usage Analysis Section */}
        <div className="mt-6">
          <ToolUsageAnalysis 
            timeRange={timeRange}
            className="h-full"
          />
        </div>
        
        {/* Top Agents Section */}
        <div className="mb-6 md:mb-8">
          <ResponsiveContainer
            defaultLayout="grid"
            columns={{ default: 1, lg: 2 }}
            spacing="md"
          >
            {/* Agent Table */}
            <DashboardCard title="Top Agents by Request Count">
              <div className={`overflow-x-auto ${isMobileView ? 'max-h-60' : ''}`}>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Agent Name</TableHeaderCell>
                      <TableHeaderCell className={isMobileView ? 'hidden' : ''}>Type</TableHeaderCell>
                      <TableHeaderCell>Requests</TableHeaderCell>
                      <TableHeaderCell className={isMobileView ? 'hidden' : ''}>Tokens</TableHeaderCell>
                      <TableHeaderCell>Errors</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topAgents.map((agent) => (
                      <TableRow key={agent.agent_id}>
                        <TableCell>{agent.name}</TableCell>
                        <TableCell className={isMobileView ? 'hidden' : ''}>{agent.type}</TableCell>
                        <TableCell>{agent.request_count}</TableCell>
                        <TableCell className={isMobileView ? 'hidden' : ''}>{agent.token_usage}</TableCell>
                        <TableCell>{agent.error_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {isMobileView && (
                <div className="mt-2 text-center">
                  <Text className="text-xs text-neutral-500">Swipe to see more data</Text>
                </div>
              )}
            </DashboardCard>
            
            {/* Agent Chart */}
            <DashboardCard title="Agent Comparison">
              <BarChart
                className="h-64 mt-4"
                data={getAgentComparisonData()}
                index="name"
                categories={["requests"]}
                colors={["blue"]}
                valueFormatter={(value) => `${value} requests`}
                layout={isMobileView ? "vertical" : "horizontal"}
                showLegend={false}
                showGridLines={!isMobileView}
              />
            </DashboardCard>
          </ResponsiveContainer>
        </div>
        
        {/* Continue with the rest of the dashboard ... */}
      </div>
    </div>
  )
}
