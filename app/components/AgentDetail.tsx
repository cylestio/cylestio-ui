'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Title,
  Text,
  Metric,
  Flex,
  Grid,
  Badge,
  AreaChart,
  BarChart,
  DonutChart,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableBody,
  Button,
  Select,
  SelectItem,
} from '@tremor/react';
import { 
  ArrowPathIcon, 
  ArrowLeftIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  CpuChipIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  CircleStackIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SimpleDonutChart } from './SimpleDonutChart';

type AgentDetailProps = {
  agentId: string;
};

// New types based on API schema
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

type Session = {
  session_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  event_count: number;
  llm_request_count: number;
  tool_execution_count: number;
  error_count: number;
  status: string;
};

type Trace = {
  trace_id: string;
  start_time: string;
  end_time?: string;
  duration_ms: number;
  event_count: number;
  status: string;
  initial_event_type: string;
};

type Alert = {
  alert_id: string;
  timestamp: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  related_event_id: string;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export function AgentDetail({ agentId }: AgentDetailProps) {
  // State variables for the different data types
  const [agent, setAgent] = useState<Agent | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetric[]>([]);
  const [llmUsage, setLlmUsage] = useState<LLMUsage[]>([]);
  const [recentLLMRequests, setRecentLLMRequests] = useState<LLMRequest[]>([]);
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [recentToolExecutions, setRecentToolExecutions] = useState<ToolExecution[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch all agent data
  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch agent details
      const agentResponse = await fetch(`/v1/agents/${agentId}`);
      if (!agentResponse.ok) {
        if (agentResponse.status === 404) {
          throw new Error('Agent not found');
        }
        throw new Error(`Failed to fetch agent: ${agentResponse.statusText}`);
      }
      const agentData = await agentResponse.json();
      setAgent(agentData);
      
      // Fetch dashboard metrics
      const dashboardResponse = await fetch(`/v1/agents/${agentId}/dashboard?time_range=${timeRange}`);
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setDashboardMetrics(dashboardData.metrics);
      }
      
      // Fetch LLM usage
      const llmUsageResponse = await fetch(`/v1/agents/${agentId}/llms?time_range=${timeRange}`);
      if (llmUsageResponse.ok) {
        const llmData = await llmUsageResponse.json();
        setLlmUsage(llmData.items || []);
      }
      
      // Fetch recent LLM requests
      const llmRequestsResponse = await fetch(`/v1/agents/${agentId}/llms/requests?time_range=${timeRange}&page=1&page_size=5`);
      if (llmRequestsResponse.ok) {
        const llmRequestsData = await llmRequestsResponse.json();
        setRecentLLMRequests(llmRequestsData.items || []);
      }
      
      // Fetch tool usage
      const toolUsageResponse = await fetch(`/v1/agents/${agentId}/tools?time_range=${timeRange}`);
      if (toolUsageResponse.ok) {
        const toolData = await toolUsageResponse.json();
        setToolUsage(toolData.items || []);
      }
      
      // Fetch recent tool executions
      const toolExecutionsResponse = await fetch(`/v1/agents/${agentId}/tools/executions?time_range=${timeRange}&page=1&page_size=5`);
      if (toolExecutionsResponse.ok) {
        const toolExecutionsData = await toolExecutionsResponse.json();
        setRecentToolExecutions(toolExecutionsData.items || []);
      }
      
      // Fetch sessions
      const sessionsResponse = await fetch(`/v1/agents/${agentId}/sessions?time_range=${timeRange}&page=1&page_size=5`);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.items || []);
      }
      
      // Fetch traces
      const tracesResponse = await fetch(`/v1/agents/${agentId}/traces?time_range=${timeRange}&page=1&page_size=5`);
      if (tracesResponse.ok) {
        const tracesData = await tracesResponse.json();
        setTraces(tracesData.items || []);
      }
      
      // Fetch security alerts
      const alertsResponse = await fetch(`/v1/agents/${agentId}/alerts?time_range=${timeRange}&page=1&page_size=5`);
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.items || []);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching agent data:', err);
      setError(`${err instanceof Error ? err.message : 'Failed to load agent data'}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAgentData();
  }, [agentId, timeRange]);

  // Format the timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge color="green">Active</Badge>;
      case 'inactive':
      case 'paused':
        return <Badge color="gray">Inactive</Badge>;
      case 'error':
      case 'failed':
        return <Badge color="red">Error</Badge>;
      case 'completed':
        return <Badge color="green">Completed</Badge>;
      case 'warning':
        return <Badge color="yellow">Warning</Badge>;
      case 'success':
        return <Badge color="green">Success</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  // Format metric name for display
  const formatMetricName = (metric: string) => {
    const parts = metric.split('.');
    return parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  // Format metric value
  const formatMetricValue = (metric: string, value: number) => {
    if (metric.includes('token')) {
      return `${value.toLocaleString()} tokens`;
    } else if (metric.includes('time') || metric.includes('duration')) {
      return `${value.toLocaleString()} ms`;
    } else if (metric.includes('rate')) {
      return `${(value * 100).toFixed(1)}%`;
    } else if (metric.includes('cost')) {
      return `$${value.toFixed(2)}`;
    }
    return value.toLocaleString();
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'rose';
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Text>Loading agent details...</Text>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="h-96 flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <Text color="red">{error}</Text>
          </div>
          <Link href="/agents">
            <Button icon={ArrowLeftIcon}>Back to Agents</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <Card className="h-96 flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <Text>Agent not found</Text>
          </div>
          <Link href="/agents">
            <Button icon={ArrowLeftIcon}>Back to Agents</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <Flex alignItems="center" className="gap-2">
          <Link href="/agents">
            <Button variant="light" icon={ArrowLeftIcon}>
              Back
            </Button>
          </Link>
          <Title>Agent: {agent.name}</Title>
          <Badge color="blue" size="lg">{agent.agent_id}</Badge>
        </Flex>
        <Flex justifyContent="end" className="space-x-4">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
            className="w-40"
          >
            <SelectItem value="1h">Last hour</SelectItem>
            <SelectItem value="1d">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </Select>
          <Button
            icon={ArrowPathIcon}
            variant="light"
            loading={loading}
            onClick={() => fetchAgentData()}
          >
            Refresh
          </Button>
        </Flex>
      </Flex>

      {lastUpdated && (
        <Text className="text-xs text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}

      <Card className="mb-6">
        <Flex>
          <div className="space-y-1">
            <Text>Agent ID</Text>
            <Metric>{agent.agent_id}</Metric>
          </div>
          <div className="space-y-1">
            <Text>Agent Name</Text>
            <Flex alignItems="center" className="gap-3">
              <Metric>{agent.name}</Metric>
              <StatusBadge status={agent.status} />
            </Flex>
          </div>
          <div className="space-y-1">
            <Text>Type</Text>
            <Metric>{agent.type}</Metric>
          </div>
          <div className="space-y-1">
            <Text>Last Updated</Text>
            <Metric>{formatTimestamp(agent.updated_at)}</Metric>
          </div>
            <div className="space-y-1">
              <Text>Created</Text>
              <Metric>{formatTimestamp(agent.created_at)}</Metric>
            </div>
        </Flex>
        
        {agent.description && (
          <Text className="mt-4">{agent.description}</Text>
        )}
      </Card>

      {/* Key Metrics Cards */}
      <Grid numItemsMd={4} className="gap-6 mb-6">
        {dashboardMetrics.slice(0, 4).map((metric) => (
          <Card key={metric.metric}>
          <div className="h-28">
            <Flex justifyContent="start" className="space-x-1">
                <Text>{formatMetricName(metric.metric)}</Text>
                {metric.metric.includes('llm') && <BoltIcon className="h-5 w-5 text-blue-500" />}
                {metric.metric.includes('tool') && <CpuChipIcon className="h-5 w-5 text-indigo-500" />}
                {metric.metric.includes('error') && <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />}
                {metric.metric.includes('session') && <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-500" />}
            </Flex>
              <Metric>{formatMetricValue(metric.metric, metric.value)}</Metric>
              <Flex className="mt-1">
                <Text className={`text-xs ${metric.trend === 'up' 
                  ? (metric.metric.includes('error') ? 'text-red-500' : 'text-green-500') 
                  : (metric.metric.includes('error') ? 'text-green-500' : 'text-red-500')}`}>
                  {metric.trend === 'up' ? '↑' : '↓'} {Math.abs(metric.change).toFixed(1)}%
                </Text>
            </Flex>
          </div>
        </Card>
        ))}
      </Grid>

      <TabGroup className="mt-6">
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>LLM Usage</Tab>
          <Tab>Tool Usage</Tab>
          <Tab>Sessions & Traces</Tab>
          <Tab>Security Alerts</Tab>
          <Tab>Configuration</Tab>
        </TabList>
        <TabPanels>
          {/* Dashboard Tab */}
          <TabPanel>
            <Grid numItemsMd={2} className="gap-6 mt-6">
              {/* All Metrics */}
              <Card>
                <Title>Agent Metrics</Title>
                <div className="mt-4 space-y-2">
                  {dashboardMetrics.map((metric) => (
                    <Flex key={metric.metric} justifyContent="between" className="border-b border-gray-200 pb-2">
                      <Text>{formatMetricName(metric.metric)}</Text>
                      <Flex className="items-center gap-2">
                        <Text className="font-medium">{formatMetricValue(metric.metric, metric.value)}</Text>
                        <Text className={`text-xs ${metric.trend === 'up' 
                          ? (metric.metric.includes('error') ? 'text-red-500' : 'text-green-500') 
                          : (metric.metric.includes('error') ? 'text-green-500' : 'text-red-500')}`}>
                          {metric.trend === 'up' ? '↑' : '↓'} {Math.abs(metric.change).toFixed(1)}%
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </div>
              </Card>
              
              {/* LLM Usage Summary */}
              <Card>
                <Title>LLM Usage Summary</Title>
                {llmUsage.length === 0 ? (
                  <Text className="mt-4">No LLM usage data available.</Text>
                ) : (
                  <div className="mt-4">
                    <Flex justifyContent="between" className="border-b border-gray-200 pb-2">
                      <Text className="font-medium">Model</Text>
                      <Text className="font-medium">Requests</Text>
                      <Text className="font-medium">Tokens</Text>
                      <Text className="font-medium">Cost</Text>
                    </Flex>
                    <div className="space-y-2 mt-2 max-h-64 overflow-auto">
                      {llmUsage.map((model) => (
                        <Flex key={model.model} justifyContent="between" className="py-1 border-b border-gray-100">
                          <Text>{model.model}</Text>
                          <Text>{model.request_count.toLocaleString()}</Text>
                          <Text>{model.total_tokens.toLocaleString()}</Text>
                          <Text>${model.estimated_cost.toFixed(2)}</Text>
                        </Flex>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 text-right">
                  <Link href="#" onClick={(e) => {
                    e.preventDefault();
                    const tabElement = document.querySelectorAll('[role="tab"]')[1];
                    if (tabElement instanceof HTMLElement) {
                      tabElement.click();
                    }
                  }} className="text-blue-500 hover:text-blue-700">
                    View all LLM usage details
                  </Link>
                </div>
              </Card>
              
              {/* Tool Usage Summary */}
              <Card>
                <Title>Top Tools</Title>
                {toolUsage.length === 0 ? (
                  <Text className="mt-4">No tool usage data available.</Text>
                ) : (
                  <SimpleDonutChart
                    className="mt-6 h-64"
                    data={toolUsage.slice(0, 5).map(tool => ({ 
                      name: tool.tool_name, 
                      count: tool.execution_count 
                    }))}
                    valueFormatter={(value) => `${value.toLocaleString()} executions`}
                    colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
                  />
                )}
                <div className="mt-4 text-right">
                  <Link href="#" onClick={(e) => {
                    e.preventDefault();
                    const tabElement = document.querySelectorAll('[role="tab"]')[2];
                    if (tabElement instanceof HTMLElement) {
                      tabElement.click();
                    }
                  }} className="text-blue-500 hover:text-blue-700">
                    View all tool usage details
                  </Link>
                </div>
                  </Card>
              
              {/* Security Alerts Summary */}
              <Card>
                <Title>Security Alerts</Title>
                {alerts.length === 0 ? (
                  <Text className="mt-4">No security alerts found.</Text>
                ) : (
                  <div className="mt-4">
                    <Flex justifyContent="between" className="border-b border-gray-200 pb-2">
                      <Text className="font-medium">Severity</Text>
                      <Text className="font-medium">Type</Text>
                      <Text className="font-medium">Time</Text>
                    </Flex>
                    <div className="space-y-2 mt-2 max-h-64 overflow-auto">
                      {alerts.map((alert) => (
                        <Flex key={alert.alert_id} justifyContent="between" className="py-1 border-b border-gray-100">
                          <Badge color={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <Text>{alert.type}</Text>
                          <Text>{formatTimestamp(alert.timestamp)}</Text>
                        </Flex>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 text-right">
                  <Link href="#" onClick={(e) => {
                    e.preventDefault();
                    const tabElement = document.querySelectorAll('[role="tab"]')[4];
                    if (tabElement instanceof HTMLElement) {
                      tabElement.click();
                    }
                  }} className="text-blue-500 hover:text-blue-700">
                    View all security alerts
                  </Link>
                </div>
              </Card>
            </Grid>
          </TabPanel>
          
          {/* LLM Usage Tab */}
          <TabPanel>
            <Grid numItemsMd={1} className="gap-6 mt-6">
              <Card>
                <Title>LLM Usage by Model</Title>
                {llmUsage.length === 0 ? (
                  <Text className="mt-4">No LLM usage data available.</Text>
                ) : (
                  <Table className="mt-4">
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
                      {llmUsage.map((model) => (
                        <TableRow key={model.model}>
                          <TableCell>{model.model}</TableCell>
                          <TableCell>{model.vendor}</TableCell>
                          <TableCell>{model.request_count.toLocaleString()}</TableCell>
                          <TableCell>{model.input_tokens.toLocaleString()}</TableCell>
                          <TableCell>{model.output_tokens.toLocaleString()}</TableCell>
                          <TableCell>{model.total_tokens.toLocaleString()}</TableCell>
                          <TableCell>${model.estimated_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
              
              <Card>
                <Title>Recent LLM Requests</Title>
                {recentLLMRequests.length === 0 ? (
                  <Text className="mt-4">No recent LLM requests found.</Text>
                ) : (
                  <Table className="mt-4">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Time</TableHeaderCell>
                        <TableHeaderCell>Model</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Tokens (In/Out)</TableHeaderCell>
                        <TableHeaderCell>Duration</TableHeaderCell>
                        <TableHeaderCell>Prompt</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentLLMRequests.map((req) => (
                        <TableRow key={req.request_id}>
                          <TableCell>{formatTimestamp(req.timestamp)}</TableCell>
                          <TableCell>{req.model}</TableCell>
                          <TableCell>
                            <StatusBadge status={req.status} />
                          </TableCell>
                          <TableCell>{req.input_tokens.toLocaleString()} / {req.output_tokens.toLocaleString()}</TableCell>
                          <TableCell>{req.duration_ms} ms</TableCell>
                          <TableCell className="max-w-xs truncate" title={req.prompt_summary}>
                            {req.prompt_summary}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 text-right">
                  <Link href={`/llm?agentId=${agent.agent_id}`} className="text-blue-500 hover:text-blue-700">
                    View all LLM requests
                  </Link>
                </div>
              </Card>
            </Grid>
          </TabPanel>
          
          {/* Tool Usage Tab */}
          <TabPanel>
            <Grid numItemsMd={1} className="gap-6 mt-6">
              <Card>
                <Title>Tool Usage Overview</Title>
                {toolUsage.length === 0 ? (
                  <Text className="mt-4">No tool usage data available.</Text>
                ) : (
                  <Table className="mt-4">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Tool Name</TableHeaderCell>
                        <TableHeaderCell>Category</TableHeaderCell>
                        <TableHeaderCell>Executions</TableHeaderCell>
                        <TableHeaderCell>Success Rate</TableHeaderCell>
                        <TableHeaderCell>Errors</TableHeaderCell>
                        <TableHeaderCell>Avg Duration</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {toolUsage.map((tool) => (
                        <TableRow key={tool.tool_name}>
                          <TableCell>{tool.tool_name}</TableCell>
                          <TableCell>{tool.category}</TableCell>
                          <TableCell>{tool.execution_count.toLocaleString()}</TableCell>
                          <TableCell>{(tool.success_rate * 100).toFixed(1)}%</TableCell>
                          <TableCell>{tool.error_count.toLocaleString()}</TableCell>
                          <TableCell>{tool.avg_duration_ms} ms</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
              
              <Card>
                <Title>Recent Tool Executions</Title>
                {recentToolExecutions.length === 0 ? (
                  <Text className="mt-4">No recent tool executions found.</Text>
                ) : (
                  <Table className="mt-4">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Time</TableHeaderCell>
                        <TableHeaderCell>Tool</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Duration</TableHeaderCell>
                        <TableHeaderCell>Parameters</TableHeaderCell>
                        <TableHeaderCell>Result</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentToolExecutions.map((exec) => (
                        <TableRow key={exec.execution_id}>
                          <TableCell>{formatTimestamp(exec.timestamp)}</TableCell>
                          <TableCell>{exec.tool_name}</TableCell>
                          <TableCell>
                            <StatusBadge status={exec.status} />
                          </TableCell>
                          <TableCell>{exec.duration_ms} ms</TableCell>
                          <TableCell className="max-w-xs truncate" title={JSON.stringify(exec.parameters)}>
                            {JSON.stringify(exec.parameters).slice(0, 30)}...
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={exec.result_summary}>
                            {exec.result_summary}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 text-right">
                  <Link href={`/tools?agentId=${agent.agent_id}`} className="text-blue-500 hover:text-blue-700">
                    View all tool executions
                  </Link>
                </div>
                  </Card>
                </Grid>
          </TabPanel>
          
          {/* Sessions & Traces Tab */}
          <TabPanel>
            <Grid numItemsMd={1} className="gap-6 mt-6">
              <Card>
                <Title>Recent Sessions</Title>
                {sessions.length === 0 ? (
                  <Text className="mt-4">No sessions found for this agent.</Text>
                ) : (
                  <Table className="mt-4">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Session ID</TableHeaderCell>
                        <TableHeaderCell>Start Time</TableHeaderCell>
                        <TableHeaderCell>Duration</TableHeaderCell>
                        <TableHeaderCell>Events</TableHeaderCell>
                        <TableHeaderCell>LLM Requests</TableHeaderCell>
                        <TableHeaderCell>Tool Executions</TableHeaderCell>
                        <TableHeaderCell>Errors</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.session_id}>
                          <TableCell>{session.session_id}</TableCell>
                          <TableCell>{formatTimestamp(session.start_time)}</TableCell>
                          <TableCell>{session.duration_seconds} sec</TableCell>
                          <TableCell>{session.event_count}</TableCell>
                          <TableCell>{session.llm_request_count}</TableCell>
                          <TableCell>{session.tool_execution_count}</TableCell>
                          <TableCell>{session.error_count}</TableCell>
                          <TableCell>
                            <StatusBadge status={session.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 text-right">
                  <Link href={`/sessions?agentId=${agent.agent_id}`} className="text-blue-500 hover:text-blue-700">
                    View all sessions
                  </Link>
                </div>
                </Card>
              
              <Card>
                <Title>Recent Traces</Title>
                {traces.length === 0 ? (
                  <Text className="mt-4">No traces found for this agent.</Text>
                ) : (
                  <Table className="mt-4">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Trace ID</TableHeaderCell>
                        <TableHeaderCell>Start Time</TableHeaderCell>
                        <TableHeaderCell>Duration</TableHeaderCell>
                        <TableHeaderCell>Events</TableHeaderCell>
                        <TableHeaderCell>Initial Event</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {traces.map((trace) => (
                        <TableRow key={trace.trace_id}>
                          <TableCell>{trace.trace_id}</TableCell>
                          <TableCell>{formatTimestamp(trace.start_time)}</TableCell>
                          <TableCell>{trace.duration_ms} ms</TableCell>
                          <TableCell>{trace.event_count}</TableCell>
                          <TableCell>{trace.initial_event_type}</TableCell>
                          <TableCell>
                            <StatusBadge status={trace.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 text-right">
                  <Link href={`/traces?agentId=${agent.agent_id}`} className="text-blue-500 hover:text-blue-700">
                    View all traces
                  </Link>
                </div>
              </Card>
            </Grid>
          </TabPanel>
          
          {/* Security Alerts Tab */}
          <TabPanel>
            <Card className="mt-6">
              <Title>Security Alerts</Title>
              {alerts.length === 0 ? (
                <Text className="mt-4">No security alerts found for this agent.</Text>
              ) : (
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Alert ID</TableHeaderCell>
                      <TableHeaderCell>Timestamp</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Severity</TableHeaderCell>
                      <TableHeaderCell>Description</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Event ID</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.alert_id}>
                        <TableCell>{alert.alert_id}</TableCell>
                        <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                        <TableCell>{alert.type}</TableCell>
                        <TableCell>
                          <Badge color={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={alert.description}>
                          {alert.description}
                        </TableCell>
                        <TableCell>
                          <Badge color={alert.status === 'resolved' ? 'green' : 'red'}>
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/events/${alert.related_event_id}`} className="text-blue-500 hover:text-blue-700">
                            {alert.related_event_id}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 text-right">
                <Link href={`/alerts?agentId=${agent.agent_id}`} className="text-blue-500 hover:text-blue-700">
                  View all security alerts
                </Link>
              </div>
            </Card>
          </TabPanel>
          
          {/* Configuration Tab */}
          <TabPanel>
            <Card className="mt-6">
              <Title>Agent Configuration</Title>
              {agent.configuration ? (
                <pre className="mt-4 bg-gray-50 p-4 rounded overflow-auto">
                  {JSON.stringify(agent.configuration, null, 2)}
                </pre>
              ) : (
                <Text className="mt-4">No configuration data available.</Text>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 