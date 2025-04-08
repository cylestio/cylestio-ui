'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Text,
  Flex,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  DonutChart,
  BarChart,
  AreaChart,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Color,
  Button,
  Legend
} from '@tremor/react'
import {
  ChartPieIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import DashboardCard from './DashboardCard'
import { fetchAPI, buildQueryParams } from '../lib/api'
import { METRICS } from '../lib/api-endpoints'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorMessage from './ErrorMessage'
import { colors } from './DesignSystem'
import { SimpleDonutChart } from './SimpleDonutChart'
import { ModelDistributionChart } from './ModelDistributionChart'

// Define types for the API responses
type LLMAnalyticsResponse = {
  total: {
    request_count: number;
    response_time_avg: number;
    response_time_p95: number;
    success_rate: number;
    error_rate: number;
    token_count_input: number;
    token_count_output: number;
    token_count_total: number;
    estimated_cost_usd: number;
    first_seen: string;
    last_seen: string;
  };
  breakdown: {
    key: string;
    metrics: {
      request_count: number;
      response_time_avg: number;
      response_time_p95: number;
      success_rate: number;
      error_rate: number;
      token_count_input: number;
      token_count_output: number;
      token_count_total: number;
      estimated_cost_usd: number;
      first_seen: string;
      last_seen: string;
    };
  }[];
  from_time: string;
  to_time: string;
  filters: {
    agent_id: string | null;
    model_name: string | null;
    from_time: string;
    to_time: string;
    granularity: string;
  };
  breakdown_by: string;
};

type AgentModelRelationship = {
  key: string;
  metrics: {
    request_count: number;
    response_time_avg: number;
    response_time_p95: number;
    success_rate: number;
    error_rate: number;
    token_count_input: number;
    token_count_output: number;
    token_count_total: number;
    estimated_cost_usd: number;
    first_seen: string;
    last_seen: string;
  };
  relation_type: string;
  time_distribution?: {
    timestamp: string;
    request_count: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    avg_duration: number;
  }[];
  token_distribution?: {
    bucket_range: string;
    lower_bound: number;
    upper_bound: number;
    request_count: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    avg_duration: number;
  }[];
};

type UsageTrendsResponse = {
  total: {
    request_count: number;
    token_count_total: number;
    estimated_cost_usd: number;
  };
  breakdown: {
    key: string; // timestamp
    metrics: {
      request_count: number;
      token_count_input: number;
      token_count_output: number;
      token_count_total: number;
      estimated_cost_usd: number;
    };
  }[];
  from_time: string;
  to_time: string;
  filters: {
    agent_id: string | null;
    model_name: string | null;
    from_time: string;
    to_time: string;
    granularity: string;
  };
  breakdown_by: string;
};

// Friendly model name mapping
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'gpt-4': 'GPT-4',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'claude-3-opus': 'Claude 3 Opus',
  'claude-3-sonnet': 'Claude 3 Sonnet',
  'claude-3-haiku': 'Claude 3 Haiku'
};

type ModelUsageAnalyticsProps = {
  className?: string;
  timeRange?: string;
};

// Refined pastel colors matching Tool Execution graph reference
const chartColors = [
  "#818cf8", // Primary soft blue (similar to get_forecast)
  "#a78bfa", // Soft purple (similar to get_alerts)
  "#60a5fa", // Lighter blue
  "#34d399", // Soft green (similar to unknown)
  "#fbbf24", // Amber (similar to get_forecast2)
  "#f472b6", // Pink
  "#4ade80", // Light green
  "#38bdf8", // Sky blue
  "#a5b4fc", // Softer indigo
  "#93c5fd", // Soft blue
  "#c4b5fd", // Lavender
  "#e879f9"  // Fuchsia
];

