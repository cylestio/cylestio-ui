'use client';

import { useState, useEffect } from 'react';
import { Title, Text, BarChart, Flex, Metric, Card } from '@tremor/react';
import { ChatBubbleBottomCenterTextIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';
import ErrorMessage from '@/app/components/ErrorMessage';

// Types
type LLMUsage = {
  model: string;
  vendor: string;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
};

interface AgentLLMUsageProps {
  agentId: string;
  timeRange: string;
}

export function AgentLLMUsage({ agentId, timeRange }: AgentLLMUsageProps) {
  // State
  const [llmUsage, setLlmUsage] = useState<LLMUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch LLM usage data
  useEffect(() => {
    const fetchLLMUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/agents/${agentId}/llms?time_range=${timeRange}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch LLM usage: ${response.statusText}`);
        }
        
        const data = await response.json();
        setLlmUsage(data.items || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching LLM usage');
      } finally {
        setLoading(false);
      }
    };

    fetchLLMUsage();
  }, [agentId, timeRange]);

  // Calculate totals
  const totalRequests = llmUsage.reduce((sum, item) => sum + item.request_count, 0);
  const totalTokens = llmUsage.reduce((sum, item) => sum + item.total_tokens, 0);
  const totalCost = llmUsage.reduce((sum, item) => sum + item.estimated_cost, 0);

  // Format token usage for chart
  const tokenChartData = llmUsage.map(item => ({
    model: item.model,
    'Input Tokens': item.input_tokens,
    'Output Tokens': item.output_tokens,
  }));

  if (loading) {
    return <LoadingState message="Loading LLM usage..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (llmUsage.length === 0) {
    return (
      <div className="text-center py-4">
        <ChatBubbleBottomCenterTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <Title>LLM Usage</Title>
        <Text className="mt-2">No LLM usage data available for this time period</Text>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Title>LLM Usage</Title>
        <Text>LLM models used by this agent</Text>
      </div>

      <div className="h-56">
        <BarChart
          data={tokenChartData}
          index="model"
          categories={['Input Tokens', 'Output Tokens']}
          colors={['blue', 'cyan']}
          stack={false}
          showLegend={true}
          valueFormatter={(value) => `${value.toLocaleString()} tokens`}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-6">
        <div className="text-center">
          <Flex justifyContent="center" alignItems="center" className="space-x-1">
            <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-blue-500" />
            <Metric>{totalRequests.toLocaleString()}</Metric>
          </Flex>
          <Text>Requests</Text>
        </div>
        
        <div className="text-center">
          <Metric>{totalTokens.toLocaleString()}</Metric>
          <Text>Total Tokens</Text>
        </div>
        
        <div className="text-center">
          <Flex justifyContent="center" alignItems="center" className="space-x-1">
            <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
            <Metric>${totalCost.toFixed(2)}</Metric>
          </Flex>
          <Text>Estimated Cost</Text>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <Link href={`/agents/${agentId}/llms`} className="text-blue-500 hover:underline text-sm">
          View all LLM requests →
        </Link>
      </div>
    </div>
  );
} 