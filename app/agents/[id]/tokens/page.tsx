'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, DonutChart, Grid, AreaChart, Flex, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Metric } from '@tremor/react';
import { CurrencyDollarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import BreadcrumbNavigation from '../../../components/drilldown/BreadcrumbNavigation';
import LoadingState from '../../../components/LoadingState';
import ErrorMessage from '../../../components/ErrorMessage';
import { fetchAPI } from '../../../lib/api';
import { AGENTS } from '../../../lib/api-endpoints';

// Types
type TokenData = {
  timestamp: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

type ModelUsage = {
  model: string;
  vendor: string;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
};

interface AgentTokensPageProps {
  params: {
    id: string;
  };
}

export default function AgentTokensPage({ params }: AgentTokensPageProps) {
  const agentId = params.id;
  
  // State with guaranteed initial values
  const [agentName, setAgentName] = useState<string>(agentId);
  const [tokenData, setTokenData] = useState<TokenData[]>([
    {
      timestamp: new Date().toISOString(),
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0
    },
    {
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0
    }
  ]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([
    {
      model: "Loading...",
      vendor: "",
      request_count: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 1,
      estimated_cost: 0
    }
  ]);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  // Fetch data
  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Sequential fetching with better error handling
        try {
        // Fetch agent basic info for the name
          const agentData = await fetchAPI<any>(AGENTS.DETAIL(agentId));
          if (mounted) {
            setAgentName(agentData?.name || agentId);
          }
        } catch (err) {
          console.error("Error fetching agent details:", err);
          // Continue with other requests - non-critical error
        }
        
        // Create a variable to collect token usage data
        let tokenUsageData: any = null;
        
        try {
          // Fetch main token usage data
          const params = { time_range: timeRange };
          const queryString = new URLSearchParams(params).toString();
          const endpoint = `${AGENTS.TOKEN_USAGE(agentId)}${queryString ? `?${queryString}` : ''}`;
          tokenUsageData = await fetchAPI<any>(endpoint);
          console.log('Token usage data:', tokenUsageData);
        
          // Process model usage data
          let modelUsageData: ModelUsage[] = [];
          
          if (tokenUsageData) {
            // Check if the by_model property exists
            if (tokenUsageData.by_model && typeof tokenUsageData.by_model === 'object') {
              modelUsageData = Object.entries(tokenUsageData.by_model)
                .map(([model, usage]: [string, any]) => ({
                  model: model,
                  vendor: usage.vendor || 'unknown',
                  request_count: usage.request_count || 0,
                  input_tokens: usage.prompt_tokens || 0,
                  output_tokens: usage.completion_tokens || 0,
                  total_tokens: usage.total_tokens || 0,
                  estimated_cost: usage.cost || 0
                }))
                .filter(model => model.total_tokens > 0);
            }
            // Check if this is an array of models directly
            else if (Array.isArray(tokenUsageData)) {
              modelUsageData = tokenUsageData
                .map((item: any) => ({
                  model: item.model || 'unknown',
                  vendor: item.vendor || 'unknown',
                  request_count: item.request_count || 0,
                  input_tokens: item.prompt_tokens || item.input_tokens || 0,
                  output_tokens: item.completion_tokens || item.output_tokens || 0,
                  total_tokens: item.total_tokens || 0,
                  estimated_cost: item.cost || item.estimated_cost || 0
                }))
                .filter(model => model.total_tokens > 0);
            }
            // Check if there's a models array
            else if (tokenUsageData.models && Array.isArray(tokenUsageData.models)) {
              modelUsageData = tokenUsageData.models
                .map((item: any) => ({
                  model: item.model || 'unknown',
                  vendor: item.vendor || 'unknown',
                  request_count: item.request_count || 0,
                  input_tokens: item.prompt_tokens || item.input_tokens || 0,
                  output_tokens: item.completion_tokens || item.output_tokens || 0,
                  total_tokens: item.total_tokens || 0,
                  estimated_cost: item.cost || item.estimated_cost || 0
                }))
                .filter(model => model.total_tokens > 0);
            }
        }
        
          // Ensure we have at least one model for the chart
          if (modelUsageData.length === 0) {
            modelUsageData = [
          {
                model: "No Models Used",
                vendor: "",
                request_count: 0,
                input_tokens: 0,
                output_tokens: 0,
                total_tokens: 1,
                estimated_cost: 0
              }
            ];
          }
          
          if (mounted) {
            setModelUsage(modelUsageData);
          }
        } catch (err) {
          console.error("Error fetching token usage data:", err);
          // The model usage data will stay with the default values
        }
        
        try {
          // For the time series data, fetch with time grouping if available
          const timeSeriesParams = { time_range: timeRange, group_by: 'time', interval: '1d' };
          const timeSeriesQueryString = new URLSearchParams(timeSeriesParams).toString();
          const timeSeriesEndpoint = `${AGENTS.TOKEN_USAGE(agentId)}${timeSeriesQueryString ? `?${timeSeriesQueryString}` : ''}`;
          const timeSeriesData = await fetchAPI<any>(timeSeriesEndpoint);
          console.log('Time series data:', timeSeriesData);
          
          // Process time series data
          let tokenTrend: TokenData[] = [];
          
          if (timeSeriesData) {
            // First check if the API returned items directly
            if (Array.isArray(timeSeriesData)) {
              tokenTrend = timeSeriesData.map((item: any) => ({
                timestamp: item.timestamp,
                input_tokens: item.input_tokens || item.prompt_tokens || 0,
                output_tokens: item.output_tokens || item.completion_tokens || 0,
                total_tokens: item.total_tokens || 0
              }));
            } 
            // Then check if there's an items array
            else if (timeSeriesData.items && Array.isArray(timeSeriesData.items)) {
              tokenTrend = timeSeriesData.items.map((item: any) => ({
                timestamp: item.timestamp,
                input_tokens: item.input_tokens || item.prompt_tokens || 0,
                output_tokens: item.output_tokens || item.completion_tokens || 0,
                total_tokens: item.total_tokens || 0
              }));
            }
            // If we have a single object with timestamps, convert that
            else if (typeof timeSeriesData === 'object') {
              // Check for timestamp-based keys and convert them to items
              const timestampKeys = Object.keys(timeSeriesData).filter(key => 
                key.match(/^\d{4}-\d{2}-\d{2}/) || // ISO date format
                key.match(/^\d+$/) // Unix timestamp
              );
              
              if (timestampKeys.length > 0) {
                tokenTrend = timestampKeys.map(timestamp => {
                  const value = timeSeriesData[timestamp];
                  return {
                    timestamp,
                    input_tokens: value.input_tokens || value.prompt_tokens || 0,
                    output_tokens: value.output_tokens || value.completion_tokens || 0,
                    total_tokens: value.total_tokens || 0
                  };
                });
              }
            }
          }
          
          // If we have no data, create default empty data points
          if (tokenTrend.length === 0) {
            // Create a week of empty data points
            const days = 7;
            tokenTrend = Array.from({ length: days }).map((_, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (days - index - 1));
              return {
                timestamp: date.toISOString(),
                input_tokens: 0,
                output_tokens: 0,
                total_tokens: 0
              };
            });
          }
          
          if (mounted) {
            setTokenData(tokenTrend);
          }
        } catch (err) {
          console.error("Error fetching time series data:", err);
          // The token data will stay with the default values
        }
        
        if (mounted) {
          setDataLoaded(true);
        }
        
      } catch (err: any) {
        console.error('Error in main fetchData function:', err);
        if (mounted) {
        setError(err.message || 'An error occurred while fetching data');
        }
      } finally {
        if (mounted) {
        setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [agentId, timeRange]);

  // Calculate totals - these are safe since modelUsage always has at least one entry
  const totalInputTokens = modelUsage.reduce((sum, model) => sum + model.input_tokens, 0);
  const totalOutputTokens = modelUsage.reduce((sum, model) => sum + model.output_tokens, 0);
  const totalCost = modelUsage.reduce((sum, model) => sum + model.estimated_cost, 0);
  
  // Format chart data - these are also safe since tokenData and modelUsage have defaults
  const tokenTrendData = tokenData.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    "Input Tokens": item.input_tokens,
    "Output Tokens": item.output_tokens
  }));
  
  const modelDonutData = modelUsage.map(model => ({
    name: model.model,
    value: model.total_tokens
  }));

  if (loading && !dataLoaded) {
    return <LoadingState message="Loading token usage data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Format numbers for display
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <BreadcrumbNavigation
        items={[
          { label: 'Agents', href: '/agents' },
          { label: agentName, href: `/agents/${agentId}` },
          { label: 'Token Usage', href: `/agents/${agentId}/tokens` },
        ]}
        includeHome={true}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title className="text-2xl font-bold">Token Usage</Title>
          <Text>Token consumption analysis for this agent</Text>
        </div>
        <Link href={`/agents/${agentId}`}>
          <div className="flex items-center text-blue-500 hover:underline cursor-pointer">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back to Agent Overview</span>
          </div>
        </Link>
      </div>
      
      <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" className="space-x-4">
            <div className="truncate">
              <Text>Total Tokens</Text>
              <Metric>{formatNumber(totalInputTokens + totalOutputTokens)}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <Flex justifyContent="start" className="space-x-4">
            <div className="truncate">
              <Text>Input / Output Ratio</Text>
              <Metric>{`${Math.round((totalInputTokens / (totalInputTokens + totalOutputTokens)) * 100)}% / ${Math.round((totalOutputTokens / (totalInputTokens + totalOutputTokens)) * 100)}%`}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="green">
          <Flex justifyContent="start" className="space-x-4">
            <div className="truncate">
              <Text>Estimated Cost</Text>
              <Metric>{formatCurrency(totalCost)}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>
      
      <Grid numItemsMd={1} numItemsLg={2} className="gap-6 mb-6">
        <Card>
          <div className="mb-4">
            <Title>Token Usage Trend</Title>
            <Text>Input and output tokens over time</Text>
          </div>
          
          <div className="h-80">
            <AreaChart
              data={tokenTrendData}
              index="date"
              categories={["Input Tokens", "Output Tokens"]}
              colors={["blue", "amber"]}
              valueFormatter={(value) => `${formatNumber(value)} tokens`}
              yAxisWidth={60}
              showLegend={true}
            />
          </div>
        </Card>
        
        <Card>
          <div className="mb-4">
            <Title>Token Usage By Model</Title>
            <Text>Distribution across different models</Text>
          </div>
          
          <div className="h-80">
            <DonutChart
              data={modelDonutData}
              category="value"
              index="name"
              valueFormatter={(value) => `${formatNumber(value)} tokens`}
              colors={["blue", "cyan", "indigo"]}
              className="mt-6"
            />
          </div>
        </Card>
      </Grid>
      
      <Card>
        <div className="mb-4">
          <Title>Model Breakdown</Title>
          <Text>Detailed token usage and cost by model</Text>
        </div>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Model</TableHeaderCell>
              <TableHeaderCell>Vendor</TableHeaderCell>
              <TableHeaderCell>Requests</TableHeaderCell>
              <TableHeaderCell>Input Tokens</TableHeaderCell>
              <TableHeaderCell>Output Tokens</TableHeaderCell>
              <TableHeaderCell>Total Tokens</TableHeaderCell>
              <TableHeaderCell>Estimated Cost</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modelUsage.map((model, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{model.model}</TableCell>
                <TableCell>{model.vendor}</TableCell>
                <TableCell>{formatNumber(model.request_count)}</TableCell>
                <TableCell>{formatNumber(model.input_tokens)}</TableCell>
                <TableCell>{formatNumber(model.output_tokens)}</TableCell>
                <TableCell>{formatNumber(model.total_tokens)}</TableCell>
                <TableCell>{formatCurrency(model.estimated_cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 