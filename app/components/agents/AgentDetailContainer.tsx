'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Select, SelectItem } from '@tremor/react';
import BreadcrumbNavigation from '../drilldown/BreadcrumbNavigation';
import { AgentHeader } from './AgentHeader';
import { AgentMetricsDashboard } from './AgentMetricsDashboard';
import { AgentSessionsTable } from './AgentSessionsTable';
import { AgentToolUsage } from './AgentToolUsage';
import { AgentLLMUsage } from './AgentLLMUsage';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';

// Types from the API
type Agent = {
  agent_id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  configuration?: Record<string, any>;
  metrics?: {
    request_count: number;
    token_usage: number;
    error_count: number;
    avg_response_time?: number;
    success_rate?: number;
    cost_estimate?: number;
    session_count?: number;
    avg_session_duration?: number;
    top_tools?: { name: string; count: number }[];
  };
};

type DashboardMetric = {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
};

type TimeRangeOption = '24h' | '7d' | '30d';

interface AgentDetailContainerProps {
  agentId: string;
}

export function AgentDetailContainer({ agentId }: AgentDetailContainerProps) {
  // State for agent data
  const [agent, setAgent] = useState<Agent | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetric[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch agent data
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch agent details
        const agentResponse = await fetch(`/api/agents/${agentId}`);
        if (!agentResponse.ok) {
          throw new Error(`Failed to fetch agent: ${agentResponse.statusText}`);
        }
        const agentData: Agent = await agentResponse.json();
        setAgent(agentData);
        
        // Fetch dashboard metrics
        const dashboardResponse = await fetch(`/api/agents/${agentId}/dashboard?time_range=${timeRange}`);
        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          setDashboardMetrics(dashboardData.metrics || []);
        }
        
        setLastUpdated(new Date());
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching agent data');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId, timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRangeOption);
  };

  if (loading) {
    return <LoadingState message="Loading agent details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!agent) {
    return <ErrorMessage message="Agent not found" />;
  }

  return (
    <div>
      <BreadcrumbNavigation
        items={[
          { label: 'Agents', href: '/agents' },
          { label: agent.name, href: `/agents/${agentId}` },
        ]}
        preserveFilters
      />
      
      <div className="mb-6 flex justify-between items-center">
        <Title className="text-2xl font-bold">Agent Details</Title>
        <div className="w-40">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </Select>
        </div>
      </div>
      
      <div className="space-y-6">
        <AgentHeader agent={agent} lastUpdated={lastUpdated} />
        
        <AgentMetricsDashboard 
          agent={agent} 
          metrics={dashboardMetrics} 
          agentId={agentId} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <AgentToolUsage agentId={agentId} timeRange={timeRange} />
          </Card>
          <Card>
            <AgentLLMUsage agentId={agentId} timeRange={timeRange} />
          </Card>
        </div>
        
        <Card>
          <AgentSessionsTable agentId={agentId} timeRange={timeRange} />
        </Card>
      </div>
    </div>
  );
} 