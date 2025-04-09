'use client';

import { Grid, Title, Text } from '@tremor/react';
import DrilldownMetricCard from '../../components/drilldown/DrilldownMetricCard';
import { ClockIcon, UserGroupIcon, CommandLineIcon, CurrencyDollarIcon, ExclamationTriangleIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';

// Types
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

interface AgentMetricsDashboardProps {
  agent?: Agent;
  metrics?: DashboardMetric[];
  agentId: string;
  timeRange?: string;
}

export function AgentMetricsDashboard({ agent, metrics = [], agentId, timeRange }: AgentMetricsDashboardProps) {
  // Placeholder dashboard data in case we don't have agent or metrics
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardMetric[]>([]);
  const [agentData, setAgentData] = useState<Agent | null>(null);

  // Fetch dashboard data if not provided
  useEffect(() => {
    if (!agent || metrics.length === 0) {
      const fetchDashboardData = async () => {
        try {
          // Fetch dashboard metrics if not provided
          const response = await fetchAPI<{ metrics: DashboardMetric[] }>(
            `${AGENTS.DASHBOARD(agentId)}?time_range=${timeRange || '7d'}`
          );
          setDashboardData(response.metrics || []);
          
          // Fetch agent data if not provided
          if (!agent) {
            const agentResponse = await fetchAPI<Agent>(AGENTS.DETAIL(agentId));
            setAgentData(agentResponse);
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchDashboardData();
    } else {
      setDashboardData(metrics);
      setAgentData(agent);
      setLoading(false);
    }
  }, [agent, metrics, agentId, timeRange]);

  if (loading) {
    return <div>Loading dashboard metrics...</div>;
  }

  // Use the provided agent or the one we fetched
  const activeAgent = agent || agentData;
  if (!activeAgent) {
    return <div>No agent data available</div>;
  }

  // Helper function to find a metric by name
  const findMetric = (name: string): DashboardMetric | undefined => {
    return dashboardData.find(m => m.metric.toLowerCase() === name.toLowerCase());
  };

  // Formatter for different metric types
  const formatMetricValue = (metric: string, value: number): string => {
    if (metric.includes('time') || metric.includes('duration')) {
      return `${value.toFixed(2)}ms`;
    } else if (metric.includes('rate')) {
      return `${value.toFixed(2)}%`;
    } else if (metric.includes('cost')) {
      return `$${value.toFixed(2)}`;
    } else {
      return value.toLocaleString();
    }
  };

  // Get metrics from either the metrics array or from agent.metrics
  const getMetricValue = (metricName: string): number => {
    const metricFromAPI = findMetric(metricName);
    if (metricFromAPI) return metricFromAPI.value;

    // Fallback to agent.metrics
    if (activeAgent.metrics) {
      const key = metricName
        .replace(/\s+/g, '_')
        .toLowerCase() as keyof typeof activeAgent.metrics;
      
      if (typeof activeAgent.metrics[key] === 'number') {
        return activeAgent.metrics[key] as number;
      }
    }
    return 0;
  };

  // Get trend from metrics array
  const getMetricTrend = (metricName: string): 'up' | 'down' | 'stable' => {
    const metricFromAPI = findMetric(metricName);
    return metricFromAPI?.trend || 'stable';
  };

  // Get delta from metrics array
  const getMetricDelta = (metricName: string): number => {
    const metricFromAPI = findMetric(metricName);
    return metricFromAPI?.change || 0;
  };

  return (
    <div>
      <div className="mb-4">
        <Title>Performance Metrics</Title>
        <Text>Key metrics for this agent</Text>
      </div>

      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
        {/* Response Time */}
        <DrilldownMetricCard
          title="Avg. Response Time"
          value={formatMetricValue('avg_response_time', getMetricValue('avg_response_time'))}
          icon={<ClockIcon className="h-5 w-5" />}
          variant="primary"
          drilldownHref={`/agents/${agentId}/performance`}
          drilldownFilters={{ metric: 'response_time' }}
          drilldownLabel="View response time details"
        />

        {/* Session Count */}
        <DrilldownMetricCard
          title="Total Sessions"
          value={formatMetricValue('session_count', getMetricValue('session_count'))}
          icon={<UserGroupIcon className="h-5 w-5" />}
          variant="primary"
          drilldownHref={`/agents/${agentId}/sessions`}
          drilldownLabel="View all sessions"
        />

        {/* Tool Usage */}
        <DrilldownMetricCard
          title="Tool Executions"
          value={formatMetricValue('tool_execution_count', getMetricValue('tool_execution_count'))}
          icon={<CommandLineIcon className="h-5 w-5" />}
          variant="primary"
          drilldownHref={`/agents/${agentId}/tools`}
          drilldownLabel="View tool usage details"
        />

        {/* Token Usage Cost */}
        <DrilldownMetricCard
          title="Token Cost"
          value={formatMetricValue('cost_estimate', getMetricValue('cost_estimate'))}
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
          variant="primary"
          drilldownHref={`/agents/${agentId}/tokens`}
          drilldownLabel="View token usage details"
        />

        {/* Error Rate */}
        <DrilldownMetricCard
          title="Error Rate"
          value={formatMetricValue('error_rate', getMetricValue('error_rate'))}
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          variant="error"
          drilldownHref={`/agents/${agentId}/errors`}
          drilldownLabel="View error details"
        />

        {/* LLM Requests */}
        <DrilldownMetricCard
          title="LLM Requests"
          value={formatMetricValue('llm_request_count', getMetricValue('llm_request_count'))}
          icon={<ChatBubbleBottomCenterTextIcon className="h-5 w-5" />}
          variant="primary"
          drilldownHref={`/agents/${agentId}/llms`}
          drilldownLabel="View LLM usage details"
        />
      </Grid>
    </div>
  );
} 