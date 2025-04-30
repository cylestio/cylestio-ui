'use client';

import { useState, useEffect } from 'react';
import { Title, Text, BarChart, Flex, Metric, Card } from '@tremor/react';
import { ChatBubbleBottomCenterTextIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LoadingState from '../../components/LoadingState';
import ErrorMessage from '../../components/ErrorMessage';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';
import { TokenUsageByModelChart } from '../../components/TokenUsageByModelChart';

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
  // State with guaranteed default values to prevent rendering issues
  const [llmUsage, setLlmUsage] = useState<LLMUsage[]>([
    {
      model: "Loading...",
      vendor: "Unknown",
      request_count: 0,
      input_tokens: 1,  // Use non-zero values to ensure chart renders
      output_tokens: 1,
      total_tokens: 2,
      estimated_cost: 0
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch LLM usage data
  useEffect(() => {
    // Skip API call if we don't have an agent ID
    if (!agentId) {
      setLoading(false);
      setError("No agent ID provided");
      return;
    }

    let isMounted = true;
    const fetchLLMUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchAPI<{ items: LLMUsage[] }>(
          `${AGENTS.LLM_USAGE(agentId)}?time_range=${timeRange}`
        );
        
        // Check if component is still mounted before updating state
        if (!isMounted) return;
        
        console.log("LLM usage data from API:", data);
        
        if (data && data.items && data.items.length > 0) {
          // Ensure we have valid cost data
          const processedData = data.items.map(item => ({
            ...item,
            // Ensure all numeric fields have at least a minimum value
            request_count: item.request_count || 0,
            input_tokens: Math.max(item.input_tokens || 0, 1), // Minimum 1 for chart
            output_tokens: Math.max(item.output_tokens || 0, 1), // Minimum 1 for chart
            total_tokens: Math.max(item.total_tokens || 0, 2), // Minimum 2 for chart
            // Calculate estimated cost if it's missing or zero
            estimated_cost: item.estimated_cost || (item.total_tokens * 0.000002) // Fallback calculation
          }));
          
          setLlmUsage(processedData);
        } else {
          // Use default data if no items
          setLlmUsage([
            {
              model: "No Models Used",
              vendor: "N/A",
              request_count: 0,
              input_tokens: 1, // non-zero for chart rendering
              output_tokens: 1, // non-zero for chart rendering
              total_tokens: 2,
              estimated_cost: 0
            }
          ]);
        }
        
        setDataLoaded(true);
      } catch (err: any) {
        console.error('Error fetching LLM usage:', err);
        if (isMounted) {
          setError(err.message || 'An error occurred while fetching LLM usage');
          // Keep the existing data on error if we already loaded some
          if (!dataLoaded) {
            setLlmUsage([
              {
                model: "Error Loading Data",
                vendor: "N/A",
                request_count: 0,
                input_tokens: 1, // non-zero for chart rendering
                output_tokens: 1, // non-zero for chart rendering
                total_tokens: 2,
                estimated_cost: 0
              }
            ]);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLLMUsage();
    
    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange, dataLoaded]);

  // Calculate totals (will always work because we guarantee data exists)
  const totalRequests = llmUsage.reduce((sum, item) => sum + item.request_count, 0);
  const totalTokens = llmUsage.reduce((sum, item) => sum + item.total_tokens, 0);
  const totalCost = llmUsage.reduce((sum, item) => sum + item.estimated_cost, 0);

  // Format token usage for chart
  const tokenChartData = llmUsage.map(item => ({
    name: item.model,
    'Input Tokens': item.input_tokens,
    'Output Tokens': item.output_tokens,
  }));

  // Define custom vibrant colors for the chart
  const customColors = [
    'rgba(59, 130, 246, 0.7)', // Blue with opacity
    'rgba(6, 182, 212, 0.7)'    // Cyan with opacity
  ];

  // Instead of showing a loading or error state, always render the chart with the current data
  // This ensures UI consistency and prevents the chart from disappearing during data changes
  
  return (
    <div>
      <div className="mb-4">
        <Title>LLM Usage</Title>
        <Text>LLM models used by this agent</Text>
        {loading && <Text className="text-xs text-gray-500">Loading data...</Text>}
        {error && <Text className="text-xs text-red-500">{error}</Text>}
      </div>

      <Card className="overflow-hidden mb-6">
        <div style={{ height: "400px", width: "100%", position: "relative" }}>
          {/* Always render the chart, even with placeholder data */}
          <TokenUsageByModelChart 
            data={tokenChartData} 
            formatValue={(value) => `${value.toLocaleString()} tokens`}
            colors={customColors}
          />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card>
          <div className="text-center">
            <Flex justifyContent="center" alignItems="center" className="space-x-1">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-blue-500" />
              <Metric>{totalRequests.toLocaleString()}</Metric>
            </Flex>
            <Text>Requests</Text>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <Metric>{totalTokens.toLocaleString()}</Metric>
            <Text>Total Tokens</Text>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <Flex justifyContent="center" alignItems="center" className="space-x-1">
              <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
              <Metric>${totalCost.toFixed(2)}</Metric>
            </Flex>
            <Text>Estimated Cost</Text>
          </div>
        </Card>
      </div>
    </div>
  );
} 