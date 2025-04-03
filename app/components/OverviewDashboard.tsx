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
  ListItem
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
  ChartPieIcon
} from '@heroicons/react/24/outline'
import { ConnectionStatus } from './ConnectionStatus'
import { SimpleDonutChart } from './SimpleDonutChart'
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
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(`${err instanceof Error ? err.message : 'Failed to load dashboard data'}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to get appropriate interval based on time range
  const getInterval = (range: string): string => {
    switch (range) {
      case '1h': return '1m'
      case '1d': return '1h'
      case '7d': return '1d'
      case '30d': return '1d'
      default: return '1d'
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  // Format metric name for display
  const formatMetricName = (metric: string) => {
    const parts = metric.split('.')
    return parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ')
  }

  // Format metric value
  const formatMetricValue = (metric: string, value: number) => {
    if (metric.includes('token')) {
      return `${value.toLocaleString()} tokens`
    } else if (metric.includes('time') || metric.includes('duration')) {
      return `${value.toLocaleString()} ms`
    } else if (metric.includes('rate')) {
      return `${(value * 100).toFixed(1)}%`
    } else if (metric.includes('cost')) {
      return `$${value.toFixed(2)}`
    }
    return value.toLocaleString()
  }

  // Format date for charts
  const formatChartDate = (timestamp: string, range: string) => {
    const date = new Date(timestamp)
    
    switch (range) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      case '1d':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      default:
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch (e) {
      return 'Invalid date'
    }
  }
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge color="green">Active</Badge>
      case 'inactive':
      case 'paused':
        return <Badge color="gray">Inactive</Badge>
      case 'error':
        return <Badge color="red">Error</Badge>
      default:
        return <Badge color="gray">{status}</Badge>
    }
  }

  // Helper to transform time series data for charts
  const prepareChartData = (data: TimeSeriesData[]) => {
    return data.map(item => ({
      date: formatChartDate(item.timestamp, timeRange),
      value: item.value
    }))
  }

  // Get icon for metric
  const getMetricIcon = (metric: string) => {
    if (metric.includes('llm') || metric.includes('token')) return <BoltIcon className="h-5 w-5" />
    if (metric.includes('tool')) return <CpuChipIcon className="h-5 w-5" />
    if (metric.includes('error')) return <ExclamationTriangleIcon className="h-5 w-5" />
    if (metric.includes('session')) return <ChatBubbleLeftRightIcon className="h-5 w-5" />
    if (metric.includes('time') || metric.includes('duration')) return <ClockIcon className="h-5 w-5" />
    return <ChartBarIcon className="h-5 w-5" />
  }

  // Get color for metric
  const getMetricColor = (metric: string): Color => {
    if (metric.includes('llm') || metric.includes('token')) return 'blue'
    if (metric.includes('tool')) return 'indigo'
    if (metric.includes('error')) return 'red'
    if (metric.includes('session')) return 'emerald'
    if (metric.includes('time') || metric.includes('duration')) return 'amber'
    return 'slate'
  }

  // Determine if trend is positive
  const isPositiveTrend = (metric: string, trend: string): boolean => {
    if (metric.includes('error') || metric.includes('failure')) {
      return trend === 'down'
    }
    return trend === 'up'
  }

  // Get metrics by category
  const getMetricsByCategory = () => {
    const categories = {
      'LLM': metrics.filter(m => m.metric.includes('llm') || m.metric.includes('token')),
      'Tools': metrics.filter(m => m.metric.includes('tool')),
      'Sessions': metrics.filter(m => m.metric.includes('session')),
      'Performance': metrics.filter(m => m.metric.includes('time') || m.metric.includes('duration')),
      'Errors': metrics.filter(m => m.metric.includes('error') || m.metric.includes('failure')),
      'Other': metrics.filter(m => 
        !m.metric.includes('llm') && 
        !m.metric.includes('token') && 
        !m.metric.includes('tool') && 
        !m.metric.includes('session') && 
        !m.metric.includes('time') && 
        !m.metric.includes('duration') && 
        !m.metric.includes('error') && 
        !m.metric.includes('failure')
      )
    }
    
    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key as keyof typeof categories].length === 0) {
        delete categories[key as keyof typeof categories]
      }
    })
    
    return categories
  }

  // Get chart data for agent comparison
  const getAgentComparisonData = () => {
    if (!topAgents || topAgents.length === 0) return []
    
    return topAgents.map(agent => ({
      name: agent.name,
      'Requests': agent.request_count,
      'Tokens': agent.token_usage / 1000 // Show in thousands
    }))
  }

  // Format large numbers for display
  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return value.toString()
  }

  // Generate summary metrics for overview section
  const getSummaryMetrics = () => {
    const summaryMetrics = []
    
    // LLM Requests
    const llmRequestMetric = metrics.find(m => m.metric === 'llm_request_count')
    if (llmRequestMetric) {
      summaryMetrics.push({
        name: 'LLM Requests',
        value: llmRequestMetric.value,
        change: llmRequestMetric.change,
        trend: llmRequestMetric.trend,
        icon: <BoltIcon className="h-6 w-6" />,
        color: 'blue' as Color
      })
    }
    
    // Token Usage
    const tokenUsageMetric = metrics.find(m => m.metric === 'llm_token_usage')
    if (tokenUsageMetric) {
      summaryMetrics.push({
        name: 'Token Usage',
        value: tokenUsageMetric.value,
        change: tokenUsageMetric.change,
        trend: tokenUsageMetric.trend,
        icon: <DocumentTextIcon className="h-6 w-6" />,
        color: 'indigo' as Color,
        suffix: ' tokens'
      })
    }
    
    // Tool Executions
    const toolExecMetric = metrics.find(m => m.metric === 'tool_execution_count')
    if (toolExecMetric) {
      summaryMetrics.push({
        name: 'Tool Executions',
        value: toolExecMetric.value,
        change: toolExecMetric.change,
        trend: toolExecMetric.trend,
        icon: <CpuChipIcon className="h-6 w-6" />,
        color: 'emerald' as Color
      })
    }
    
    // Avg Response Time
    const responseTimeMetric = metrics.find(m => m.metric === 'llm_avg_response_time')
    if (responseTimeMetric) {
      summaryMetrics.push({
        name: 'Avg Response Time',
        value: responseTimeMetric.value,
        change: responseTimeMetric.change,
        trend: responseTimeMetric.trend,
        icon: <ClockIcon className="h-6 w-6" />,
        color: 'amber' as Color,
        suffix: ' ms',
        inverseTrend: true
      })
    }
    
    // Error Count
    const errorCountMetric = metrics.find(m => m.metric === 'error_count')
    if (errorCountMetric) {
      summaryMetrics.push({
        name: 'Errors',
        value: errorCountMetric.value,
        change: errorCountMetric.change,
        trend: errorCountMetric.trend,
        icon: <ExclamationTriangleIcon className="h-6 w-6" />,
        color: 'red' as Color,
        inverseTrend: true
      })
    }
    
    // Sessions
    const sessionCountMetric = metrics.find(m => m.metric === 'session_count')
    if (sessionCountMetric) {
      summaryMetrics.push({
        name: 'Sessions',
        value: sessionCountMetric.value,
        change: sessionCountMetric.change,
        trend: sessionCountMetric.trend,
        icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
        color: 'green' as Color
      })
    }
    
    return summaryMetrics
  }

  // Get health status based on the health score
  const healthStatus = getHealthStatus(healthScore)

  return (
    <div className="space-y-6">
      {/* Streamlined header with embedded connection status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md">
              <EyeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Cylestio Monitor</h1>
              <p className="text-gray-500">AI Agent Observability Dashboard</p>
            </div>
            <div className="ml-4">
              <ConnectionStatus />
            </div>
          </div>
          
          <Flex justifyContent="end" alignItems="center" className="gap-4">
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value)}
              className="w-40 border border-gray-200 rounded-md shadow-sm"
            >
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </Select>
            
            <Button
              icon={ArrowPathIcon}
              color="blue"
              size="sm"
              loading={loading}
              onClick={fetchDashboardData}
              tooltip="Refresh all data"
              className="shadow-sm"
            >
              Refresh
            </Button>
          </Flex>
        </div>
        
        {error && (
          <div className="bg-red-50 px-6 py-3 border-b border-red-100">
            <Flex alignItems="center" className="gap-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <Text className="font-medium">{error}</Text>
            </Flex>
          </div>
        )}
        
        {/* Real-time status bar */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
          <Flex alignItems="center" className="gap-3">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${healthScore >= 90 ? 'bg-green-500' : healthScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <Text className="font-medium">System Health: {healthScore}% ({healthStatus.status})</Text>
            </div>
            <div className="h-4 border-r border-gray-300 mx-2"></div>
            <Text className="text-gray-600">
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </Text>
          </Flex>
          <Flex className="gap-6">
            {metrics.find(m => m.metric === 'error_count')?.value > 0 && (
              <Flex alignItems="center" className="gap-1 text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <Text className="font-medium">{metrics.find(m => m.metric === 'error_count')?.value} Errors</Text>
              </Flex>
            )}
            <Flex alignItems="center" className="gap-1 text-blue-600">
              <BoltIcon className="h-4 w-4" />
              <Text className="font-medium">{metrics.find(m => m.metric === 'llm_request_count')?.value || 0} LLM Requests</Text>
            </Flex>
          </Flex>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Key performance indicators */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* LLM Requests */}
          <Card className="shadow-sm border border-gray-100 bg-gradient-to-b from-white to-blue-50">
            <Flex alignItems="start" justifyContent="between">
              <div>
                <Text className="text-gray-500">LLM Requests</Text>
                <Metric className="text-3xl my-1">{metrics.find(m => m.metric === 'llm_request_count')?.value || 0}</Metric>
                <Flex alignItems="center" className="mt-1">
                  <Badge color="blue" size="xs">
                    {metrics.find(m => m.metric === 'llm_request_count')?.trend === 'up' ? '↑' : '↓'} 
                    {Math.abs(metrics.find(m => m.metric === 'llm_request_count')?.change || 0).toFixed(1)}%
                  </Badge>
                  <Text className="text-xs text-gray-500 ml-2">vs. previous period</Text>
                </Flex>
              </div>
              <div className="bg-blue-100 rounded-full p-2">
                <BoltIcon className="h-8 w-8 text-blue-600" />
              </div>
            </Flex>
            {llmRequests.length > 0 && (
              <div className="mt-4 -mb-4 -ml-4 -mr-4">
                <AreaChart
                  data={prepareChartData(llmRequests)}
                  index="date"
                  categories={["value"]}
                  colors={["blue"]}
                  showAnimation={false}
                  showLegend={false}
                  showXAxis={false}
                  showYAxis={false}
                  showGridLines={false}
                  showTooltip={false}
                  curveType="natural"
                  className="h-16 mt-2"
                />
              </div>
            )}
          </Card>
          
          {/* Token Usage */}
          <Card className="shadow-sm border border-gray-100 bg-gradient-to-b from-white to-indigo-50">
            <Flex alignItems="start" justifyContent="between">
              <div>
                <Text className="text-gray-500">Token Usage</Text>
                <Metric className="text-3xl my-1">
                  {metrics.find(m => m.metric === 'llm_token_usage')?.value?.toLocaleString() || 0}
                </Metric>
                <Flex alignItems="center" className="mt-1">
                  <Badge color="indigo" size="xs">
                    {metrics.find(m => m.metric === 'llm_token_usage')?.trend === 'up' ? '↑' : '↓'} 
                    {Math.abs(metrics.find(m => m.metric === 'llm_token_usage')?.change || 0).toFixed(1)}%
                  </Badge>
                  <Text className="text-xs text-gray-500 ml-2">vs. previous period</Text>
                </Flex>
              </div>
              <div className="bg-indigo-100 rounded-full p-2">
                <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
              </div>
            </Flex>
            {tokenUsage.length > 0 && (
              <div className="mt-4 -mb-4 -ml-4 -mr-4">
                <AreaChart
                  data={prepareChartData(tokenUsage)}
                  index="date"
                  categories={["value"]}
                  colors={["indigo"]}
                  showAnimation={false}
                  showLegend={false}
                  showXAxis={false}
                  showYAxis={false}
                  showGridLines={false}
                  showTooltip={false}
                  curveType="natural"
                  className="h-16 mt-2"
                />
              </div>
            )}
          </Card>
          
          {/* Response Time */}
          <Card className="shadow-sm border border-gray-100 bg-gradient-to-b from-white to-amber-50">
            <Flex alignItems="start" justifyContent="between">
              <div>
                <Text className="text-gray-500">Avg Response Time</Text>
                <Metric className="text-3xl my-1">
                  {metrics.find(m => m.metric === 'llm_avg_response_time')?.value?.toLocaleString() || 0} ms
                </Metric>
                <Flex alignItems="center" className="mt-1">
                  <Badge 
                    color={metrics.find(m => m.metric === 'llm_avg_response_time')?.trend === 'down' ? 'green' : 'red'} 
                    size="xs"
                  >
                    {metrics.find(m => m.metric === 'llm_avg_response_time')?.trend === 'up' ? '↑' : '↓'} 
                    {Math.abs(metrics.find(m => m.metric === 'llm_avg_response_time')?.change || 0).toFixed(1)}%
                  </Badge>
                  <Text className="text-xs text-gray-500 ml-2">vs. previous period</Text>
                </Flex>
              </div>
              <div className="bg-amber-100 rounded-full p-2">
                <ClockIcon className="h-8 w-8 text-amber-600" />
              </div>
            </Flex>
          </Card>
          
          {/* Sessions */}
          <Card className="shadow-sm border border-gray-100 bg-gradient-to-b from-white to-emerald-50">
            <Flex alignItems="start" justifyContent="between">
              <div>
                <Text className="text-gray-500">Sessions</Text>
                <Metric className="text-3xl my-1">
                  {metrics.find(m => m.metric === 'session_count')?.value || 0}
                </Metric>
                <Flex alignItems="center" className="mt-1">
                  <Badge color="emerald" size="xs">
                    {metrics.find(m => m.metric === 'session_count')?.trend === 'up' ? '↑' : '↓'} 
                    {Math.abs(metrics.find(m => m.metric === 'session_count')?.change || 0).toFixed(1)}%
                  </Badge>
                  <Text className="text-xs text-gray-500 ml-2">vs. previous period</Text>
                </Flex>
              </div>
              <div className="bg-emerald-100 rounded-full p-2">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-emerald-600" />
              </div>
            </Flex>
            {sessionCounts.length > 0 && (
              <div className="mt-4 -mb-4 -ml-4 -mr-4">
                <AreaChart
                  data={prepareChartData(sessionCounts)}
                  index="date"
                  categories={["value"]}
                  colors={["emerald"]}
                  showAnimation={false}
                  showLegend={false}
                  showXAxis={false}
                  showYAxis={false}
                  showGridLines={false}
                  showTooltip={false}
                  curveType="natural"
                  className="h-16 mt-2"
                />
              </div>
            )}
          </Card>
        </div>

        {/* Health & Errors Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border border-gray-100 h-full">
            <Title>System Status</Title>
            <Flex justifyContent="center" alignItems="center" className="mt-4 relative">
              <DonutChart
                data={[
                  { name: 'Health', value: healthScore },
                  { name: 'Remaining', value: 100 - healthScore }
                ]}
                showLabel={false}
                showAnimation={true}
                category="value"
                index="name"
                colors={[healthScore >= 90 ? 'green' : healthScore >= 75 ? 'yellow' : 'red', 'gray']}
                variant="donut"
                className="w-44 h-44 mx-auto"
              />
              <div className="absolute inset-0 flex flex-col justify-center items-center">
                <Text className="text-lg font-medium">{healthStatus.status}</Text>
                <Metric className="text-4xl">{healthScore}%</Metric>
              </div>
            </Flex>
            
            <Divider className="my-4" />
            
            <div className="space-y-4">
              <Flex alignItems="center" justifyContent="between">
                <Flex alignItems="center" className="gap-2">
                  <div className={`p-1 rounded-full ${metrics.find(m => m.metric === 'error_count')?.value > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                    {metrics.find(m => m.metric === 'error_count')?.value > 0 ? (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <Text className="font-medium">Error Rate</Text>
                </Flex>
                <Badge 
                  color={metrics.find(m => m.metric === 'error_count')?.value > 0 ? 'red' : 'green'}
                  size="sm"
                >
                  {metrics.find(m => m.metric === 'error_count')?.value || 0} errors
                </Badge>
              </Flex>
              
              <Flex alignItems="center" justifyContent="between">
                <Flex alignItems="center" className="gap-2">
                  <div className={`p-1 rounded-full ${metrics.find(m => m.metric === 'llm_avg_response_time')?.value > 2000 ? 'bg-amber-100' : 'bg-green-100'}`}>
                    {metrics.find(m => m.metric === 'llm_avg_response_time')?.value > 2000 ? (
                      <ClockIcon className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <Text className="font-medium">Response Time</Text>
                </Flex>
                <Badge 
                  color={metrics.find(m => m.metric === 'llm_avg_response_time')?.value > 2000 ? 'amber' : 'green'}
                  size="sm"
                >
                  {metrics.find(m => m.metric === 'llm_avg_response_time')?.value?.toLocaleString() || 0} ms
                </Badge>
              </Flex>
              
              <Flex alignItems="center" justifyContent="between">
                <Flex alignItems="center" className="gap-2">
                  <div className="p-1 rounded-full bg-blue-100">
                    <ServerIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <Text className="font-medium">API Status</Text>
                </Flex>
                <Badge color="green" size="sm">Operational</Badge>
              </Flex>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Analytics Section */}
      <TabGroup>
        <div className="bg-white rounded-t-lg shadow-sm border border-gray-100 p-4">
          <TabList className="gap-2">
            <Tab className="px-4 py-2 rounded-md data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 hover:bg-gray-50">
              <Flex alignItems="center" className="gap-2">
                <ChartBarIcon className="h-5 w-5" />
                <span>Performance Trends</span>
              </Flex>
            </Tab>
            <Tab className="px-4 py-2 rounded-md data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 hover:bg-gray-50">
              <Flex alignItems="center" className="gap-2">
                <UserCircleIcon className="h-5 w-5" />
                <span>Agent Activity</span>
              </Flex>
            </Tab>
            <Tab className="px-4 py-2 rounded-md data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 hover:bg-gray-50">
              <Flex alignItems="center" className="gap-2">
                <ChartPieIcon className="h-5 w-5" />
                <span>Metrics Breakdown</span>
              </Flex>
            </Tab>
          </TabList>
        </div>
        
        <div className="bg-white rounded-b-lg shadow-sm border-x border-b border-gray-100 p-6">
          <TabPanels>
            {/* Performance Trends Tab */}
            <TabPanel>
              <div className="space-y-6">
                {/* Performance Overview */}
                <Grid numItemsMd={2} className="gap-6">
                  {/* LLM Requests Chart */}
                  <Card className="shadow-sm border border-gray-100">
                    <Flex alignItems="center" className="gap-2">
                      <div className="bg-blue-100 p-1.5 rounded-full">
                        <BoltIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <Title>LLM Requests</Title>
                    </Flex>
                    
                    {llmRequests.length > 0 ? (
                      <AreaChart
                        className="h-72 mt-4"
                        data={prepareChartData(llmRequests)}
                        index="date"
                        categories={["value"]}
                        colors={["blue"]}
                        valueFormatter={(value) => value.toLocaleString()}
                        showLegend={false}
                        showAnimation={true}
                        curveType="natural"
                      />
                    ) : (
                      <Flex justifyContent="center" alignItems="center" className="h-72 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                        <Text>No data available</Text>
                      </Flex>
                    )}
                  </Card>
                  
                  {/* Token Usage Chart */}
                  <Card className="shadow-sm border border-gray-100">
                    <Flex alignItems="center" className="gap-2">
                      <div className="bg-indigo-100 p-1.5 rounded-full">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <Title>Token Usage</Title>
                    </Flex>
                    
                    {tokenUsage.length > 0 ? (
                      <AreaChart
                        className="h-72 mt-4"
                        data={prepareChartData(tokenUsage)}
                        index="date"
                        categories={["value"]}
                        colors={["indigo"]}
                        valueFormatter={(value) => `${value.toLocaleString()} tokens`}
                        showLegend={false}
                        showAnimation={true}
                        curveType="natural"
                      />
                    ) : (
                      <Flex justifyContent="center" alignItems="center" className="h-72 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                        <Text>No data available</Text>
                      </Flex>
                    )}
                  </Card>
                  
                  {/* Tool Executions Chart */}
                  <Card className="shadow-sm border border-gray-100">
                    <Flex alignItems="center" className="gap-2">
                      <div className="bg-emerald-100 p-1.5 rounded-full">
                        <CpuChipIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <Title>Tool Executions</Title>
                    </Flex>
                    
                    {toolExecutions.length > 0 ? (
                      <AreaChart
                        className="h-72 mt-4"
                        data={prepareChartData(toolExecutions)}
                        index="date"
                        categories={["value"]}
                        colors={["emerald"]}
                        valueFormatter={(value) => value.toLocaleString()}
                        showLegend={false}
                        showAnimation={true}
                        curveType="natural"
                      />
                    ) : (
                      <Flex justifyContent="center" alignItems="center" className="h-72 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                        <Text>No data available</Text>
                      </Flex>
                    )}
                  </Card>
                  
                  {/* Sessions Chart */}
                  <Card className="shadow-sm border border-gray-100">
                    <Flex alignItems="center" className="gap-2">
                      <div className="bg-green-100 p-1.5 rounded-full">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <Title>Sessions</Title>
                    </Flex>
                    
                    {sessionCounts.length > 0 ? (
                      <AreaChart
                        className="h-72 mt-4"
                        data={prepareChartData(sessionCounts)}
                        index="date"
                        categories={["value"]}
                        colors={["green"]}
                        valueFormatter={(value) => value.toLocaleString()}
                        showLegend={false}
                        showAnimation={true}
                        curveType="natural"
                      />
                    ) : (
                      <Flex justifyContent="center" alignItems="center" className="h-72 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                        <Text>No data available</Text>
                      </Flex>
                    )}
                  </Card>
                </Grid>
              </div>
            </TabPanel>
            
            {/* Agent Activity Tab */}
            <TabPanel>
              <div className="space-y-6">
                <Flex alignItems="center" className="gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-full">
                    <UserCircleIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <Title>Top Performing Agents</Title>
                </Flex>
                
                {topAgents.length === 0 ? (
                  <Card className="shadow-sm border border-gray-100">
                    <Flex justifyContent="center" alignItems="center" className="py-12 bg-gray-50 rounded-lg">
                      <Text>No agent data available.</Text>
                    </Flex>
                  </Card>
                ) : (
                  <Grid numItemsMd={12} className="gap-6">
                    {/* Agent Activity Overview */}
                    <Card className="md:col-span-4 shadow-sm border border-gray-100">
                      <Title>Agent Overview</Title>
                      
                      <div className="mt-4 space-y-4">
                        {topAgents.slice(0, 3).map((agent, index) => (
                          <div key={agent.agent_id} className={`p-4 rounded-lg ${index === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                            <Flex justifyContent="between" alignItems="start">
                              <div>
                                <Text className="font-medium">{agent.name}</Text>
                                <Flex className="mt-1 gap-2">
                                  <Badge color="slate" size="xs">{agent.type}</Badge>
                                  <StatusBadge status={agent.status} />
                                </Flex>
                              </div>
                              <Flex direction="col" className="text-right">
                                <Text className="text-lg font-semibold">{agent.request_count}</Text>
                                <Text className="text-xs text-gray-500">requests</Text>
                              </Flex>
                            </Flex>
                            
                            <Grid numItemsMd={3} className="mt-3 gap-2">
                              <div className="bg-white rounded p-2 border border-gray-200">
                                <Flex alignItems="center" className="gap-1">
                                  <BoltIcon className="h-3 w-3 text-blue-500" />
                                  <Text className="text-xs">Requests</Text>
                                </Flex>
                                <Text className="font-medium">{formatNumber(agent.request_count)}</Text>
                              </div>
                              
                              <div className="bg-white rounded p-2 border border-gray-200">
                                <Flex alignItems="center" className="gap-1">
                                  <DocumentTextIcon className="h-3 w-3 text-indigo-500" />
                                  <Text className="text-xs">Tokens</Text>
                                </Flex>
                                <Text className="font-medium">{formatNumber(agent.token_usage)}</Text>
                              </div>
                              
                              <div className="bg-white rounded p-2 border border-gray-200">
                                <Flex alignItems="center" className="gap-1">
                                  <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
                                  <Text className="text-xs">Errors</Text>
                                </Flex>
                                <Text className="font-medium">{formatNumber(agent.error_count)}</Text>
                              </div>
                            </Grid>
                          </div>
                        ))}
                      </div>
                      
                      <Flex justifyContent="center" className="mt-4">
                        <Link href="/agents">
                          <Button variant="light" color="blue" size="sm" icon={ChevronDoubleRightIcon} iconPosition="right">
                            View all agents
                          </Button>
                        </Link>
                      </Flex>
                    </Card>
                    
                    {/* Agent Comparison Chart */}
                    <Card className="md:col-span-8 shadow-sm border border-gray-100">
                      <Title>Performance Comparison</Title>
                      
                      <div className="mt-4">
                        <BarChart
                          className="h-80"
                          data={getAgentComparisonData()}
                          index="name"
                          categories={["Requests", "Tokens"]}
                          colors={["blue", "indigo"]}
                          valueFormatter={(value) => value.toLocaleString()}
                          stack={false}
                          showLegend={true}
                          showAnimation={true}
                        />
                      </div>
                      
                      <Divider className="my-4" />
                      
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell>Agent</TableHeaderCell>
                            <TableHeaderCell>Type</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                            <TableHeaderCell>Metrics</TableHeaderCell>
                            <TableHeaderCell>Action</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topAgents.map((agent) => (
                            <TableRow key={agent.agent_id} className="hover:bg-gray-50">
                              <TableCell>
                                <Text className="font-medium">{agent.name}</Text>
                              </TableCell>
                              <TableCell>
                                <Badge color="slate">{agent.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={agent.status} />
                              </TableCell>
                              <TableCell>
                                <Flex alignItems="center" className="gap-2">
                                  <Flex alignItems="center" className="gap-1">
                                    <BoltIcon className="h-4 w-4 text-blue-500" />
                                    <Text className="text-sm">{formatNumber(agent.request_count)}</Text>
                                  </Flex>
                                  <div className="h-4 border-r border-gray-200"></div>
                                  <Flex alignItems="center" className="gap-1">
                                    <DocumentTextIcon className="h-4 w-4 text-indigo-500" />
                                    <Text className="text-sm">{formatNumber(agent.token_usage)}</Text>
                                  </Flex>
                                  {agent.error_count > 0 && (
                                    <>
                                      <div className="h-4 border-r border-gray-200"></div>
                                      <Flex alignItems="center" className="gap-1">
                                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                        <Text className="text-sm">{formatNumber(agent.error_count)}</Text>
                                      </Flex>
                                    </>
                                  )}
                                </Flex>
                              </TableCell>
                              <TableCell>
                                <Link href={`/agents/${agent.agent_id}`}>
                                  <Button variant="light" color="blue" size="xs">
                                    Details
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </Grid>
                )}
              </div>
            </TabPanel>
            
            {/* Metrics Breakdown Tab */}
            <TabPanel>
              <div className="space-y-6">
                <Flex alignItems="center" className="gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-full">
                    <ChartPieIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <Title>Performance Metrics</Title>
                </Flex>
                
                <Grid numItemsMd={2} className="gap-6">
                  {Object.entries(getMetricsByCategory()).map(([category, categoryMetrics]) => (
                    <Card key={category} className="shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2">
                        {category === 'LLM' && <div className="p-1.5 rounded-full bg-blue-100"><BoltIcon className="h-5 w-5 text-blue-600" /></div>}
                        {category === 'Tools' && <div className="p-1.5 rounded-full bg-emerald-100"><CpuChipIcon className="h-5 w-5 text-emerald-600" /></div>}
                        {category === 'Sessions' && <div className="p-1.5 rounded-full bg-green-100"><ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" /></div>}
                        {category === 'Performance' && <div className="p-1.5 rounded-full bg-amber-100"><ClockIcon className="h-5 w-5 text-amber-600" /></div>}
                        {category === 'Errors' && <div className="p-1.5 rounded-full bg-red-100"><ExclamationTriangleIcon className="h-5 w-5 text-red-600" /></div>}
                        {category === 'Other' && <div className="p-1.5 rounded-full bg-gray-100"><ChartBarIcon className="h-5 w-5 text-gray-600" /></div>}
                        <Title>{category}</Title>
                      </div>
                      
                      <List className="mt-4 divide-y divide-gray-100">
                        {categoryMetrics.map((metric) => (
                          <ListItem key={metric.metric} className="py-4">
                            <Flex justifyContent="between" alignItems="center">
                              <Flex alignItems="center" className="gap-2">
                                <div className={`p-1.5 rounded-full bg-${getMetricColor(metric.metric)}-100`}>
                                  {getMetricIcon(metric.metric)}
                                </div>
                                <div>
                                  <Text className="font-medium">{formatMetricName(metric.metric)}</Text>
                                  <Metric className="text-xl">{formatMetricValue(metric.metric, metric.value)}</Metric>
                                </div>
                              </Flex>
                              <Badge 
                                color={isPositiveTrend(metric.metric, metric.trend) ? 'green' : 'red'}
                                size="sm"
                              >
                                {metric.trend === 'up' ? '↑' : '↓'} {Math.abs(metric.change).toFixed(1)}%
                              </Badge>
                            </Flex>
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  ))}
                </Grid>
              </div>
            </TabPanel>
          </TabPanels>
        </div>
      </TabGroup>
    </div>
  );
}
