'use client';

import { Grid, Title, Text, Card, Flex } from '@tremor/react';
import { 
  ClockIcon, 
  UserGroupIcon, 
  CommandLineIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon, 
  ChatBubbleBottomCenterTextIcon, 
  CheckCircleIcon,
  ShieldExclamationIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
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
  request_count?: number;
  token_usage?: number;
  error_count?: number;
  metrics?: {
    request_count: number;
    token_usage: number;
    error_count: number;
    avg_response_time_ms: number;
    tool_usage: number;
    security_alerts_count: number;
    policy_violations_count: number;
    // Keep the old metrics for backward compatibility
    success_rate?: number;
    cost_estimate?: number;
    estimated_cost?: number;
    session_count?: number;
    avg_session_duration?: number;
    top_tools?: { name: string; count: number }[];
  };
};

// Type for LLM usage data
type LLMUsage = {
  model: string;
  vendor: string;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
};

type DashboardMetric = {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
};

interface AgentMetricsProps {
  agent?: Agent;
  metrics?: DashboardMetric[];
  agentId: string;
  timeRange?: string;
}

// Standalone metrics row component that can be used above tabs in the parent component
export function AgentMetricsRow({ agent, metrics = [], agentId, timeRange }: AgentMetricsProps) {
  // Placeholder dashboard data in case we don't have agent or metrics
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardMetric[]>([]);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [llmUsageData, setLlmUsageData] = useState<LLMUsage[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [tokenUsageData, setTokenUsageData] = useState<{
    total_tokens: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    by_model?: Record<string, any>;
  } | null>(null);
  const [agentCostData, setAgentCostData] = useState<{
    total_cost: number;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    request_count: number;
  } | null>(null);

  // Fetch token usage and cost data from the cost API endpoint
  useEffect(() => {
    if (!agentId || !timeRange) return;

    let isMounted = true;
    const fetchAgentCostData = async () => {
      try {
        // Build the endpoint with time range parameter
        const params = { time_range: timeRange, include_breakdown: 'false' };
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `${AGENTS.COST(agentId)}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetchAPI<any>(endpoint);
        
        if (!isMounted) return;
        
        console.log('Agent cost API response:', response);
        
        if (response) {
          setAgentCostData({
            total_cost: response.total_cost || 0,
            total_tokens: response.total_tokens || 0,
            input_tokens: response.input_tokens || 0,
            output_tokens: response.output_tokens || 0,
            request_count: response.request_count || 0
          });
          
          // Set cost directly from this API
          setTotalCost(response.total_cost || 0);
        }
      } catch (error) {
        console.error('Error fetching agent cost data:', error);
      }
    };
    
    fetchAgentCostData();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);

  // Fetch token usage data to get the accurate total value
  useEffect(() => {
    if (!agentId || !timeRange) return;

    let isMounted = true;
    const fetchTokenUsage = async () => {
      try {
        // Build the endpoint with time range parameter
        const params = { time_range: timeRange };
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `${AGENTS.TOKEN_USAGE(agentId)}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetchAPI<{
          total_tokens: number;
          prompt_tokens?: number;
          completion_tokens?: number;
          by_model?: Record<string, any>;
        }>(endpoint);
        
        if (!isMounted) return;
        
        console.log('Token usage data:', response);
        setTokenUsageData(response);
      } catch (error) {
        console.error('Error fetching token usage data:', error);
      }
    };
    
    fetchTokenUsage();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);

  // Fetch LLM usage data specifically to get accurate cost information
  useEffect(() => {
    if (!agentId || !timeRange) return;

    let isMounted = true;
    const fetchLLMUsage = async () => {
      try {
        const data = await fetchAPI<{ items: LLMUsage[] }>(
          `${AGENTS.LLM_USAGE(agentId)}?time_range=${timeRange}`
        );
        
        if (!isMounted) return;
        
        // Process data to ensure cost is calculated
        const processedData = (data.items || []).map(item => ({
          ...item,
          // Calculate estimated cost if it's missing or zero
          estimated_cost: item.estimated_cost || (item.total_tokens * 0.000002) // Fallback calculation
        }));
        
        setLlmUsageData(processedData);
        
        // Calculate total cost from LLM usage data
        const calculatedTotalCost = processedData.reduce((sum, item) => sum + item.estimated_cost, 0);
        setTotalCost(calculatedTotalCost);
      } catch (error) {
        console.error('Error fetching LLM usage data:', error);
      }
    };
    
    fetchLLMUsage();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);

  // Fetch dashboard data if not provided
  useEffect(() => {
    // Skip the data fetching if we already have all the data we need
    if (agent && metrics.length > 0) {
      setDashboardData(metrics);
      setAgentData(agent);
      setLoading(false);
      return;
    }

    // Skip API call if we don't have an agent ID
    if (!agentId) {
      setLoading(false);
      setError("No agent ID provided");
      return;
    }

    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch agent details using the single API endpoint that includes metrics
        const agentResponse = await fetchAPI<Agent>(AGENTS.DETAIL(agentId));
        
        // Check if component is still mounted before updating state
        if (!isMounted) return;
        
        // Set the agent data
        setAgentData(agentResponse);
        
        // If we have metrics in the agent response, convert them to dashboard metrics format
        if (agentResponse.metrics) {
          const metricsList: DashboardMetric[] = [];
          
          // Convert agent metrics to dashboard metrics format
          for (const [key, value] of Object.entries(agentResponse.metrics)) {
            if (typeof value === 'number') {
              metricsList.push({
                metric: key,
                value: value,
                change: 0, // We don't have change data in this API response
                trend: 'stable'
              });
            }
          }
          
          setDashboardData(metricsList);
        }
      } catch (error: any) {
        console.error('Error fetching agent details:', error);
        if (isMounted) {
          setError(error.message || 'Failed to load agent details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchDashboardData();
    
    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);  // Remove agent and metrics from dependencies

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

  // Calculate success rate
  const successRate = activeAgent.metrics?.success_rate 
    ? `${activeAgent.metrics.success_rate}%` 
    : (activeAgent.request_count || activeAgent.metrics?.request_count || 0) > 0 && 
      (activeAgent.error_count || activeAgent.metrics?.error_count || 0) > 0 
      ? `${Math.round(((
          (activeAgent.request_count || activeAgent.metrics?.request_count || 0) - 
          (activeAgent.error_count || activeAgent.metrics?.error_count || 0)
        ) / (activeAgent.request_count || activeAgent.metrics?.request_count || 1)) * 100)}%` 
      : 'N/A';

  return (
    <Card className="p-4">
      <Grid numItems={2} numItemsSm={3} numItemsLg={7} className="gap-6">
        <CompactMetric 
          title="Requests" 
          value={(agentCostData?.request_count || activeAgent.metrics?.request_count || 0).toLocaleString()} 
          icon={<CommandLineIcon className="h-4 w-4 text-blue-600" />}
        />
        <CompactMetric 
          title="Token Usage" 
          value={(agentCostData?.total_tokens || tokenUsageData?.total_tokens || activeAgent.metrics?.token_usage || 0).toLocaleString()} 
          icon={<ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-amber-600" />}
        />
        <CompactMetric 
          title="Errors" 
          value={(activeAgent.metrics?.error_count || 0).toLocaleString()} 
          icon={<ExclamationTriangleIcon className="h-4 w-4 text-rose-600" />}
        />
        <CompactMetric 
          title="Avg. Response" 
          value={`${(activeAgent.metrics?.avg_response_time_ms || 0).toLocaleString()}ms`} 
          icon={<ClockIcon className="h-4 w-4 text-blue-600" />}
        />
        <CompactMetric 
          title="Security Alerts" 
          value={(activeAgent.metrics?.security_alerts_count || 0).toLocaleString()} 
          icon={<ShieldExclamationIcon className="h-4 w-4 text-red-600" />}
        />
        <CompactMetric 
          title="Policy Violations" 
          value={(activeAgent.metrics?.policy_violations_count || 0).toLocaleString()} 
          icon={<DocumentTextIcon className="h-4 w-4 text-orange-600" />}
        />
        <CompactMetric 
          title="Estimated Cost" 
          value={`$${(agentCostData?.total_cost || totalCost).toFixed(2)}`} 
          icon={<CurrencyDollarIcon className="h-4 w-4 text-green-600" />}
        />
      </Grid>
    </Card>
  );
}

// Original dashboard component for backward compatibility
export function AgentMetricsDashboard({ agent, metrics = [], agentId, timeRange }: AgentMetricsProps) {
  return (
    <div>
      <div className="mb-4">
        <Title>Performance Metrics</Title>
        <Text>Key metrics for this agent</Text>
      </div>
      
      <AgentMetricsRow agent={agent} metrics={metrics} agentId={agentId} timeRange={timeRange} />
    </div>
  );
}

// Helper component for compact view
function CompactMetric({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <Flex justifyContent="center" alignItems="center" className="mb-1">
        {icon}
      </Flex>
      <Text className="text-sm font-medium">{title}</Text>
      <Title className="text-xl mt-1">{value}</Title>
    </div>
  );
} 