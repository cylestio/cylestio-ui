'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Card, 
  Title, 
  Text, 
  Grid, 
  Flex,
  Badge,
  Divider,
  Metric,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Select,
  SelectItem
} from '@tremor/react';
import { 
  UserCircleIcon, 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import BreadcrumbNavigation from '../drilldown/BreadcrumbNavigation';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';
import { AgentMetricsDashboard } from './AgentMetricsDashboard';
import { AgentSessionsTable } from './AgentSessionsTable';
import { AgentLLMUsage } from './AgentLLMUsage';
import { AgentToolUsage } from './AgentToolUsage';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';
import { Agent, TimeRangeOption } from '../../types/agent';
import appSettings from '../../config/app-settings';

interface AgentDetailContainerProps {
  agentId: string;
}

export function AgentDetailContainer({ agentId }: AgentDetailContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(
    (searchParams.get('time_range') as TimeRangeOption) || 
    appSettings.timeRanges.default as TimeRangeOption
  );

  // Function to handle time range changes
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRangeOption);
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!agentId) return;

      setLoading(true);
      try {
        // Include time range in request
        const params = { time_range: timeRange };
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `${AGENTS.DETAIL(agentId)}${queryString ? `?${queryString}` : ''}`;
        
        const data = await fetchAPI<Agent>(endpoint);
        
        // Normalize agent data structure for consistent usage
        // Ensure metrics properties are accessible directly if needed
        setAgent({
          ...data,
          request_count: data.request_count || data.metrics?.request_count || 0,
          token_usage: data.token_usage || data.metrics?.token_usage || 0,
          error_count: data.error_count || data.metrics?.error_count || 0
        });
      } catch (err: any) {
        console.error('Error fetching agent details:', err);
        setError(err.message || 'Failed to load agent details');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId, timeRange]);

  if (loading) {
    return <LoadingState message="Loading agent details..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => {
          setError(null);
          setLoading(true);
          router.refresh();
        }} 
      />
    );
  }

  if (!agent) {
    return (
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-lg">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <Title>Agent Not Found</Title>
            <Text className="mt-2 mb-4">The agent with ID {agentId} was not found.</Text>
            <button 
              onClick={() => router.push('/agents')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Go to Agent Explorer
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation
        items={[
          { label: 'Home', href: '/' },
          { label: 'Agents', href: '/agents' },
          { label: agent.name, current: true }
        ]}
        className="mb-4"
      />
      
      {/* Time Range Selector and Title Row */}
      <div className="flex justify-between items-center mb-6">
        <Title className="text-2xl font-bold">{agent.name}</Title>
        <div className="w-40">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </Select>
        </div>
      </div>
      
      {/* Agent Header Card */}
      <Card className="mb-6">
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center">
            <div className="bg-primary-50 p-3 rounded-full mr-4">
              <UserCircleIcon className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <Text>{agent.type || 'Other'} Agent</Text>
              <Text className="text-gray-500">Last active {new Date(agent.updated_at).toLocaleString()}</Text>
            </div>
          </Flex>
          
          <Badge color={agent.status === 'active' ? 'green' : 'gray'} size="xl">
            {agent.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </Flex>
        
        {agent.description && (
          <>
            <Divider className="my-4" />
            <Text>{agent.description}</Text>
          </>
        )}
        
        <Divider className="my-4" />
        
        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          <Card decoration="top" decorationColor="blue">
            <Text>Total Requests</Text>
            <Metric>{agent.request_count.toLocaleString()}</Metric>
          </Card>
          
          <Card decoration="top" decorationColor="emerald">
            <Text>Success Rate</Text>
            <Metric>
              {agent.metrics?.success_rate 
                ? `${agent.metrics.success_rate}%` 
                : agent.request_count > 0 && agent.error_count > 0 
                  ? `${Math.round(((agent.request_count - agent.error_count) / agent.request_count) * 100)}%` 
                  : 'N/A'}
            </Metric>
          </Card>
          
          <Card decoration="top" decorationColor="amber">
            <Text>Token Usage</Text>
            <Metric>{agent.token_usage.toLocaleString()}</Metric>
          </Card>
          
          <Card decoration="top" decorationColor="red">
            <Text>Errors</Text>
            <Metric>{agent.error_count.toLocaleString()}</Metric>
          </Card>
        </Grid>
      </Card>
      
      {/* Agent Details Tabs */}
      <TabGroup className="mb-6">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Sessions</Tab>
          <Tab>LLM Usage</Tab>
          <Tab>Tools</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview Panel */}
          <TabPanel>
            <AgentMetricsDashboard agentId={agentId} timeRange={timeRange} />
          </TabPanel>
          
          {/* Sessions Panel */}
          <TabPanel>
            <AgentSessionsTable agentId={agentId} timeRange={timeRange} />
          </TabPanel>
          
          {/* LLM Usage Panel */}
          <TabPanel>
            <AgentLLMUsage agentId={agentId} timeRange={timeRange} />
          </TabPanel>
          
          {/* Tools Panel */}
          <TabPanel>
            <AgentToolUsage agentId={agentId} timeRange={timeRange} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 