export default function ModelUsageAnalytics({ className = '', timeRange = '30d' }: ModelUsageAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [modelData, setModelData] = useState<LLMAnalyticsResponse | null>(null);
  const [agentData, setAgentData] = useState<LLMAnalyticsResponse | null>(null);
  const [relationshipData, setRelationshipData] = useState<AgentModelRelationship[] | null>(null);
  const [trendData, setTrendData] = useState<UsageTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModelData();
  }, [timeRange]);

  const fetchModelData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch model comparisons
      const modelsParams = buildQueryParams({ 
        time_range: timeRange
      });

      try {
        const modelsResponse = await fetchAPI<LLMAnalyticsResponse>(`${METRICS.LLM_MODELS}${modelsParams}`);
        setModelData(modelsResponse);
      } catch (err) {
        console.error('Failed to fetch model comparison data:', err);
        setError('Failed to fetch model comparison data');
      }

      // Fetch agent-specific usage
      try {
        const agentParams = buildQueryParams({ 
          time_range: timeRange
        });
        const agentResponse = await fetchAPI<LLMAnalyticsResponse>(`${METRICS.LLM_AGENT_USAGE}${agentParams}`);
        setAgentData(agentResponse);
      } catch (err) {
        console.error('Failed to fetch agent usage data:', err);
        // Don't set error as this is secondary data
      }

      // Fetch agent-model relationships
      try {
        const relationshipParams = buildQueryParams({ 
          time_range: timeRange,
          include_distributions: 'true'
        });
        const relationshipsResponse = await fetchAPI<{ breakdown: AgentModelRelationship[] }>(`${METRICS.LLM_AGENT_MODEL_RELATIONSHIPS}${relationshipParams}`);
        setRelationshipData(relationshipsResponse.breakdown);
      } catch (err) {
        console.error('Failed to fetch agent-model relationship data:', err);
        // Don't set error as this is secondary data
      }

      // Fetch usage trends
      try {
        const trendsParams = buildQueryParams({ 
          time_range: timeRange,
          granularity: getGranularity(timeRange)
        });
        const trendsResponse = await fetchAPI<UsageTrendsResponse>(`${METRICS.LLM_USAGE_TRENDS}${trendsParams}`);
        setTrendData(trendsResponse);
      } catch (err) {
        console.error('Failed to fetch usage trends data:', err);
        // Don't set error as this is secondary data
      }
    } catch (error) {
      console.error('General error in fetchModelData:', error);
      setError('Failed to fetch model usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const getGranularity = (range: string): string => {
    switch (range) {
      case '24h': return 'hour';
      case '7d': return 'hour';
      case '30d': return 'day';
      case '90d': return 'day';
      default: return 'day';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getModelChartData = () => {
    if (!modelData?.breakdown) return [];
    
    // Sort data by request_count in descending order for better visualization
    const sortedData = [...modelData.breakdown].sort(
      (a, b) => b.metrics.request_count - a.metrics.request_count
    );
    
    // Limit to top 8 models for better visualization if there are many
    const topModels = sortedData.slice(0, 8);
    
    // Calculate total requests for percentage calculation
    const totalRequests = sortedData.reduce(
      (sum, item) => sum + item.metrics.request_count, 0
    );
    
    return topModels.map((item) => {
      const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
      const percentage = totalRequests > 0 
        ? ((item.metrics.request_count / totalRequests) * 100).toFixed(1) 
        : '0';
      
      return {
        name: `${displayName} (${percentage}%)`,
        value: item.metrics.request_count
      };
    });
  };

  const getModelResponseTimeData = () => {
    if (!modelData?.breakdown) return [];
    
    return modelData.breakdown.map((item) => {
      const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
      return {
        name: displayName,
        'Response Time (ms)': item.metrics.response_time_avg,
        'p95 Response Time (ms)': item.metrics.response_time_p95
      };
    });
  };

  const getModelComparisonData = () => {
    if (!modelData?.breakdown) return [];
    
    return modelData.breakdown.map((item) => {
      const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
      return {
        name: displayName,
        requests: item.metrics.request_count,
        tokens: item.metrics.token_count_total,
        responseTime: item.metrics.response_time_avg,
        'cost': item.metrics.estimated_cost_usd,
        'Cost ($)': item.metrics.estimated_cost_usd,
        successRate: item.metrics.success_rate
      };
    });
  };

  const getTrendChartData = () => {
    if (!trendData?.breakdown) return [];
    
    return trendData.breakdown.map((item) => {
      const date = new Date(item.key);
      return {
        date: date.toLocaleDateString(),
        timestamp: item.key,
        'Requests': item.metrics.request_count,
        'Cost ($)': item.metrics.estimated_cost_usd
      };
    });
  };

  const getTopAgentModels = () => {
    if (!relationshipData) return [];
    
    return relationshipData
      .sort((a, b) => b.metrics.request_count - a.metrics.request_count)
      .slice(0, 10)
      .map(item => {
        const [agentId, modelName] = item.key.split(':');
        const displayModelName = MODEL_DISPLAY_NAMES[modelName.toLowerCase()] || modelName;
        
        return {
          agent: agentId,
          model: displayModelName,
          requests: item.metrics.request_count,
          tokens: item.metrics.token_count_total,
          responseTime: item.metrics.response_time_avg,
          cost: item.metrics.estimated_cost_usd,
          costPerToken: item.metrics.token_count_total > 0 
            ? item.metrics.estimated_cost_usd / (item.metrics.token_count_total / 1000) 
            : 0
        };
      });
  };

  const getAgentModelDistribution = () => {
    if (!agentData?.breakdown) return [];
    
    // Sort data by request_count in descending order for better visualization
    const sortedData = [...agentData.breakdown].sort(
      (a, b) => b.metrics.request_count - a.metrics.request_count
    );
    
    // Limit to top 8 agents for better visualization if there are many
    const topAgents = sortedData.slice(0, 8);
    
    // Calculate total requests for percentage calculation
    const totalRequests = sortedData.reduce(
      (sum, item) => sum + item.metrics.request_count, 0
    );
    
    return topAgents.map(item => {
      const agentName = item.key;
      const percentage = totalRequests > 0 
        ? ((item.metrics.request_count / totalRequests) * 100).toFixed(1) 
        : '0';
      
      return {
        name: `${agentName} (${percentage}%)`,
        value: item.metrics.request_count
      };
    });
  };

  const getCostPerTokenData = () => {
    if (!modelData?.breakdown) return [];
    
    return modelData.breakdown.map((item) => {
      const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
      const costPer1KTokens = item.metrics.token_count_total > 0 
        ? (item.metrics.estimated_cost_usd / (item.metrics.token_count_total / 1000)) 
        : 0;
        
      return {
        name: displayName,
        'Cost per 1K tokens ($)': costPer1KTokens
      };
    });
  };
  
  if (isLoading) {
    return (
      <DashboardCard className={className}>
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Title>Model Usage Analytics</Title>
          <Button
            icon={ArrowPathIcon}
            variant="light"
            onClick={fetchModelData}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Flex>
        <LoadingState className="py-8" />
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard className={className}>
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Title>Model Usage Analytics</Title>
          <Button
            icon={ArrowPathIcon}
            variant="light"
            onClick={fetchModelData}
          >
            Refresh
          </Button>
        </Flex>
        <ErrorMessage message={error} />
      </DashboardCard>
    );
  }

  if (!modelData || (!modelData.breakdown || modelData.breakdown.length === 0)) {
    return (
      <DashboardCard className={className}>
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Title>Model Usage Analytics</Title>
          <Button
            icon={ArrowPathIcon}
            variant="light"
            onClick={fetchModelData}
          >
            Refresh
          </Button>
        </Flex>
        <EmptyState
          title="No Model Usage Data Available"
          description="There is no model usage data available for the selected time range."
          icon={<ChartPieIcon className="h-16 w-16 text-neutral-400" />}
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className={className}>
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <Title>Model Usage Analytics</Title>
        <Button
          icon={ArrowPathIcon}
          variant="light"
          onClick={fetchModelData}
        >
          Refresh
        </Button>
      </Flex>

      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mt-4">
          <Tab icon={ChartPieIcon}>Overview</Tab>
          <Tab icon={ClockIcon}>Performance</Tab>
          <Tab icon={CurrencyDollarIcon}>Cost Analysis</Tab>
          <Tab icon={UserGroupIcon}>Agent Usage</Tab>
          <Tab icon={ArrowTrendingUpIcon}>Trends</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <Title>Model Request Distribution</Title>
                <Text>Distribution of requests across different models</Text>
                <div className="mt-4 flex justify-center items-center">
                  <ModelDistributionChart
                    data={getModelChartData().map(item => ({
                      name: item.name,
                      count: item.value
                    }))}
                    valueFormatter={(value) => `${formatNumber(value)}`}
                    className="w-full"
                  />
                </div>
              </Card>
              
              <Card className="overflow-hidden">
                <Title>Model Comparison</Title>
                <Text>Key metrics across different models</Text>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="font-semibold">Model</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Requests</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Tokens</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Avg. Time</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Cost</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getModelComparisonData().map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.requests)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.tokens)}</TableCell>
                        <TableCell className="text-right">{formatDuration(item.responseTime)}</TableCell>
                        <TableCell className="text-right">{formatCost(item.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabPanel>
          
          {/* Performance Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Card>
                <Title>Response Time Comparison</Title>
                <Text>Average and P95 response times by model</Text>
                <BarChart
                  className="mt-4 h-80"
                  data={getModelResponseTimeData()}
                  index="name"
                  categories={['Response Time (ms)', 'p95 Response Time (ms)']}
                  colors={["blue", "indigo"]}
                  stack={false}
                  valueFormatter={(value) => `${value.toFixed(0)} ms`}
                  yAxisWidth={64}
                  showAnimation={true}
                  showLegend={true}
                  showGridLines={true}
                />
              </Card>
            </div>
          </TabPanel>
          
          {/* Cost Analysis Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <Title>Cost by Model</Title>
                <Text>Total cost for each model</Text>
                <BarChart
                  className="mt-4 h-60"
                  data={getModelComparisonData()}
                  index="name"
                  categories={['Cost ($)']}
                  colors={["emerald"]}
                  valueFormatter={(value) => `$${value.toFixed(2)}`}
                  yAxisWidth={64}
                  showAnimation={true}
                  showGridLines={true}
                />
              </Card>
              
              <Card>
                <Title>Cost Efficiency</Title>
                <Text>Cost per 1K tokens by model</Text>
                <BarChart
                  className="mt-4 h-60"
                  data={getCostPerTokenData()}
                  index="name"
                  categories={['Cost per 1K tokens ($)']}
                  colors={["green"]}
                  valueFormatter={(value) => `$${value.toFixed(4)}`}
                  yAxisWidth={80}
                  showAnimation={true}
                  showGridLines={true}
                />
              </Card>
            </div>
          </TabPanel>
          
          {/* Agent Usage Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <Title>Top Agent-Model Relationships</Title>
                <Text>Most frequently used models by agent</Text>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="font-semibold">Agent</TableHeaderCell>
                      <TableHeaderCell className="font-semibold">Model</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Requests</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Tokens</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Cost</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getTopAgentModels().map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.agent}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.requests)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.tokens)}</TableCell>
                        <TableCell className="text-right">{formatCost(item.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              
              <Card>
                <Title>Model Usage by Agent</Title>
                <Text>Distribution of requests by agent</Text>
                <div className="mt-4 flex justify-center items-center">
                  <ModelDistributionChart
                    data={getAgentModelDistribution().map(item => ({
                      name: item.name,
                      count: item.value
                    }))}
                    valueFormatter={(value) => `${formatNumber(value)}`}
                    className="w-full"
                  />
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Trends Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Card>
                <Title>Model Usage Trends</Title>
                <Text>Request volumes and costs over time</Text>
                <AreaChart
                  className="mt-4 h-80"
                  data={getTrendChartData()}
                  index="date"
                  categories={['Requests', 'Cost ($)']}
                  colors={["blue", "emerald"]}
                  valueFormatter={(value) => {
                    return typeof value === 'number' 
                      ? (value > 1000 ? formatNumber(value) : value.toString()) 
                      : String(value);
                  }}
                  yAxisWidth={64}
                  showLegend={true}
                  showAnimation={true}
                  showGradient={true}
                  showXAxis={true}
                  showYAxis={true}
                  autoMinValue={true}
                  curveType="natural"
                />
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </DashboardCard>
  );
} 