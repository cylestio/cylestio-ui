'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, BarChart, DonutChart, Grid, Flex, Metric, Badge, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { ChatBubbleBottomCenterTextIcon, ArrowLeftIcon, CurrencyDollarIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import BreadcrumbNavigation from '../../../components/drilldown/BreadcrumbNavigation';
import LoadingState from '../../../components/LoadingState';
import ErrorMessage from '../../../components/ErrorMessage';

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

type LLMRequest = {
  request_id: string;
  timestamp: string;
  model: string;
  status: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  prompt_summary: string;
  response_summary: string;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

interface AgentLLMsPageProps {
  params: {
    id: string;
  };
}

export default function AgentLLMsPage({ params }: AgentLLMsPageProps) {
  const agentId = params.id;
  
  // State
  const [agentName, setAgentName] = useState<string>('');
  const [llmUsage, setLlmUsage] = useState<LLMUsage[]>([]);
  const [llmRequests, setLlmRequests] = useState<LLMRequest[]>([]);
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
        
        // Fetch LLM usage data
        const llmUsageResponse = await fetch(`/api/agents/${agentId}/llms?time_range=${timeRange}`);
        if (!llmUsageResponse.ok) {
          throw new Error(`Failed to fetch LLM usage: ${llmUsageResponse.statusText}`);
        }
        const llmUsageData = await llmUsageResponse.json();
        setLlmUsage(llmUsageData.items || []);
        
        // Fetch recent LLM requests
        const requestsResponse = await fetch(
          `/api/agents/${agentId}/llms/requests?time_range=${timeRange}&page=${pagination.page}&page_size=${pagination.page_size}`
        );
        if (!requestsResponse.ok) {
          throw new Error(`Failed to fetch LLM requests: ${requestsResponse.statusText}`);
        }
        const requestsData = await requestsResponse.json();
        setLlmRequests(requestsData.items || []);
        setPagination({
          page: requestsData.page || 1,
          page_size: requestsData.page_size || 10,
          total_items: requestsData.total_items || 0,
          total_pages: requestsData.total_pages || 0
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, timeRange, pagination.page, pagination.page_size]);

  // Calculate totals
  const totalRequests = llmUsage.reduce((sum, item) => sum + item.request_count, 0);
  const totalInputTokens = llmUsage.reduce((sum, item) => sum + item.input_tokens, 0);
  const totalOutputTokens = llmUsage.reduce((sum, item) => sum + item.output_tokens, 0);
  const totalCost = llmUsage.reduce((sum, item) => sum + item.estimated_cost, 0);

  // Format data for charts
  const tokenChartData = llmUsage.map(item => ({
    model: item.model,
    'Input Tokens': item.input_tokens,
    'Output Tokens': item.output_tokens,
  }));

  const costChartData = llmUsage.map(item => ({
    model: item.model,
    value: item.estimated_cost,
  }));

  // Custom colors for models
  const modelColors = [
    'blue',
    'cyan',
    'indigo',
    'violet',
    'purple',
  ];

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <Badge color="green">Success</Badge>;
      case 'error':
        return <Badge color="red">Error</Badge>;
      case 'partial':
        return <Badge color="amber">Partial</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  if (loading) {
    return <LoadingState message="Loading LLM usage data..." />;
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
          { label: 'LLM Usage', href: `/agents/${agentId}/llms` },
        ]}
        includeHome={true}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title className="text-2xl font-bold">LLM Usage Analysis</Title>
          <Text>Detailed analysis of LLM usage for this agent</Text>
        </div>
        <Link href={`/agents/${agentId}`}>
          <div className="flex items-center text-blue-500 hover:underline cursor-pointer">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back to Agent Overview</span>
          </div>
        </Link>
      </div>
      
      {/* Summary Metrics */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6 mb-6">
        <Card>
          <Flex justifyContent="start" alignItems="center" className="space-x-2">
            <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-blue-500" />
            <div>
              <Text>Total Requests</Text>
              <Metric>{totalRequests.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card>
          <Flex justifyContent="start" alignItems="center" className="space-x-2">
            <div>
              <Text>Input Tokens</Text>
              <Metric>{totalInputTokens.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card>
          <Flex justifyContent="start" alignItems="center" className="space-x-2">
            <div>
              <Text>Output Tokens</Text>
              <Metric>{totalOutputTokens.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card>
          <Flex justifyContent="start" alignItems="center" className="space-x-2">
            <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
            <div>
              <Text>Total Cost</Text>
              <Metric>${totalCost.toFixed(2)}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>
      
      {/* Token Usage Chart */}
      <Grid numItems={1} numItemsLg={2} className="gap-6 mb-6">
        <Card>
          <div className="mb-4">
            <Title>Token Usage by Model</Title>
            <Text>Input and output tokens per model</Text>
          </div>
          
          <div className="h-80">
            <BarChart
              data={tokenChartData}
              index="model"
              categories={['Input Tokens', 'Output Tokens']}
              colors={['blue', 'cyan']}
              stack={true}
              showLegend={true}
              valueFormatter={(value) => `${value.toLocaleString()} tokens`}
            />
          </div>
        </Card>
        
        {/* Cost Chart */}
        <Card>
          <div className="mb-4">
            <Title>Cost Distribution</Title>
            <Text>Estimated cost by model</Text>
          </div>
          
          <div className="h-80">
            <DonutChart
              data={costChartData}
              category="value"
              index="model"
              variant="pie"
              colors={modelColors}
              valueFormatter={(value) => `$${value.toFixed(2)}`}
              showLabel={true}
              label="Total Cost"
              showAnimation={true}
            />
          </div>
        </Card>
      </Grid>
      
      {/* Recent Requests */}
      <Card>
        <div className="mb-4">
          <Title>Recent LLM Requests</Title>
          <Text>Details of recent LLM requests made by this agent</Text>
        </div>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Model</TableHeaderCell>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Input Tokens</TableHeaderCell>
              <TableHeaderCell>Output Tokens</TableHeaderCell>
              <TableHeaderCell>Duration (ms)</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {llmRequests.map((request) => (
              <TableRow key={request.request_id}>
                <TableCell className="font-medium">{request.model}</TableCell>
                <TableCell>{formatTimestamp(request.timestamp)}</TableCell>
                <TableCell>{request.input_tokens.toLocaleString()}</TableCell>
                <TableCell>{request.output_tokens.toLocaleString()}</TableCell>
                <TableCell>{request.duration_ms.toFixed(2)}</TableCell>
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell>
                  <Link href={`/agents/${agentId}/llms/requests/${request.request_id}`}>
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
              Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_items)} of {pagination.total_items} requests
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