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

type TokenUsageCostData = {
  token_usage_cost: {
    breakdown: {
      model: string;
      vendor: string;
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      input_price_per_1k: number;
      output_price_per_1k: number;
      input_cost: number;
      output_cost: number;
      total_cost: number;
    }[];
    totals: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      input_cost: number;
      output_cost: number;
      total_cost: number;
    };
  };
  pricing_note: string;
  update_date: string;
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
  const [costData, setCostData] = useState<TokenUsageCostData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for agent data
  const [agentModelData, setAgentModelData] = useState<any[]>([]);
  const [hasAgentData, setHasAgentData] = useState(false);

  // Add a ref to handle proper scrolling
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Fetch pricing data from the new API endpoint
      try {
        console.log(`Fetching token pricing data from: ${METRICS.TOKEN_USAGE_COST}${params}`);
        const pricingData = await fetchAPI<TokenUsageCostData>(`${METRICS.TOKEN_USAGE_COST}${params}`);
        console.log('Token pricing data received:', pricingData);
        
        if (pricingData && pricingData.token_usage_cost) {
          setCostData(pricingData);
        }
      } catch (pricingError) {
        console.error('Error fetching token pricing data:', pricingError);
        // Continue even if pricing data fails
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

  // Get the total cost from the cost data
  const getTotalCost = (): number => {
    if (costData?.token_usage_cost?.totals) {
      return costData.token_usage_cost.totals.total_cost;
    }
    return 0;
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
      <div ref={containerRef} className="w-full mb-8">
        <DashboardCard 
          title="Token Usage Insights"
          icon={<ChartPieIcon className="h-5 w-5" />}
          className={`${className}`}
          isLoading={true}
        >
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">Loading token usage data...</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={containerRef} className="w-full mb-8">
        <DashboardCard 
          title="Token Usage Insights"
          icon={<ChartPieIcon className="h-5 w-5" />}
          className={`${className}`}
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
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div ref={containerRef} className="w-full mb-8">
        <DashboardCard 
          title="Token Usage Insights"
          icon={<ChartPieIcon className="h-5 w-5" />}
          className={`${className}`}
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
      </div>
    );
  }

  const totalCost = getTotalCost();
  const totalTokens = costData?.token_usage_cost?.totals?.total_tokens || tokenData?.total_tokens || 0;
  const modelsUsed = costData?.token_usage_cost?.breakdown?.filter(model => model.total_tokens > 0).length || 
                   tokenData?.models.filter(m => m.total_tokens > 0).length || 0;
  const inputOutputData = prepareInputOutputData();
  const modelData = prepareModelData();
  const agentData = prepareAgentModelData();
  const timeSeriesStackedData = prepareStackedTimeSeriesData();

  return (
    <div ref={containerRef} className="w-full">
      <DashboardCard
        title="Token Usage Insights"
        icon={<ChartPieIcon className="h-5 w-5" />}
        className={`${className}`}
        contentClassName="pb-4 overflow-visible"
        collapsible={isExpanded}
        defaultCollapsed={false}
      >
        {/* Summary Grid - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card decoration="top" decorationColor="blue" className="shadow-sm" style={{ borderTopColor: "rgba(129, 140, 248, 0.5)" }}>
            <Flex justifyContent="start" className="space-x-4">
              <DocumentTextIcon className="h-8 w-8" style={{ color: "rgba(129, 140, 248, 0.8)" }} />
              <div>
                <Text>Total Tokens</Text>
                <Metric>{formatNumber(totalTokens)}</Metric>
                <Text className="text-xs text-gray-500">Across all models</Text>
              </div>
            </Flex>
          </Card>
          
          <Card decoration="top" decorationColor="violet" className="shadow-sm" style={{ borderTopColor: "rgba(251, 113, 133, 0.5)" }}>
            <Flex justifyContent="start" className="space-x-4">
              <CurrencyDollarIcon className="h-8 w-8" style={{ color: "rgba(251, 113, 133, 0.8)" }} />
              <div>
                <Text>Estimated Cost</Text>
                <Metric>${totalCost.toFixed(2)}</Metric>
                <Text className="text-xs text-gray-500">Based on standard pricing</Text>
              </div>
            </Flex>
          </Card>
          
          <Card decoration="top" decorationColor="sky" className="shadow-sm" style={{ borderTopColor: "rgba(45, 212, 191, 0.5)" }}>
            <Flex justifyContent="start" className="space-x-4">
              <ArrowTrendingUpIcon className="h-8 w-8" style={{ color: "rgba(45, 212, 191, 0.8)" }} />
              <div>
                <Text>Models Used</Text>
                <Metric>{modelsUsed}</Metric>
                <Text className="text-xs text-gray-500">Active in this period</Text>
              </div>
            </Flex>
          </Card>
        </div>
        
        {/* Tab interface for different views */}
        <TabGroup>
          <TabList className="mb-6">
            <Tab>Charts</Tab>
            <Tab>Cost Breakdown</Tab>
            {hasAgentData && <Tab>Agent Usage</Tab>}
          </TabList>
          
          <TabPanels>
            {/* Charts Panel */}
            <TabPanel>
              <div className="space-y-6">
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
              </div>
            </TabPanel>
            
            {/* Cost Breakdown Panel */}
            <TabPanel>
              {/* Cost Breakdown Section with full height */}
              <div>
                <Title>Cost Breakdown</Title>
                <Text className="text-sm text-gray-500 mb-4">Detailed cost analysis by model</Text>
                
                <div className="overflow-auto max-h-[400px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Tokens</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Price/1K</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Tokens</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Price/1K</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {costData?.token_usage_cost?.breakdown
                        .filter(item => item.total_tokens > 0) // Filter out models with zero tokens
                        .map((item, index) => {
                          const displayName = MODEL_DISPLAY_NAMES[item.model.toLowerCase()] || item.model;
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{displayName}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{formatNumber(item.input_tokens)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">${item.input_price_per_1k.toFixed(5)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">${item.input_cost.toFixed(4)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{formatNumber(item.output_tokens)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">${item.output_price_per_1k.toFixed(5)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">${item.output_cost.toFixed(4)}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 font-medium">${item.total_cost.toFixed(4)}</td>
                            </tr>
                          );
                        })}
                      <tr className="bg-gray-50 sticky bottom-0 z-10">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatNumber(costData?.token_usage_cost?.totals?.input_tokens || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${(costData?.token_usage_cost?.totals?.input_cost || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatNumber(costData?.token_usage_cost?.totals?.output_tokens || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${(costData?.token_usage_cost?.totals?.output_cost || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          ${(costData?.token_usage_cost?.totals?.total_cost || 0).toFixed(4)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg mt-4">
                  <p className="font-medium mb-2">About Cost Calculations</p>
                  <p>{costData?.pricing_note || "Costs are calculated based on standard OpenAI and Anthropic pricing. Actual costs may vary based on your specific contract pricing."}</p>
                  {costData?.update_date && (
                    <p className="mt-2">
                      <span className="font-medium">Pricing last updated:</span> {costData.update_date}
                    </p>
                  )}
                </div>
              </div>
            </TabPanel>
            
            {/* Agent Usage Panel - Only shown if agents data exists */}
            {hasAgentData && (
              <TabPanel>
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
              </TabPanel>
            )}
          </TabPanels>
        </TabGroup>
      </DashboardCard>
    </div>
  );
} 