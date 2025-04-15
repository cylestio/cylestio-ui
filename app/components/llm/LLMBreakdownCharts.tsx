'use client'

import { useState } from 'react'
import { 
  Card, 
  Title, 
  Text, 
  TabPanel, 
  TabPanels,
  BarChart,
  DonutChart,
  AreaChart,
  Grid,
  Legend,
  Flex
} from '@tremor/react'
import { 
  ChartPieIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline'

// Define types
export type ModelUsageData = {
  name: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  success_rate: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  estimated_cost: number;
  cost_per_1k_tokens: number;
}

export type TimeSeriesData = {
  date: string;
  total_requests: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
}

export type AgentUsageData = {
  name: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  models: {
    name: string;
    requests: number;
    tokens: number;
  }[];
}

export interface LLMBreakdownChartsProps {
  modelData: ModelUsageData[];
  timeSeriesData: TimeSeriesData[];
  agentData: AgentUsageData[];
  loading?: boolean;
  className?: string;
  activeView?: string;
}

export default function LLMBreakdownCharts({
  modelData,
  timeSeriesData,
  agentData,
  loading = false,
  className = '',
  activeView = 'general'
}: LLMBreakdownChartsProps) {
  const [activeTab, setActiveTab] = useState(0);

  // Format values for display
  const formatNumber = (value: number) => value.toLocaleString();
  const formatCost = (value: number) => `$${value.toFixed(2)}`;
  const formatTime = (value: number) => `${value.toFixed(0)} ms`;
  
  // Prepare chart data with fallbacks for empty arrays
  const modelDistributionData = modelData?.length ? modelData.map(model => ({
    name: model.name,
    value: model.requests
  })) : [];
  
  const tokenUsageByModelData = modelData?.length ? modelData.map(model => ({
    name: model.name,
    'Input Tokens': model.input_tokens || 0,
    'Output Tokens': model.output_tokens || 0
  })) : [];
  
  const costData = modelData?.length ? modelData.map(model => ({
    name: model.name,
    'Cost': model.estimated_cost || 0
  })) : [];
  
  const tokenTimeSeriesData = timeSeriesData?.length ? timeSeriesData.map(data => ({
    date: data.date,
    'Input Tokens': data.input_tokens || 0,
    'Output Tokens': data.output_tokens || 0
  })) : [];
  
  const tokenRatioData = modelData?.length ? modelData.map(model => ({
    name: model.name,
    'Input': model.input_tokens || 0,
    'Output': model.output_tokens || 0
  })) : [];
  
  const successRateData = modelData?.length ? modelData.map(model => ({
    name: model.name,
    'Success Rate': (model.success_rate || 0) * 100
  })) : [];

  // Check if we have data to display
  const hasModelData = modelData?.length > 0;
  const hasTimeSeriesData = timeSeriesData?.length > 0;
  const hasAgentData = agentData?.length > 0;

  // Define view options
  const viewOptions = [
    { id: 0, name: "Usage", icon: ChartPieIcon },
    { id: 1, name: "Performance", icon: ClockIcon },
    { id: 2, name: "Cost", icon: CurrencyDollarIcon },
    { id: 3, name: "Trends", icon: ChartBarIcon },
    { id: 4, name: "By Agent", icon: UserGroupIcon }
  ];
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Model Usage Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <Title>Model Usage Distribution</Title>
          <Text className="text-sm text-gray-500">Distribution of requests across different models</Text>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse h-40 w-40 bg-gray-100 rounded-full mx-auto"></div>
            </div>
          ) : (
            <div className="h-[300px] mt-4">
              {modelData.length > 0 ? (
                <DonutChart
                  className="h-full"
                  data={modelData}
                  category="requests"
                  index="name"
                  valueFormatter={formatNumber}
                  colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No model usage data available
                </div>
              )}
            </div>
          )}
        </Card>
        
        {/* Token Usage Section */}
        <Card className="overflow-hidden">
          <Title>Token Usage by Model</Title>
          <Text className="text-sm text-gray-500">Input and output token distribution</Text>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse h-40 w-full bg-gray-100 rounded"></div>
            </div>
          ) : (
            <div className="h-[300px] mt-4">
              {modelData.length > 0 ? (
                <BarChart
                  className="h-full"
                  data={modelData}
                  index="name"
                  categories={["input_tokens", "output_tokens"]}
                  colors={["blue", "cyan"]}
                  valueFormatter={formatNumber}
                  stack={false}
                  yAxisWidth={80}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No token usage data available
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Performance Metrics Section */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <Title>Response Time by Model</Title>
          <Text className="text-sm text-gray-500">Response time by model in milliseconds</Text>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse h-40 w-full bg-gray-100 rounded"></div>
            </div>
          ) : (
            <div className="h-[300px] mt-4">
              {modelData.length > 0 ? (
                <BarChart
                  className="h-full"
                  data={modelData}
                  index="name"
                  categories={["avg_response_time_ms", "p95_response_time_ms"]}
                  colors={["emerald", "green"]}
                  valueFormatter={formatTime}
                  stack={false}
                  yAxisWidth={80}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No performance data available
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
      
      {/* Cost Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model Section */}
        <Card className="overflow-hidden">
          <Title>Cost by Model</Title>
          <Text className="text-sm text-gray-500">Estimated cost by model in USD</Text>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse h-40 w-full bg-gray-100 rounded"></div>
            </div>
          ) : (
            <div className="h-[300px] mt-4">
              {modelData.length > 0 ? (
                <BarChart
                  className="h-full"
                  data={modelData}
                  index="name"
                  categories={["estimated_cost"]}
                  colors={["emerald"]}
                  valueFormatter={formatCost}
                  stack={false}
                  yAxisWidth={80}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No cost data available
                </div>
              )}
            </div>
          )}
        </Card>
        
        {/* Cost Efficiency Section */}
        <Card className="overflow-hidden">
          <Title>Cost per 1K Tokens</Title>
          <Text className="text-sm text-gray-500">Cost efficiency by model (USD per 1K tokens)</Text>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse h-40 w-full bg-gray-100 rounded"></div>
            </div>
          ) : (
            <div className="h-[300px] mt-4">
              {modelData.length > 0 ? (
                <BarChart
                  className="h-full"
                  data={modelData}
                  index="name"
                  categories={["cost_per_1k_tokens"]}
                  colors={["emerald"]}
                  valueFormatter={formatCost}
                  stack={false}
                  yAxisWidth={80}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No cost efficiency data available
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
      
      {/* Agent Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Usage Section */}
        <Card className="overflow-hidden">
          <Title>Token Usage by Agent</Title>
          <Text className="text-sm text-gray-500">Input and output token usage per agent</Text>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse h-40 w-full bg-gray-100 rounded"></div>
            </div>
          ) : (
            <div className="h-[300px] mt-4">
              {agentData.length > 0 ? (
                <BarChart
                  className="h-full"
                  data={agentData}
                  index="name"
                  categories={["input_tokens", "output_tokens"]}
                  colors={["blue", "indigo"]}
                  valueFormatter={formatNumber}
                  stack={false}
                  yAxisWidth={80}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No agent usage data available
                </div>
              )}
            </div>
          )}
        </Card>
        
        {/* Cost by Agent Section */}
        <Card className="overflow-hidden">
          <Title>Cost by Agent</Title>
          <Text className="text-sm text-gray-500">Estimated cost by agent</Text>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse h-40 w-full bg-gray-100 rounded"></div>
            </div>
          ) : (
            <div className="h-[300px] mt-4">
              {agentData.length > 0 ? (
                <BarChart
                  className="h-full"
                  data={agentData}
                  index="name"
                  categories={["estimated_cost"]}
                  colors={["emerald"]}
                  valueFormatter={formatCost}
                  stack={false}
                  yAxisWidth={80}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No cost data available
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 