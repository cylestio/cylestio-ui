'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react';
import { CommandLineIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LoadingState from '../../components/LoadingState';
import ErrorMessage from '../../components/ErrorMessage';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';

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
    if (!agentId) {
      setLoading(false);
      setError("No agent ID provided");
      return;
    }

    let isMounted = true;
    const fetchToolUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchAPI<{ items: ToolUsage[] }>(
          `${AGENTS.TOOL_USAGE(agentId)}?time_range=${timeRange}`
        );
        
        if (!isMounted) return;
        
        setToolUsage(data.items || []);
      } catch (err: any) {
        console.error('Error fetching tool usage:', err);
        if (isMounted) {
          setError(err.message || 'An error occurred while fetching tool usage');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchToolUsage();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);

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
    <Card>
      <div className="flex justify-between items-center mb-2">
        <div>
          <Title>Tool Usage</Title>
          <Text>Tool usage statistics for this agent</Text>
        </div>
        <Link href={`/tools?agent=${agentId}`} className="text-blue-500 hover:underline flex items-center">
          <span className="mr-1">View all tool executions</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Tool</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Executions</TableHeaderCell>
            <TableHeaderCell>Success Rate</TableHeaderCell>
            <TableHeaderCell>Avg Duration</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {toolUsage.map((tool) => (
            <TableRow 
              key={tool.tool_name} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => window.location.href = `/tools?agent=${agentId}&tool=${tool.tool_name}`}
            >
              <TableCell>{tool.tool_name}</TableCell>
              <TableCell>{tool.category}</TableCell>
              <TableCell>{tool.execution_count}</TableCell>
              <TableCell>
                <Badge color={tool.success_rate > 0.90 ? 'green' : tool.success_rate > 0.70 ? 'yellow' : 'red'}>
                  {(tool.success_rate * 100).toFixed(0)}%
                </Badge>
              </TableCell>
              <TableCell>{tool.avg_duration_ms.toFixed(0)} ms</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 