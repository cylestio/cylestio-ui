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
  UserGroupIcon,
  CurrencyDollarIcon
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
import { DASHBOARD, AGENTS, METRICS, SECURITY } from '../lib/api-endpoints'
import { colors } from './DesignSystem'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorMessage from './ErrorMessage'
import ResponsiveContainer from './ResponsiveContainer'
import TokenUsageBreakdown from './TokenUsageBreakdown'
import ToolUsageAnalysis from './ToolUsageAnalysis'
import ModelUsageAnalytics from './ModelUsageAnalytics'
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
      let currentMetrics: DashboardMetric[] = [];

      // =======================================
      // CARD 1: ACTIVE AGENTS
      // =======================================
      try {
        console.log('Fetching active agents data...');
        const agentsParams = {
          page: 1,
          page_size: 100, // Increase to get a more accurate count of active agents
          sort_by: 'updated_at',
          sort_dir: 'desc',
          time_range: timeRange
        };
        
        const agentsData = await fetchAPI<TopAgentsResponse>(`${AGENTS.LIST}${buildQueryParams(agentsParams)}`);
        if (agentsData && agentsData.items) {
          console.log(`Received ${agentsData.items.length} agents`);
          setTopAgents(agentsData.items);
          
          // Count active agents (agents that sent events in last 24 hours)
          const activeAgents = agentsData.items.filter(agent => agent.status === 'active');
          console.log(`Active agents count: ${activeAgents.length}`);
          
          // Add active agents count to metrics
          currentMetrics.push({
            metric: 'active_agents',
            value: activeAgents.length,
            change: 0,
            trend: 'stable'
          });
          
          // Update metrics immediately so Active Agents card shows the correct value
          setMetrics(currentMetrics);
          
          receivedAnyData = true;
        } else {
          console.log('No agents data received');
          setTopAgents([]);
          
          // Still add a metric with zero count
          currentMetrics.push({
            metric: 'active_agents',
            value: 0,
            change: 0,
            trend: 'stable'
          });
          setMetrics(currentMetrics);
        }
      } catch (error) {
        console.error('Failed to fetch active agents:', error);
        setTopAgents([]);
        
        // Still add a metric with zero count on error
        currentMetrics.push({
          metric: 'active_agents',
          value: 0,
          change: 0,
          trend: 'stable'
        });
        setMetrics(currentMetrics);
      }
      
      // =======================================
      // CARD 2: SECURITY ALERTS
      // =======================================
      try {
        console.log('Fetching security alerts count...');
        // Using /v1/alerts instead of /v1/alerts/count which had errors
        const alertsResponse = await fetchAPI<{total_count: number; metrics: {total_count: number}; time_range: {from: string; to: string; description: string}}>(`${SECURITY.ALERTS}?time_range=${timeRange}`);
        const alertsCount = alertsResponse?.total_count || alertsResponse?.metrics?.total_count || 0;
        console.log('Received security alerts count:', alertsCount);
        
        // Update metrics with security alerts count
        currentMetrics.push({
          metric: 'security_alerts',
          value: alertsCount,
          change: 0,
          trend: 'stable'
        });
        
        // Update metrics immediately
        setMetrics(currentMetrics);
        console.log('Updated metrics with security alerts:', currentMetrics);
        
        receivedAnyData = true;
      } catch (error) {
        console.error('Failed to fetch security alerts count:', error);
        // Add a fallback zero metric for security alerts
        currentMetrics.push({
          metric: 'security_alerts',
          value: 0,
          change: 0,
          trend: 'stable'
        });
        setMetrics(currentMetrics);
      }
      
      // =======================================
      // CARD 3: AVAILABLE TOOLS
      // =======================================
      try {
        console.log('Fetching available tools data...');
        const toolsResponse = await fetchAPI<ToolInteractionsResponse>(`${METRICS.TOOL_INTERACTIONS}?time_range=${timeRange}`);
        
        if (toolsResponse && toolsResponse.interactions && toolsResponse.interactions.length > 0) {
          console.log(`Received ${toolsResponse.interactions.length} tool interactions`);
          
          // Count unique tools
          const uniqueTools = new Set<string>();
          toolsResponse.interactions.forEach(interaction => {
            if (interaction.tool_name) {
              uniqueTools.add(interaction.tool_name);
            }
          });
          
          const uniqueToolsArray = Array.from(uniqueTools);
          console.log(`Unique tools count: ${uniqueTools.size}`);
          console.log(`Unique tools: ${uniqueToolsArray.join(', ')}`);
          
          // Add tools count to metrics
          currentMetrics.push({
            metric: 'tools_count',
            value: uniqueTools.size,
            change: 0,
            trend: 'stable'
          });
          
          // Update metrics state immediately
          setMetrics(currentMetrics);
          
          // Process tool interactions for charts
          const processedData = toolsResponse.interactions.reduce((acc: TimeSeriesData[], interaction) => {
            const timestamp = interaction.request_timestamp;
            const existingPoint = acc.find(point => point.timestamp === timestamp);
            
            if (existingPoint) {
              existingPoint.value += 1;
            } else {
              acc.push({
                timestamp,
                value: 1,
                dimensions: {
                  tool_name: interaction.tool_name
                }
              });
            }
            
            return acc;
          }, []);
          
          setToolExecutions(processedData);
          receivedAnyData = true;
        } else {
          console.log('No tool interactions received');
          // Add fallback metric for tools count
          currentMetrics.push({
            metric: 'tools_count',
            value: 0,
            change: 0,
            trend: 'stable'
          });
          setMetrics(currentMetrics);
          setToolExecutions([]);
        }
      } catch (error) {
        console.error('Failed to fetch available tools:', error);
        // Add fallback metric for tools count
        currentMetrics.push({
          metric: 'tools_count',
          value: 0,
          change: 0,
          trend: 'stable'
        });
        setMetrics(currentMetrics);
        setToolExecutions([]);
      }
      
      // =======================================
      // CARD 4: ESTIMATED COST
      // =======================================
      try {
        console.log('Fetching token usage cost data...');
        const costResponse = await fetchAPI<{token_usage_cost: {totals: {total_cost: number}}}>(`${METRICS.TOKEN_USAGE_COST}?time_range=${timeRange}`);
        const cost = costResponse?.token_usage_cost?.totals?.total_cost || 0;
        console.log(`Received token usage cost: $${cost.toFixed(2)}`);
        
        // Add token_usage_cost to metrics
        currentMetrics.push({
          metric: 'token_usage_cost',
          value: cost,
          change: 0,
          trend: 'stable'
        });
        
        // Update metrics state immediately
        setMetrics(currentMetrics);
        
        receivedAnyData = true;
      } catch (error) {
        console.error('Failed to fetch token usage cost:', error);
        // Set a fallback value of 0
        currentMetrics.push({
          metric: 'token_usage_cost',
          value: 0,
          change: 0,
          trend: 'stable'
        });
        setMetrics(currentMetrics);
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
  
  // In the render section, add debug logging for the security alerts metric
  const securityAlertsMetric = metrics.find(m => m.metric === 'security_alerts');
  console.log('Current security alerts metric:', securityAlertsMetric);
  
  // Add debug logging for the tools_count and token_usage_cost metrics
  const toolsCountMetric = metrics.find(m => m.metric === 'tools_count');
  console.log('Current tools count metric:', toolsCountMetric);
  
  const tokenUsageCostMetric = metrics.find(m => m.metric === 'token_usage_cost');
  console.log('Current token usage cost metric:', tokenUsageCostMetric);
  
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
            <Link href="/agents" className="block hover:no-underline transition duration-200 transform hover:scale-[1.02]">
              <MetricCard
                title="Active Agents"
                value={metrics.find(m => m.metric === 'active_agents')?.value || 0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 7 L12 17" />
                    <path d="M7 12 L17 12" />
                    <path d="M3.5 8.5 L7 12 L3.5 15.5" />
                    <path d="M20.5 8.5 L17 12 L20.5 15.5" />
                    <path d="M8.5 3.5 L12 7 L15.5 3.5" />
                    <path d="M8.5 20.5 L12 17 L15.5 20.5" />
                  </svg>
                }
                variant="primary"
                valueClassName="text-2xl"
                size="md"
                trend={undefined}
                loading={loading}
              />
            </Link>
            
            <Link href="/security" className="block hover:no-underline transition duration-200 transform hover:scale-[1.02]">
              <MetricCard
                title="Security Alerts"
                value={metrics.find(m => m.metric === 'security_alerts')?.value || 0}
                icon={<ShieldExclamationIcon className="w-7 h-7 text-red-600" />}
                variant="error"
                valueClassName="text-2xl"
                size="md"
                trend={undefined}
                loading={loading}

              />
            </Link>
            
            <Link href="/tools" className="block hover:no-underline transition duration-200 transform hover:scale-[1.02]">
              <MetricCard
                title="Available Tools"
                value={metrics.find(m => m.metric === 'tools_count')?.value || 0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M9 9h6v6H9z" />
                    <path d="M4 9h2" />
                    <path d="M4 15h2" />
                    <path d="M18 9h2" />
                    <path d="M18 15h2" />
                    <path d="M9 4v2" />
                    <path d="M15 4v2" />
                    <path d="M9 18v2" />
                    <path d="M15 18v2" />
                  </svg>
                }
                variant="secondary"
                valueClassName="text-2xl"
                size="md"
                trend={undefined}
                loading={loading}
              />
            </Link>
            
            <Link href="/analytics" className="block hover:no-underline transition duration-200 transform hover:scale-[1.02]">
              <MetricCard
                title="Estimated Cost"
                value={`$${(metrics.find(m => m.metric === 'token_usage_cost')?.value || 0).toFixed(2)}`}
                icon={<CurrencyDollarIcon className="w-7 h-7 text-emerald-600" />}
                variant="success"
                valueClassName="text-2xl"
                size="md"
                trend={undefined}
                loading={loading}
              />
            </Link>
          </ResponsiveContainer>
        </div>
        
        {/* ResponsiveContainer removed along with System Health and LLM Requests components */}

        {/* Continue with other sections... */}
        
        {/* Token Usage Breakdown Section */}
        <div className="mt-6 mb-8">
          <TokenUsageBreakdown 
            timeRange={timeRange}
            className="h-full" 
          />
        </div>
        
        {/* Model Usage Analytics Section */}
        <div className="mt-6 mb-8">
          <ModelUsageAnalytics 
            timeRange={timeRange}
            className="h-full"
          />
        </div>
        
        {/* Tool Usage Analysis Section */}
        <div className="mt-6 mb-8">
          <ToolUsageAnalysis 
            timeRange={timeRange}
            className="h-full"
          />
        </div>
        
        {/* Security Alerts Section */}
        <div className="mt-6 mb-8">
          <Card className="p-6">
            <Flex justifyContent="between" alignItems="center" className="mb-4">
              <Flex alignItems="center" className="gap-2">
                <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
                <Title>Security Alerts</Title>
              </Flex>
              <Link href="/security">
                <Button size="xs" variant="light" icon={EyeIcon}>
                  View All
                </Button>
              </Link>
            </Flex>
            
            <Text className="mb-6">
              Monitor your LLM application security and respond to potential threats
            </Text>
            
            <Flex className="gap-4 flex-wrap">
              <Card className="p-4 shadow-sm border border-red-100 flex-1" decoration="top" decorationColor="red">
                <Text>Critical Alerts</Text>
                <Metric className="text-red-600">
                  {metrics.find(m => m.metric === 'security_alerts_critical')?.value || 0}
                </Metric>
                <Link href="/security?severity=critical">
                  <Text className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2">View Critical Alerts</Text>
                </Link>
              </Card>
              
              <Card className="p-4 shadow-sm border border-orange-100 flex-1" decoration="top" decorationColor="orange">
                <Text>High Severity</Text>
                <Metric className="text-orange-600">
                  {metrics.find(m => m.metric === 'security_alerts_high')?.value || 0}
                </Metric>
                <Link href="/security?severity=high">
                  <Text className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2">View High Severity Alerts</Text>
                </Link>
              </Card>
              
              <Card className="p-4 shadow-sm border border-gray-100 flex-1" decoration="top" decorationColor="blue">
                <Text>Total Alerts</Text>
                <Metric>
                  {metrics.find(m => m.metric === 'security_alerts')?.value || 0}
                </Metric>
                <Link href="/security">
                  <Text className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2">Security Explorer</Text>
                </Link>
              </Card>
            </Flex>
          </Card>
        </div>
        
        {/* Continue with the rest of the dashboard ... */}
      </div>
    </div>
  )
}
