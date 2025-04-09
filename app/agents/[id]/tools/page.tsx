'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Grid, Badge, BarChart, Flex, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { CommandLineIcon, ArrowLeftIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import BreadcrumbNavigation from '@/app/components/drilldown/BreadcrumbNavigation';
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

type ToolExecution = {
  execution_id: string;
  timestamp: string;
  tool_name: string;
  status: string;
  duration_ms: number;
  parameters: Record<string, any>;
  result_summary: string;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

interface AgentToolsPageProps {
  params: {
    id: string;
  };
}

export default function AgentToolsPage({ params }: AgentToolsPageProps) {
  const agentId = params.id;
  
  // State
  const [agentName, setAgentName] = useState<string>('');
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 0
  });
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch agent basic info for the name
        const agentResponse = await fetch(`/api/agents/${agentId}`);
        if (!agentResponse.ok) {
          throw new Error(`Failed to fetch agent: ${agentResponse.statusText}`);
        }
        const agentData = await agentResponse.json();
        setAgentName(agentData.name);
        
        // Fetch tool usage data
        const toolUsageResponse = await fetch(`/api/agents/${agentId}/tools?time_range=${timeRange}`);
        if (!toolUsageResponse.ok) {
          throw new Error(`Failed to fetch tool usage: ${toolUsageResponse.statusText}`);
        }
        const toolUsageData = await toolUsageResponse.json();
        setToolUsage(toolUsageData.items || []);
        
        // Fetch recent tool executions
        const executionsResponse = await fetch(
          `/api/agents/${agentId}/tools/executions?time_range=${timeRange}&page=${pagination.page}&page_size=${pagination.page_size}`
        );
        if (!executionsResponse.ok) {
          throw new Error(`Failed to fetch tool executions: ${executionsResponse.statusText}`);
        }
        const executionsData = await executionsResponse.json();
        setToolExecutions(executionsData.items || []);
        setPagination({
          page: executionsData.page || 1,
          page_size: executionsData.page_size || 10,
          total_items: executionsData.total_items || 0,
          total_pages: executionsData.total_pages || 0
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, timeRange, pagination.page, pagination.page_size]);

  // Format for chart
  const chartData = toolUsage.map(tool => ({
    tool: tool.tool_name,
    'Success Rate': tool.success_rate,
    'Average Duration (ms)': tool.avg_duration_ms,
    'Executions': tool.execution_count,
  }));

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <Badge color="green">Success</Badge>;
      case 'error':
        return <Badge color="red">Error</Badge>;
      case 'warning':
        return <Badge color="amber">Warning</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  if (loading) {
    return <LoadingState message="Loading tool usage data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <BreadcrumbNavigation
        items={[
          { label: 'Agents', href: '/agents' },
          { label: agentName, href: `/agents/${agentId}` },
          { label: 'Tool Usage', href: `/agents/${agentId}/tools` },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title className="text-2xl font-bold">Tool Usage Analysis</Title>
          <Text>Detailed analysis of tool usage for this agent</Text>
        </div>
        <Link href={`/agents/${agentId}`}>
          <div className="flex items-center text-blue-500 hover:underline cursor-pointer">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back to Agent Overview</span>
          </div>
        </Link>
      </div>
      
      <Card className="mb-6">
        <div className="mb-4">
          <Title>Tool Usage Distribution</Title>
          <Text>Success rates and average durations for each tool</Text>
        </div>
        
        <div className="h-80">
          <BarChart
            data={chartData}
            index="tool"
            categories={['Success Rate', 'Average Duration (ms)']}
            colors={['green', 'blue']}
            valueFormatter={(value) => value.toFixed(2)}
            yAxisWidth={60}
            showLegend={true}
          />
        </div>
      </Card>
      
      <Card>
        <div className="mb-4">
          <Title>Recent Tool Executions</Title>
          <Text>Details of recent tool executions by this agent</Text>
        </div>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tool</TableHeaderCell>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Duration (ms)</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Result</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {toolExecutions.map((execution) => (
              <TableRow key={execution.execution_id}>
                <TableCell className="font-medium">{execution.tool_name}</TableCell>
                <TableCell>{formatTimestamp(execution.timestamp)}</TableCell>
                <TableCell>{execution.duration_ms.toFixed(2)}</TableCell>
                <TableCell>
                  <StatusBadge status={execution.status} />
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {execution.result_summary || 'No result summary available'}
                </TableCell>
                <TableCell>
                  <Link href={`/agents/${agentId}/tools/executions/${execution.execution_id}`}>
                    <div className="flex items-center text-blue-500 hover:underline cursor-pointer">
                      <span className="mr-1">Details</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </div>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Text>
              Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_items)} of {pagination.total_items} executions
            </Text>
            
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                disabled={pagination.page === pagination.total_pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 