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
} from '@tremor/react';
import { 
  FaChevronLeft, 
  FaServer, 
  FaInfoCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaSync,
  FaPlay,
  FaStop,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronRight
} from 'react-icons/fa';
import Link from 'next/link';
import { SimpleDonutChart } from './SimpleDonutChart';
import { StableChartContainer } from './StableChartContainer';
import { useApiRequest } from '@/hooks/useApiRequest';
import { AgentService } from '@/lib/api/services';
import { Agent } from '@/types/api';
import { EnhancedApiError } from '@/lib/api/client';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorDisplay } from '@/components/ui/error-display';

type AgentDetailProps = {
  agentId: string;
};

type AgentMetrics = {
  total_sessions: number;
  total_conversations: number;
  total_events: number;
  llm_calls: number;
  tool_calls: number;
  security_alerts: number;
};

type EventData = {
  id: number;
  timestamp: string;
  event_type: string;
  agent_id: number;
  session_id?: number;
  conversation_id?: number;
  status?: string;
};

type ChartDataPoint = {
  hour: string;
  avg_response_time: number;
};

type EventTypeDistribution = {
  type: string;
  count: number;
};

export function AgentDetail({ agentId }: AgentDetailProps) {
  const [recentEvents, setRecentEvents] = useState<EventData[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<ChartDataPoint[]>([]);
  const [eventTypeDistribution, setEventTypeDistribution] = useState<EventTypeDistribution[]>([]);
  const [refreshInterval] = useState<number>(30000); // 30 seconds by default
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch agent data
  const { 
    data: agent, 
    loading: agentLoading, 
    error: agentError, 
    execute: fetchAgent 
  } = useApiRequest(() => AgentService.getById(agentId), { immediate: true });

  // Fetch agent metrics
  const { 
    data: metrics, 
    loading: metricsLoading, 
    error: metricsError, 
    execute: fetchMetrics 
  } = useApiRequest(() => AgentService.getMetrics(agentId), { immediate: true });

  // Set up polling for real-time updates
  useEffect(() => {
    if (refreshInterval === 0) return; // No refresh

    const intervalId = setInterval(() => {
      fetchAgent();
      fetchMetrics();
      setLastUpdated(new Date());
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchAgent, fetchMetrics]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAgent();
    fetchMetrics();
    setLastUpdated(new Date());
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: string | Date) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Status badge component
  const StatusBadge = ({ active }: { active: boolean }) => {
    return active ? 
      <Badge color="green">Active</Badge> : 
      <Badge color="gray">Inactive</Badge>;
  };

  // Get a friendly name for event types
  const getEventTypeName = (type: string) => {
    const eventTypes: Record<string, string> = {
      'llm_request': 'LLM Request',
      'llm_response': 'LLM Response',
      'tool_call': 'Tool Call',
      'tool_response': 'Tool Response',
      'user_message': 'User Message',
      'agent_message': 'Agent Message',
      'session_start': 'Session Start',
      'session_end': 'Session End',
      'error': 'Error',
    };
    
    return eventTypes[type.toLowerCase()] || type;
  };

  const loading = agentLoading || metricsLoading;
  const error = agentError || metricsError;

  if (loading && !agent) {
    return (
      <div className="p-6">
        <Card className="h-96">
          <LoadingState message="Loading agent details..." />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="h-96 flex flex-col items-center justify-center">
          <ErrorDisplay 
            error={error as EnhancedApiError} 
            onRetry={handleRefresh}
            className="mb-4"
          />
          <Link href="/agents">
            <Button icon={FaChevronLeft}>Back to Agents</Button>
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
            <Button icon={FaChevronLeft}>Back to Agents</Button>
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
            <Button variant="light" icon={FaChevronLeft}>
              Back
            </Button>
          </Link>
          <Title>Agent: {agent.name}</Title>
          <Badge color="blue" size="lg">ID: {agent.agent_id}</Badge>
        </Flex>
        <Flex justifyContent="end" className="space-x-4">
          <Button
            icon={FaSync}
            variant="light"
            loading={loading}
            onClick={handleRefresh}
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
        <Grid numItemsMd={3} className="gap-6">
          <div>
            <Flex>
              <Text>Status</Text>
              <StatusBadge active={agent.active} />
            </Flex>
          </div>
          <div>
            <Flex>
              <Text>Version</Text>
              <Text>{agent.version}</Text>
            </Flex>
          </div>
          <div>
            <Flex>
              <Text>Last Active</Text>
              <Text>{formatTimestamp(agent.last_active)}</Text>
            </Flex>
          </div>
          <div>
            <Flex>
              <Text>Created</Text>
              <Text>{formatTimestamp(agent.creation_time)}</Text>
            </Flex>
          </div>
          <div className="col-span-2">
            <Text>Description</Text>
            <Text>{agent.description}</Text>
          </div>
        </Grid>
      </Card>

      {metrics && (
        <Grid numItemsMd={3} className="gap-6 mb-6">
          <Card>
            <Flex className="h-16 items-center gap-2">
              <FaInfoCircle className="h-8 w-8 text-blue-500" />
              <div>
                <Text>Conversations</Text>
                <Metric>{metrics.total_conversations.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
          <Card>
            <Flex className="h-16 items-center gap-2">
              <FaClock className="h-8 w-8 text-blue-500" />
              <div>
                <Text>Sessions</Text>
                <Metric>{metrics.total_sessions.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
          <Card>
            <Flex className="h-16 items-center gap-2">
              <FaServer className="h-8 w-8 text-blue-500" />
              <div>
                <Text>Total Events</Text>
                <Metric>{metrics.total_events.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
          <Card>
            <Flex className="h-16 items-center gap-2">
              <FaServer className="h-8 w-8 text-blue-500" />
              <div>
                <Text>LLM Calls</Text>
                <Metric>{metrics.llm_calls.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
          <Card>
            <Flex className="h-16 items-center gap-2">
              <FaServer className="h-8 w-8 text-blue-500" />
              <div>
                <Text>Tool Calls</Text>
                <Metric>{metrics.tool_calls.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
          <Card>
            <Flex className="h-16 items-center gap-2">
              <FaInfoCircle className="h-8 w-8 text-blue-500" />
              <div>
                <Text>Security Alerts</Text>
                <Metric>{metrics.security_alerts.toLocaleString()}</Metric>
              </div>
            </Flex>
          </Card>
        </Grid>
      )}

      <TabGroup className="mt-6">
        <TabList>
          <Tab>Activity</Tab>
          <Tab>Response Times</Tab>
          <Tab>Event Types</Tab>
          <Tab>Configuration</Tab>
          <Tab>Raw Data</Tab>
        </TabList>
        <TabPanels>
          {/* Activity Tab */}
          <TabPanel>
            <Card>
              <Title>Recent Events</Title>
              {recentEvents.length === 0 ? (
                <Text>No recent events</Text>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Time</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Session</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                        <TableCell>{getEventTypeName(event.event_type)}</TableCell>
                        <TableCell>{event.session_id ? `#${event.session_id}` : '-'}</TableCell>
                        <TableCell>
                          {event.status === 'success' ? (
                            <FaCheckCircle className="h-5 w-5 text-green-500" />
                          ) : event.status === 'error' ? (
                            <FaTimesCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Badge>{event.status || 'N/A'}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="xs"
                            variant="light"
                            icon={FaChevronRight}
                            onClick={() => {
                              // View event details
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabPanel>

          {/* Response Time Tab */}
          <TabPanel>
            <Card>
              <Title>Response Time Trend</Title>
              <StableChartContainer className="h-72 mt-4">
                <AreaChart
                  data={responseTimeData}
                  index="date"
                  categories={["avgResponseTime"]}
                  colors={["blue"]}
                  valueFormatter={(value) => `${value.toFixed(0)}ms`}
                />
              </StableChartContainer>
            </Card>
          </TabPanel>

          {/* Event Types Tab */}
          <TabPanel>
            <Card>
              <Title>Event Type Distribution</Title>
              <Grid numItemsMd={2} className="mt-4 gap-6">
                <StableChartContainer className="h-72">
                  <SimpleDonutChart
                    data={eventTypeDistribution.map(item => ({
                      name: item.type,
                      count: item.count
                    }))}
                    valueFormatter={(value) => `${value} events`}
                  />
                </StableChartContainer>
                <StableChartContainer className="h-72">
                  <BarChart
                    data={eventTypeDistribution}
                    index="type"
                    categories={["count"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value} events`}
                  />
                </StableChartContainer>
              </Grid>
            </Card>
          </TabPanel>

          {/* Configuration Tab */}
          <TabPanel>
            <Card>
              <Flex alignItems="center" className="gap-2 mb-4">
                <FaEdit className="h-5 w-5 text-gray-500" />
                <Title>Agent Configuration</Title>
              </Flex>
              <div className="p-4 rounded-md bg-gray-50 mt-2 font-mono text-sm text-gray-800 whitespace-pre overflow-auto max-h-96">
                <code>
                  {JSON.stringify(
                    {
                      id: agent.agent_id,
                      name: agent.name,
                      description: agent.description,
                      version: agent.version,
                      active: agent.active
                    },
                    null,
                    2
                  )}
                </code>
              </div>
            </Card>
          </TabPanel>

          {/* Raw Data Tab */}
          <TabPanel>
            <Card>
              <Flex alignItems="center" className="gap-2 mb-4">
                <FaServer className="h-5 w-5 text-gray-500" />
                <Title>Raw Agent Data</Title>
              </Flex>
              <div className="p-4 rounded-md bg-gray-50 mt-2 font-mono text-sm text-gray-800 whitespace-pre overflow-auto max-h-96">
                <code>
                  {JSON.stringify(agent, null, 2)}
                </code>
              </div>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 