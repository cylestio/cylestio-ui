'use client';

import { useState, useEffect } from 'react';
import { Title, Text, DonutChart, ProgressBar, Flex, Metric, Legend } from '@tremor/react';
import { CommandLineIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LoadingState from '@/app/components/LoadingState';
import ErrorMessage from '@/app/components/ErrorMessage';

// Types
type ToolUsage = {
  tool_name: string;
  category: string;
  execution_count: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  avg_duration_ms: number;
};

interface AgentToolUsageProps {
  agentId: string;
  timeRange: string;
}

export function AgentToolUsage({ agentId, timeRange }: AgentToolUsageProps) {
  // State
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tool usage data
  useEffect(() => {
    const fetchToolUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/agents/${agentId}/tools?time_range=${timeRange}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tool usage: ${response.statusText}`);
        }
        
        const data = await response.json();
        setToolUsage(data.items || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching tool usage');
      } finally {
        setLoading(false);
      }
    };

    fetchToolUsage();
  }, [agentId, timeRange]);

  // Calculate the total executions
  const totalExecutions = toolUsage.reduce(
    (sum, tool) => sum + tool.execution_count, 
    0
  );

  // Format for the chart
  const chartData = toolUsage
    .sort((a, b) => b.execution_count - a.execution_count)
    .slice(0, 5)
    .map(tool => ({
      name: tool.tool_name,
      value: tool.execution_count,
    }));

  // Custom colors
  const customColors = [
    'blue',
    'cyan',
    'indigo',
    'violet',
    'purple',
  ];

  if (loading) {
    return <LoadingState message="Loading tool usage..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (toolUsage.length === 0) {
    return (
      <div className="text-center py-4">
        <CommandLineIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <Title>Tool Usage</Title>
        <Text className="mt-2">No tool usage data available for this time period</Text>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Title>Tool Usage</Title>
        <Text>Top tools used by this agent</Text>
      </div>

      <div className="h-56 mt-4">
        <DonutChart
          data={chartData}
          category="value"
          index="name"
          variant="pie"
          colors={customColors}
          showLabel={true}
          showAnimation={true}
          valueFormatter={(value) => `${value} calls`}
        />
      </div>

      <Legend
        categories={chartData.map(item => item.name)}
        colors={customColors}
        className="mt-4"
      />

      <div className="mt-6">
        <Text className="font-medium">Success Rate by Tool</Text>
        <div className="space-y-3 mt-2">
          {toolUsage
            .sort((a, b) => b.execution_count - a.execution_count)
            .slice(0, 3)
            .map((tool) => (
              <div key={tool.tool_name}>
                <Flex justifyContent="between" className="mb-1">
                  <Text>{tool.tool_name}</Text>
                  <Text>{tool.success_rate.toFixed(0)}%</Text>
                </Flex>
                <ProgressBar 
                  value={tool.success_rate} 
                  color={tool.success_rate > 90 ? 'green' : tool.success_rate > 70 ? 'yellow' : 'red'} 
                />
              </div>
            ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Flex justifyContent="center" alignItems="center" className="space-x-1">
          <CommandLineIcon className="h-5 w-5 text-blue-500" />
          <Metric>{totalExecutions}</Metric>
        </Flex>
        <Text>Total Tool Executions</Text>
      </div>
      
      <div className="mt-4 text-center">
        <Link href={`/agents/${agentId}/tools`} className="text-blue-500 hover:underline text-sm">
          View all tool executions →
        </Link>
      </div>
    </div>
  );
} 