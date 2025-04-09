'use client';

import { Grid, Title, Text } from '@tremor/react';
import DrilldownMetricCard from '@/app/components/drilldown/DrilldownMetricCard';
import { ClockIcon, UserGroupIcon, CommandLineIcon, CurrencyDollarIcon, ExclamationTriangleIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

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
  agent: Agent;
  metrics: DashboardMetric[];
  agentId: string;
}

export function AgentMetricsDashboard({ agent, metrics, agentId }: AgentMetricsDashboardProps) {
  // Helper function to find a metric by name
  const findMetric = (name: string): DashboardMetric | undefined => {
    return metrics.find(m => m.metric.toLowerCase() === name.toLowerCase());
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
    if (agent.metrics) {
      const key = metricName
        .replace(/\s+/g, '_')
        .toLowerCase() as keyof typeof agent.metrics;
      
      if (typeof agent.metrics[key] === 'number') {
        return agent.metrics[key] as number;
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
          icon={ClockIcon}
          trend={getMetricTrend('avg_response_time')}
          deltaType={getMetricTrend('avg_response_time') === 'down' ? 'moderateIncrease' : 'moderateDecrease'}
          delta={`${Math.abs(getMetricDelta('avg_response_time')).toFixed(2)}%`}
          drilldownHref={`/agents/${agentId}/performance`}
          drilldownFilters={{ metric: 'response_time' }}
          drilldownLabel="View response time details"
        />

        {/* Session Count */}
        <DrilldownMetricCard
          title="Total Sessions"
          value={formatMetricValue('session_count', getMetricValue('session_count'))}
          icon={UserGroupIcon}
          trend={getMetricTrend('session_count')}
          deltaType={getMetricTrend('session_count') === 'up' ? 'moderateIncrease' : 'moderateDecrease'}
          delta={`${Math.abs(getMetricDelta('session_count')).toFixed(2)}%`}
          drilldownHref={`/agents/${agentId}/sessions`}
          drilldownLabel="View all sessions"
        />

        {/* Tool Usage */}
        <DrilldownMetricCard
          title="Tool Executions"
          value={formatMetricValue('tool_execution_count', getMetricValue('tool_execution_count'))}
          icon={CommandLineIcon}
          trend={getMetricTrend('tool_execution_count')}
          deltaType={getMetricTrend('tool_execution_count') === 'up' ? 'moderateIncrease' : 'moderateDecrease'}
          delta={`${Math.abs(getMetricDelta('tool_execution_count')).toFixed(2)}%`}
          drilldownHref={`/agents/${agentId}/tools`}
          drilldownLabel="View tool usage details"
        />

        {/* Token Usage Cost */}
        <DrilldownMetricCard
          title="Token Cost"
          value={formatMetricValue('cost_estimate', getMetricValue('cost_estimate'))}
          icon={CurrencyDollarIcon}
          trend={getMetricTrend('cost_estimate')}
          deltaType={getMetricTrend('cost_estimate') === 'up' ? 'moderateDecrease' : 'moderateIncrease'}
          delta={`${Math.abs(getMetricDelta('cost_estimate')).toFixed(2)}%`}
          drilldownHref={`/agents/${agentId}/tokens`}
          drilldownLabel="View token usage details"
        />

        {/* Error Rate */}
        <DrilldownMetricCard
          title="Error Rate"
          value={formatMetricValue('error_rate', getMetricValue('error_rate'))}
          icon={ExclamationTriangleIcon}
          trend={getMetricTrend('error_rate')}
          deltaType={getMetricTrend('error_rate') === 'down' ? 'moderateIncrease' : 'moderateDecrease'}
          delta={`${Math.abs(getMetricDelta('error_rate')).toFixed(2)}%`}
          drilldownHref={`/agents/${agentId}/errors`}
          drilldownLabel="View error details"
        />

        {/* LLM Requests */}
        <DrilldownMetricCard
          title="LLM Requests"
          value={formatMetricValue('llm_request_count', getMetricValue('llm_request_count'))}
          icon={ChatBubbleBottomCenterTextIcon}
          trend={getMetricTrend('llm_request_count')}
          deltaType={getMetricTrend('llm_request_count') === 'up' ? 'moderateIncrease' : 'moderateDecrease'}
          delta={`${Math.abs(getMetricDelta('llm_request_count')).toFixed(2)}%`}
          drilldownHref={`/agents/${agentId}/llms`}
          drilldownLabel="View LLM usage details"
        />
      </Grid>
    </div>
  );
} 