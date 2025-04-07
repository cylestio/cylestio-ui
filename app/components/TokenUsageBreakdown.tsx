'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Card,
  Title,
  Text,
  Flex,
  AreaChart,
  BarChart,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Metric,
  Button,
  Color
} from '@tremor/react'
import { ChartPieIcon, DocumentTextIcon, CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import DashboardCard from './DashboardCard'
import { fetchAPI, buildQueryParams } from '../lib/api'
import { METRICS } from '../lib/api-endpoints'
import LoadingState from './LoadingState'
import { SimpleDonutChart } from './SimpleDonutChart'
import { colors } from './DesignSystem'
import { TokenUsageByModelChart } from './TokenUsageByModelChart'

// Define types
type TokenBreakdownData = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  models: {
    name: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  }[];
  agents?: {
    name: string;
    model_usage: {
      model_name: string;
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    }[];
  }[];
};

type TimeSeries = {
  timestamp: string;
  value: number;
  dimensions?: {
    type?: string;
    model?: string;
  };
};

type MetricChartData = {
  metric: string;
  from_time: string;
  to_time: string;
  interval: string;
  data: TimeSeries[];
};

type TokenUsageBreakdownProps = {
  className?: string;
  timeRange?: string;
};

// Define a mapping of model names to costs per 1K tokens
const MODEL_COSTS = {
  // Input token pricing (per 1K tokens)
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  // Default fallback for unknown models
  'default': { input: 0.01, output: 0.03 }
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

export default function TokenUsageBreakdown({ className = '', timeRange = '30d' }: TokenUsageBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tokenData, setTokenData] = useState<TokenBreakdownData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for agent data
  const [agentModelData, setAgentModelData] = useState<any[]>([]);
  const [hasAgentData, setHasAgentData] = useState(false);

  // Trigger immediate data fetch when component mounts or timeRange changes
  useEffect(() => {
    console.log('TokenUsageBreakdown: Fetching data for timeRange:', timeRange);
    fetchTokenData();
  }, [timeRange]);

  const fetchTokenData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch aggregated token usage data from API
      const params = buildQueryParams({ time_range: timeRange });
      
      try {
        console.log(`Fetching token usage data from: ${METRICS.TOKEN_USAGE}${params}`);
        const aggregatedData = await fetchAPI<TokenBreakdownData>(`${METRICS.TOKEN_USAGE}${params}`);
        console.log('Token usage data received:', aggregatedData);
        
        if (aggregatedData && (aggregatedData.total_tokens !== undefined || 
            (aggregatedData.models && aggregatedData.models.length > 0))) {
          setTokenData(aggregatedData);
        } else {
          setError('No token usage data available');
        }
      } catch (error) {
        console.error('Error fetching token usage data:', error);
        setError('Failed to fetch token data');
        return;
      }

      // Fetch time series data for tokens
      const timeSeriesParams = buildQueryParams({ 
        time_range: timeRange,
        interval: getInterval(timeRange)
      });
      
      try {
        console.log(`Fetching time series data from: ${METRICS.LLM_TOKEN_USAGE}${timeSeriesParams}`);
        const timeSeriesResponse = await fetchAPI<MetricChartData>(`${METRICS.LLM_TOKEN_USAGE}${timeSeriesParams}`);
        console.log('Time series data received:', timeSeriesResponse);
        
        if (timeSeriesResponse && timeSeriesResponse.data) {
          setTimeSeriesData(timeSeriesResponse.data);
        }
      } catch (timeSeriesError) {
        console.error('Error fetching time series data:', timeSeriesError);
        // We'll continue even if time series data fails
      }
    } catch (error) {
      console.error('General error in fetchTokenData:', error);
      setError('Failed to fetch token usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const getInterval = (range: string): string => {
    switch (range) {
      case '24h': return '1h';
      case '7d': return '6h';
      case '30d': return '1d';
      case '90d': return '1w';
      default: return '1d';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const calculateCost = (tokens: number, type: 'input' | 'output', modelName: string = 'default'): number => {
    const model = MODEL_COSTS[modelName as keyof typeof MODEL_COSTS] || MODEL_COSTS.default;
    return (tokens / 1000) * model[type];
  };

  const calculateTotalCost = (): number => {
    if (!tokenData) return 0;
    
    let totalCost = 0;
    
    // Calculate cost for each model
    tokenData.models.forEach(model => {
      const modelName = model.name.toLowerCase();
      const costKey = Object.keys(MODEL_COSTS).find(key => modelName.includes(key.toLowerCase())) || 'default';
      
      const inputCost = calculateCost(model.input_tokens, 'input', costKey);
      const outputCost = calculateCost(model.output_tokens, 'output', costKey);
      
      totalCost += inputCost + outputCost;
    });
    
    return totalCost;
  };

  // Prepare data for charts
  const prepareInputOutputData = () => {
    if (!tokenData) return [];
    
    return [
      { name: 'Input Tokens', count: tokenData.input_tokens },
      { name: 'Output Tokens', count: tokenData.output_tokens }
    ];
  };

  const prepareModelData = () => {
    if (!tokenData || !tokenData.models) return [];
    
    return tokenData.models
      .filter(model => model.total_tokens > 0) // Filter out models with zero usage
      .map((model, idx) => {
        // Use friendly display name if available
        let displayName = MODEL_DISPLAY_NAMES[model.name.toLowerCase()] || model.name;
        
        // Handle unknown models better
        if (displayName.toLowerCase() === 'unknown') {
          displayName = 'Other Models';
        }
        
        return {
          name: displayName,
          'Input Tokens': model.input_tokens,
          'Output Tokens': model.output_tokens
        };
      });
  };

  // Update the chart data preparation function to return data for stacked chart
  const prepareStackedTimeSeriesData = () => {
    if (!timeSeriesData || timeSeriesData.length === 0) return { data: [], maxValue: 0 };
    
    // Process time series data to extract dates and prepare data by type
    const processedData = new Map();
    const dateFormatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    };
    
    timeSeriesData.forEach(item => {
      const date = new Date(item.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', dateFormatOptions);
      const itemType = item.dimensions?.type || 'total';
      const value = item.value || 0;
      
      // Initialize entry if it doesn't exist
      if (!processedData.has(formattedDate)) {
        processedData.set(formattedDate, { 
          date: formattedDate, 
          timestamp: date.getTime(),
          "Input Tokens": 0, 
          "Output Tokens": 0
        });
      }
      
      // Update values
      const entry = processedData.get(formattedDate);
      if (itemType === 'input') {
        entry["Input Tokens"] += value;
      } else if (itemType === 'output') {
        entry["Output Tokens"] += value;
      }
    });
    
    // Find the max stacked value for y-axis scale
    let maxStackedValue = 0;
    processedData.forEach(entry => {
      const stackedTotal = entry["Input Tokens"] + entry["Output Tokens"];
      maxStackedValue = Math.max(maxStackedValue, stackedTotal);
    });
    
    // Convert to array and sort chronologically
    const sortedData = Array.from(processedData.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ timestamp, ...rest }) => rest); // Remove timestamp from final data
      
    return { 
      data: sortedData,
      maxValue: maxStackedValue
    };
  };

  // Add a function to prepare agent model data
  const prepareAgentModelData = () => {
    if (!tokenData || !tokenData.agents || tokenData.agents.length === 0) {
      return [];
    }
    
    setHasAgentData(true);
    
    // Format the data for display
    const formattedData = tokenData.agents.map(agent => {
      // Get model usage for this agent
      const modelUsage = agent.model_usage.reduce((acc, usage) => {
        // Use friendly model names
        const modelName = MODEL_DISPLAY_NAMES[usage.model_name.toLowerCase()] || usage.model_name;
        acc[modelName] = usage.total_tokens;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        name: agent.name,
        ...modelUsage
      };
    });
    
    return formattedData;
  };

  if (isLoading) {
    return (
      <DashboardCard 
        title="Token Usage Breakdown" 
        icon={<ChartPieIcon className="h-5 w-5" />}
        className={className}
        isLoading={true}
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Loading token usage data...</p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard 
        title="Token Usage Breakdown" 
        icon={<ChartPieIcon className="h-5 w-5" />}
        className={className}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <DocumentTextIcon className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Token Data Unavailable</h3>
          <p className="text-gray-500 text-sm max-w-md">
            We couldn't retrieve token usage data. This might be temporary or because your system doesn't have any token usage recorded yet.
          </p>
          <Button 
            variant="secondary" 
            color="gray" 
            icon={ArrowPathIcon} 
            onClick={fetchTokenData}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </DashboardCard>
    );
  }

  if (!tokenData) {
    return (
      <DashboardCard 
        title="Token Usage Breakdown" 
        icon={<ChartPieIcon className="h-5 w-5" />}
        className={className}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No Token Data Yet</h3>
          <p className="text-gray-500 text-sm max-w-md">
            There is no token usage data available for the selected time period. Start using AI agents in your application to see token analytics.
          </p>
          <Button 
            variant="secondary" 
            color="gray" 
            icon={ArrowPathIcon} 
            onClick={fetchTokenData}
            className="mt-2"
          >
            Refresh Data
          </Button>
        </div>
      </DashboardCard>
    );
  }

  const totalCost = calculateTotalCost();
  const inputOutputData = prepareInputOutputData();
  const modelData = prepareModelData();
  const agentData = prepareAgentModelData();
  const timeSeriesStackedData = prepareStackedTimeSeriesData();

  return (
    <DashboardCard
      title="Model Usage Analytics"
      icon={<ChartPieIcon className="h-5 w-5" />}
      className={className}
      collapsible={isExpanded}
      defaultCollapsed={false}
    >
      <div className="space-y-6">
        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card decoration="top" decorationColor="blue" className="shadow-sm">
            <Flex justifyContent="start" className="space-x-4">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div>
                <Text>Total Tokens</Text>
                <Metric>{formatNumber(tokenData.total_tokens)}</Metric>
                <Text className="text-xs text-gray-500">Across all models</Text>
              </div>
            </Flex>
          </Card>
          
          <Card decoration="top" decorationColor="indigo" className="shadow-sm">
            <Flex justifyContent="start" className="space-x-4">
              <CurrencyDollarIcon className="h-8 w-8 text-indigo-500" />
              <div>
                <Text>Estimated Cost</Text>
                <Metric>${totalCost.toFixed(2)}</Metric>
                <Text className="text-xs text-gray-500">Based on standard pricing</Text>
              </div>
            </Flex>
          </Card>
          
          <Card decoration="top" decorationColor="emerald" className="shadow-sm">
            <Flex justifyContent="start" className="space-x-4">
              <ArrowTrendingUpIcon className="h-8 w-8 text-emerald-500" />
              <div>
                <Text>Models Used</Text>
                <Metric>{tokenData.models.filter(model => model.total_tokens > 0).length}</Metric>
                <Text className="text-xs text-gray-500">Active in this period</Text>
              </div>
            </Flex>
          </Card>
        </div>
        
        {/* Input vs Output Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4 shadow-sm">
            <Title>Input vs Output Tokens</Title>
            <Text className="text-sm text-gray-500">Distribution of tokens by type</Text>
            <div className="h-72 mt-4 relative flex justify-center items-center">
              <SimpleDonutChart 
                data={inputOutputData}
                colors={["rgba(59, 130, 246, 0.4)", "rgba(139, 92, 246, 0.4)"]}
                valueFormatter={formatNumber}
                showLegend
                className="h-full w-full"
              />
            </div>
          </Card>
          
          <Card className="p-4 shadow-sm">
            <Title>Token Usage by Model</Title>
            <Text className="text-sm text-gray-500">Breakdown across different models</Text>
            <div className="h-72 mt-4">
              <TokenUsageByModelChart 
                data={modelData}
                formatValue={formatNumber}
                colors={["rgba(59, 130, 246, 0.4)", "rgba(139, 92, 246, 0.4)"]}
              />
            </div>
          </Card>
        </div>
        
        {/* Token Usage Trend - Stacked Area Chart */}
        <Card className="p-4 shadow-sm">
          <Title>Token Usage Trend</Title>
          <Text className="text-sm text-gray-500">Token usage over time in the selected period</Text>
          
          <div className="h-72 mt-4">
            {timeSeriesData.length > 0 ? (
              <AreaChart
                data={timeSeriesStackedData.data}
                index="date"
                categories={["Input Tokens", "Output Tokens"]}
                colors={["blue", "purple"]}
                valueFormatter={(value) => `${formatNumber(value)} tokens`}
                showLegend={true}
                showGridLines={false}
                curveType="natural"
                yAxisWidth={65}
                stack={true}
                connectNulls={true}
                showAnimation={true}
                showXAxis={true}
                showYAxis={true}
                showTooltip={true}
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No token usage data available
              </div>
            )}
          </div>
        </Card>
        
        {/* Model Usage by Agent */}
        {hasAgentData && (
          <Card className="p-4 shadow-sm">
            <Title>Model Usage by Agent</Title>
            <Text className="text-sm text-gray-500">Distribution of model usage across different agents</Text>
            <div className="h-72 mt-4">
              {agentData.length > 0 ? (
                <BarChart
                  data={agentData}
                  index="name"
                  categories={Array.from(new Set(
                    tokenData.agents?.flatMap(agent => 
                      agent.model_usage.map(usage => 
                        MODEL_DISPLAY_NAMES[usage.model_name.toLowerCase()] || usage.model_name
                      )
                    ) || []
                  ))}
                  colors={["#3730A3", "#8B5CF6", "#4F46E5", "#7C3AED"]}
                  valueFormatter={formatNumber}
                  stack={true}
                  showLegend={true}
                  yAxisWidth={65}
                  showAnimation={true}
                  showGridLines={true}
                  showXAxis={true}
                  showYAxis={true}
                  showTooltip={true}
                  className="h-full w-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No agent model usage data available
                </div>
              )}
            </div>
          </Card>
        )}
        
        {/* Cost Breakdown Section */}
        <Card className="p-4 shadow-sm">
          <Title>Cost Breakdown</Title>
          <Text className="text-sm text-gray-500 mb-4">Detailed cost analysis by model</Text>
          <div className="mt-4 space-y-4">
            <div className="overflow-x-auto max-h-80">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokenData.models.map((model, index) => {
                    const modelName = model.name.toLowerCase();
                    const costKey = Object.keys(MODEL_COSTS).find(key => modelName.includes(key.toLowerCase())) || 'default';
                    const costInfo = MODEL_COSTS[costKey as keyof typeof MODEL_COSTS];
                    const displayName = MODEL_DISPLAY_NAMES[modelName] || model.name;
                    
                    const inputCost = (model.input_tokens / 1000) * costInfo.input;
                    const outputCost = (model.output_tokens / 1000) * costInfo.output;
                    const totalModelCost = inputCost + outputCost;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{displayName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(model.input_tokens)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${inputCost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(model.output_tokens)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${outputCost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${totalModelCost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 sticky bottom-0 z-10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatNumber(tokenData.input_tokens)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${tokenData.models.reduce((sum, model) => {
                        const modelName = model.name.toLowerCase();
                        const costKey = Object.keys(MODEL_COSTS).find(key => modelName.includes(key.toLowerCase())) || 'default';
                        const costInfo = MODEL_COSTS[costKey as keyof typeof MODEL_COSTS];
                        return sum + (model.input_tokens / 1000) * costInfo.input;
                      }, 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatNumber(tokenData.output_tokens)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${tokenData.models.reduce((sum, model) => {
                        const modelName = model.name.toLowerCase();
                        const costKey = Object.keys(MODEL_COSTS).find(key => modelName.includes(key.toLowerCase())) || 'default';
                        const costInfo = MODEL_COSTS[costKey as keyof typeof MODEL_COSTS];
                        return sum + (model.output_tokens / 1000) * costInfo.output;
                      }, 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${totalCost.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">About Cost Calculations</p>
              <p>Costs are calculated based on standard OpenAI and Anthropic pricing. Actual costs may vary based on your specific contract pricing.</p>
            </div>
          </div>
        </Card>
        
        {/* Add extra padding at the bottom */}
        <div className="h-8"></div>
      </div>
    </DashboardCard>
  );
} 