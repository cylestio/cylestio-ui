'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, DonutChart, Grid, AreaChart, Flex, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Metric } from '@tremor/react';
import { CurrencyDollarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import BreadcrumbNavigation from '../../../components/drilldown/BreadcrumbNavigation';
import LoadingState from '../../../components/LoadingState';
import ErrorMessage from '../../../components/ErrorMessage';

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
  
  // State
  const [agentName, setAgentName] = useState<string>('');
  const [tokenData, setTokenData] = useState<TokenData[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
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
        
        // For MVP, we'll create some sample token data
        // In the future, this should be fetched from a real API endpoint
        const now = new Date();
        const sampleTokenData: TokenData[] = [];
        for (let i = 0; i < 10; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const inputTokens = Math.floor(Math.random() * 5000) + 1000;
          const outputTokens = Math.floor(Math.random() * 3000) + 500;
          
          sampleTokenData.push({
            timestamp: date.toISOString(),
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens
          });
        }
        
        // Sample model usage data
        const sampleModelUsage: ModelUsage[] = [
          {
            model: 'gpt-4',
            vendor: 'openai',
            request_count: 350,
            input_tokens: 18000,
            output_tokens: 12000,
            total_tokens: 30000,
            estimated_cost: 1.20
          },
          {
            model: 'gpt-3.5-turbo',
            vendor: 'openai',
            request_count: 650,
            input_tokens: 10000,
            output_tokens: 5000,
            total_tokens: 15000,
            estimated_cost: 0.20
          }
        ];
        
        setTokenData(sampleTokenData.reverse());
        setModelUsage(sampleModelUsage);
        
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, timeRange]);

  // Calculate totals
  const totalInputTokens = modelUsage.reduce((sum, model) => sum + model.input_tokens, 0);
  const totalOutputTokens = modelUsage.reduce((sum, model) => sum + model.output_tokens, 0);
  const totalCost = modelUsage.reduce((sum, model) => sum + model.estimated_cost, 0);
  
  // Prepare chart data
  const tokenTrendData = tokenData.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    "Input Tokens": item.input_tokens,
    "Output Tokens": item.output_tokens
  }));
  
  const modelDonutData = modelUsage.map(model => ({
    name: model.model,
    value: model.total_tokens
  }));

  if (loading) {
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