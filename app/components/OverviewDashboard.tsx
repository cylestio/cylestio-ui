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
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
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
import DashboardNavigation, { defaultSections } from './DashboardNavigation'
import SectionHeader from './SectionHeader'
import ExpandableSection from './ExpandableSection'
import Breadcrumbs from './Breadcrumbs'
import Link from 'next/link'
import { fetchAPI, buildQueryParams } from '../lib/api'
import { DASHBOARD, AGENTS, METRICS } from '../lib/api-endpoints'

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

export default function OverviewDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [topAgents, setTopAgents] = useState<Agent[]>([])
  const [llmRequests, setLlmRequests] = useState<TimeSeriesData[]>([])
  const [tokenUsage, setTokenUsage] = useState<TimeSeriesData[]>([])
  const [toolExecutions, setToolExecutions] = useState<TimeSeriesData[]>([])
  const [sessionCounts, setSessionCounts] = useState<TimeSeriesData[]>([])
  
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [healthScore, setHealthScore] = useState(100)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  
  // State for breadcrumbs navigation
  const [breadcrumbs, setBreadcrumbs] = useState([
    { label: 'Dashboard', href: '/', current: true }
  ])

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch top-level metrics
      const params = { time_range: timeRange };
      const metricsData = await fetchAPI<MetricsResponse>(`${DASHBOARD.METRICS}${buildQueryParams(params)}`);
      setMetrics(metricsData.metrics)
      
      // Calculate health score
      setHealthScore(calculateHealthScore(metricsData.metrics));
      
      // Fetch top agents
      const agentsParams = {
        page: 1,
        page_size: 5,
        sort_by: 'request_count',
        sort_dir: 'desc',
        status: 'active'
      };
      
      try {
        const agentsData = await fetchAPI<TopAgentsResponse>(`${AGENTS.LIST}${buildQueryParams(agentsParams)}`);
        setTopAgents(agentsData.items || []);
      } catch (error) {
        console.warn('Failed to fetch top agents:', error);
      }
      
      // Fetch LLM requests time series
      try {
        const llmParams = {
          time_range: timeRange,
          interval: getInterval(timeRange)
        };
        
        const llmData = await fetchAPI<MetricChartData>(`${METRICS.LLM_REQUEST_COUNT}${buildQueryParams(llmParams)}`);
        setLlmRequests(llmData.data || []);
      } catch (error) {
        console.warn('Failed to fetch LLM requests:', error);
      }
      
      // Fetch token usage time series
      try {
        const tokenParams = {
          time_range: timeRange,
          interval: getInterval(timeRange)
        };
        
        const tokenData = await fetchAPI<MetricChartData>(`${METRICS.LLM_TOKEN_USAGE}${buildQueryParams(tokenParams)}`);
        setTokenUsage(tokenData.data || []);
      } catch (error) {
        console.warn('Failed to fetch token usage:', error);
      }
      
      // Fetch tool executions time series
      try {
        const toolParams = {
          time_range: timeRange,
          interval: getInterval(timeRange)
        };
        
        const toolData = await fetchAPI<MetricChartData>(`${METRICS.TOOL_EXECUTION_COUNT}${buildQueryParams(toolParams)}`);
        setToolExecutions(toolData.data || []);
      } catch (error) {
        console.warn('Failed to fetch tool executions:', error);
      }
      
      // Fetch session counts time series
      try {
        const sessionParams = {
          time_range: timeRange,
          interval: getInterval(timeRange)
        };
        
        const sessionData = await fetchAPI<MetricChartData>(`${METRICS.SESSION_COUNT}${buildQueryParams(sessionParams)}`);
        setSessionCounts(sessionData.data || []);
      } catch (error) {
        console.warn('Failed to fetch session counts:', error);
      }
      
      setLastUpdated(new Date())
      setLoading(false)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(`${err instanceof Error ? err.message : 'Failed to load dashboard data'}`)
      setLoading(false)
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
    const date = new Date(timestamp);
    if (range === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
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

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse space-y-8 w-full">
        <div className="bg-gray-200 h-12 rounded-lg w-full"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
        
        <div className="bg-gray-200 h-80 rounded-lg w-full"></div>
        <div className="bg-gray-200 h-80 rounded-lg w-full"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="mx-auto my-6 p-6 bg-red-50 border-red-300 max-w-4xl">
        <Flex justifyContent="center" alignItems="center" className="mb-2">
          <XCircleIcon className="h-10 w-10 text-red-500" />
        </Flex>
        <Title className="text-center mb-2">Error Loading Dashboard</Title>
        <Text className="text-center">{error}</Text>
        <Flex justifyContent="center" className="mt-4">
          <Button onClick={fetchDashboardData} icon={ArrowPathIcon}>
            Retry
          </Button>
        </Flex>
      </Card>
    )
  }

  // Empty state
  if (metrics.length === 0) {
    return (
      <Card className="mx-auto my-6 p-6 max-w-4xl">
        <Flex justifyContent="center" alignItems="center" className="mb-2">
          <InformationCircleIcon className="h-10 w-10 text-blue-500" />
        </Flex>
        <Title className="text-center mb-2">No Data Available</Title>
        <Text className="text-center">
          There is no metric data available for the selected time period.
        </Text>
        <Flex justifyContent="center" className="mt-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </Select>
        </Flex>
      </Card>
    )
  }

  const metricCategories = getMetricsByCategory();
  const summaryMetrics = getSummaryMetrics();
  const healthStatus = getHealthStatus(healthScore);
  
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={breadcrumbs}
        className="mb-2"
      />
      
      {/* Dashboard Navigation */}
      <DashboardNavigation 
        sections={defaultSections}
        className="mb-6"
      />

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <Title className="text-2xl">Agent Monitoring Dashboard</Title>
          <Text>Comprehensive analytics and monitoring for your AI agents</Text>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            <Text>Time Range:</Text>
            <Select value={timeRange} onValueChange={setTimeRange} className="min-w-40">
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </Select>
          </div>
          
          {lastUpdated && (
            <div className="text-xs text-gray-500 whitespace-nowrap">
              Last updated: {lastUpdated.toLocaleTimeString()}
              <Button 
                size="xs" 
                variant="light" 
                className="ml-2" 
                icon={ArrowPathIcon}
                onClick={fetchDashboardData}
                tooltip="Refresh data"
              >
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div id="overview" className="mb-12">
        <SectionHeader
          title="System Overview"
          description="A high-level overview of your system's health and key metrics"
          icon={<HomeIcon className="h-6 w-6" />}
        />
        
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
          {summaryMetrics.map((metric, index) => (
            <Card key={index} decoration="top" decorationColor={getMetricColor(metric.metric)}>
              <Flex justifyContent="start" className="space-x-4">
                {getMetricIcon(metric.metric)}
                <div>
                  <Text>{formatMetricName(metric.metric)}</Text>
                  <Metric>{formatMetricValue(metric.metric, metric.value)}</Metric>
                  <Text 
                    color={isPositiveTrend(metric.metric, metric.trend) ? 'emerald' : 'red'}
                    className="flex items-center"
                  >
                    {metric.trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
                    {metric.trend === 'down' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1 transform rotate-180" />}
                    {metric.change}% {metric.trend}
                  </Text>
                </div>
              </Flex>
            </Card>
          ))}
        </Grid>
        
        <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
          {/* Health Score */}
          <Card className="col-span-1">
            <Title>System Health</Title>
            <Flex justifyContent="center" alignItems="center" className="mt-4">
              <div className="relative h-40 w-40">
                <SimpleDonutChart
                  data={[{ name: 'Health', count: healthScore }]}
                  colors={[healthStatus.color]}
                  valueFormatter={(v) => `${v}%`}
                />
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Text className="text-sm">Health Score</Text>
                    <Metric className="text-3xl">{healthScore}%</Metric>
                    <Badge color={healthStatus.color} className="mt-1">
                      {healthStatus.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Flex>
            
            <Text className="text-sm text-gray-500 mt-4">
              The health score is calculated based on error rates, response times, and overall system performance.
            </Text>
          </Card>
          
          {/* LLM Requests Chart */}
          <Card className="col-span-2">
            <Title>LLM Requests Over Time</Title>
            <Text className="text-gray-500">Number of LLM requests processed</Text>
            
            <AreaChart
              className="h-64 mt-4"
              data={prepareChartData(llmRequests)}
              index="date"
              categories={["value"]}
              colors={["blue"]}
              valueFormatter={(v) => formatNumber(v)}
              showLegend={false}
              showAnimation={true}
            />
            
            <div className="text-xs text-right text-gray-500 mt-2">
              Source: LLM Request API | Updated {lastUpdated?.toLocaleString()}
            </div>
          </Card>
        </Grid>
      </div>

      {/* Performance Section */}
      <div id="performance" className="mb-12">
        <ExpandableSection
          title="Performance Metrics"
          description="Response times, throughput, and other performance indicators"
          icon={<ChartBarIcon className="h-6 w-6" />}
          defaultExpanded={true}
        >
          <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mb-6">
            {metricCategories.performance.metrics.map((metric, index) => (
              <Card key={index}>
                <Flex justifyContent="start" className="space-x-4">
                  {getMetricIcon(metric.metric)}
                  <div>
                    <Text>{formatMetricName(metric.metric)}</Text>
                    <Metric>{formatMetricValue(metric.metric, metric.value)}</Metric>
                    <Text 
                      color={isPositiveTrend(metric.metric, metric.trend) ? 'emerald' : 'red'}
                      className="flex items-center"
                    >
                      {metric.trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
                      {metric.trend === 'down' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1 transform rotate-180" />}
                      {metric.change}% {metric.trend}
                    </Text>
                  </div>
                </Flex>
              </Card>
            ))}
          </Grid>
          
          <div className="text-xs text-right text-gray-500 mt-2">
            Based on data from the last {timeRange} | Calculation method: average over time period
          </div>
        </ExpandableSection>
      </div>

      {/* Security Section */}
      <div id="security" className="mb-12">
        <ExpandableSection
          title="Security Metrics"
          description="Security alerts, potential vulnerabilities, and risk scores"
          icon={<ShieldExclamationIcon className="h-6 w-6" />}
          defaultExpanded={true}
        >
          <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
            {metricCategories.security.metrics.map((metric, index) => (
              <Card key={index}>
                <Flex justifyContent="start" className="space-x-4">
                  {getMetricIcon(metric.metric)}
                  <div>
                    <Text>{formatMetricName(metric.metric)}</Text>
                    <Metric>{formatMetricValue(metric.metric, metric.value)}</Metric>
                    <Text 
                      color={isPositiveTrend(metric.metric, metric.trend) ? 'emerald' : 'red'}
                      className="flex items-center"
                    >
                      {metric.trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
                      {metric.trend === 'down' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1 transform rotate-180" />}
                      {metric.change}% {metric.trend}
                    </Text>
                  </div>
                </Flex>
              </Card>
            ))}
          </Grid>
          
          <div className="text-xs text-right text-gray-500 mt-2">
            Source: Security API | Data freshness: {lastUpdated ? 'Up-to-date' : 'Stale'}
          </div>
        </ExpandableSection>
      </div>
      
      {/* Agents Section */}
      <div id="agents" className="mb-12">
        <ExpandableSection
          title="Agent Activity"
          description="Performance metrics for individual agents in your system"
          icon={<UserGroupIcon className="h-6 w-6" />}
          defaultExpanded={true}
        >
          <Card className="mb-6">
            <Title>Top Active Agents</Title>
            
            <Table className="mt-4">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Agent</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Requests</TableHeaderCell>
                  <TableHeaderCell className="text-right">Token Usage</TableHeaderCell>
                  <TableHeaderCell className="text-right">Errors</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topAgents.length > 0 ? (
                  topAgents.map((agent) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell>
                        <Bold>{agent.name}</Bold>
                      </TableCell>
                      <TableCell>{agent.type}</TableCell>
                      <TableCell>
                        <StatusBadge status={agent.status} />
                      </TableCell>
                      <TableCell className="text-right">{agent.request_count.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{agent.token_usage.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{agent.error_count.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/agents/${agent.agent_id}`}>
                          <Button size="xs" variant="light" icon={ChevronRightIcon}>
                            Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No agent data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
          
          {topAgents.length > 0 && (
            <Card>
              <Title>Agent Comparison</Title>
              
              <BarChart
                className="h-72 mt-4"
                data={getAgentComparisonData()}
                index="name"
                categories={["requests", "tokens", "errors"]}
                colors={["blue", "violet", "red"]}
                stack={false}
                valueFormatter={(value) => formatNumber(value)}
              />
              
              <Legend
                className="mt-3"
                categories={["Requests", "Tokens", "Errors"]}
                colors={["blue", "violet", "red"]}
              />
            </Card>
          )}
        </ExpandableSection>
      </div>
      
      {/* Tools & Models Section */}
      <div id="tools" className="mb-12">
        <ExpandableSection
          title="Tools & Models"
          description="Metrics for LLM models and tools used by your agents"
          icon={<CpuChipIcon className="h-6 w-6" />}
          defaultExpanded={true}
        >
          <Grid numItemsMd={2} className="gap-6">
            {/* Token Usage Chart */}
            <Card>
              <Title>Token Usage</Title>
              <Text className="text-gray-500">Total tokens used over time</Text>
              
              <AreaChart
                className="h-64 mt-4"
                data={prepareChartData(tokenUsage)}
                index="date"
                categories={["value"]}
                colors={["violet"]}
                valueFormatter={(v) => formatNumber(v)}
                showLegend={false}
                showAnimation={true}
              />
              
              <div className="text-xs text-right text-gray-500 mt-2">
                Source: Token Usage API | Updated {lastUpdated?.toLocaleString()}
              </div>
            </Card>
            
            {/* Tool Executions Chart */}
            <Card>
              <Title>Tool Executions</Title>
              <Text className="text-gray-500">Number of tool calls made by agents</Text>
              
              <AreaChart
                className="h-64 mt-4"
                data={prepareChartData(toolExecutions)}
                index="date"
                categories={["value"]}
                colors={["amber"]}
                valueFormatter={(v) => formatNumber(v)}
                showLegend={false}
                showAnimation={true}
              />
              
              <div className="text-xs text-right text-gray-500 mt-2">
                Source: Tool Execution API | Updated {lastUpdated?.toLocaleString()}
              </div>
            </Card>
          </Grid>
          
          <div className="mt-6">
            {metricCategories.tools.metrics.length > 0 && (
              <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
                {metricCategories.tools.metrics.map((metric, index) => (
                  <Card key={index}>
                    <Flex justifyContent="start" className="space-x-4">
                      {getMetricIcon(metric.metric)}
                      <div>
                        <Text>{formatMetricName(metric.metric)}</Text>
                        <Metric>{formatMetricValue(metric.metric, metric.value)}</Metric>
                        <Text 
                          color={isPositiveTrend(metric.metric, metric.trend) ? 'emerald' : 'red'}
                          className="flex items-center"
                        >
                          {metric.trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
                          {metric.trend === 'down' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1 transform rotate-180" />}
                          {metric.change}% {metric.trend}
                        </Text>
                      </div>
                    </Flex>
                  </Card>
                ))}
              </Grid>
            )}
          </div>
        </ExpandableSection>
      </div>
      
      {/* Recent Activity Section */}
      <div id="activity" className="mb-12">
        <ExpandableSection
          title="Recent Activity"
          description="Session activity and usage patterns"
          icon={<ClockIcon className="h-6 w-6" />}
          defaultExpanded={true}
        >
          <Card>
            <Title>Session Activity</Title>
            <Text className="text-gray-500">Number of active sessions over time</Text>
            
            <AreaChart
              className="h-64 mt-4"
              data={prepareChartData(sessionCounts)}
              index="date"
              categories={["value"]}
              colors={["emerald"]}
              valueFormatter={(v) => formatNumber(v)}
              showLegend={false}
              showAnimation={true}
            />
            
            <div className="text-xs text-right text-gray-500 mt-2">
              Source: Session Count API | Updated {lastUpdated?.toLocaleString()}
            </div>
          </Card>
        </ExpandableSection>
      </div>
      
      {/* Footer */}
      <Card className="mt-8 bg-gray-50 p-4">
        <Flex justifyContent="between" alignItems="center">
          <Text className="text-sm text-gray-500">
            Cylestio Monitor Dashboard | Version 1.5.0
          </Text>
          <div className="flex items-center space-x-4">
            <ConnectionStatus />
            {lastUpdated && (
              <Text className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </Text>
            )}
          </div>
        </Flex>
      </Card>
    </div>
  )
}
