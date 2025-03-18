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
  ArrowPathIcon, 
  ArrowLeftIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

type AgentDetailProps = {
  agentId: string;
};

type AgentData = {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'error';
  type: string;
  last_active: string;
  created_at?: string;
  description?: string;
  version?: string;
  config?: Record<string, unknown>;
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
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventData[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<ChartDataPoint[]>([]);
  const [eventTypeDistribution, setEventTypeDistribution] = useState<EventTypeDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval] = useState<number>(30000); // 30 seconds by default
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAgentDetails = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/agents/${agentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Agent not found');
        }
        throw new Error('Failed to fetch agent details');
      }
      
      const data = await response.json();
      
      setAgent(data.agent);
      setMetrics(data.metrics);
      setRecentEvents(data.recentEvents);
      setResponseTimeData(data.responseTimeData);
      setEventTypeDistribution(data.eventTypeDistribution);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching agent details:', err);
      setError(`${err instanceof Error ? err.message : 'Failed to load agent details'}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAgentDetails();
  }, [agentId, fetchAgentDetails]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (refreshInterval === 0) return; // No refresh

    const intervalId = setInterval(() => {
      fetchAgentDetails();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, agentId, fetchAgentDetails]);

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <Badge color="green">Active</Badge>;
      case 'inactive':
        return <Badge color="gray">Inactive</Badge>;
      case 'error':
        return <Badge color="red">Error</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
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
          <Title>Agent #{agent.id}: {agent.name}</Title>
          <Badge color="blue" size="lg">ID: {agent.id}</Badge>
        </Flex>
        <Flex justifyContent="end" className="space-x-4">
          <Button
            icon={ArrowPathIcon}
            variant="light"
            loading={loading}
            onClick={() => fetchAgentDetails()}
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
            <Metric>#{agent.id}</Metric>
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
            <Text>Last Active</Text>
            <Metric>{formatTimestamp(agent.last_active)}</Metric>
          </div>
          {agent.created_at && (
            <div className="space-y-1">
              <Text>Created</Text>
              <Metric>{formatTimestamp(agent.created_at)}</Metric>
            </div>
          )}
        </Flex>
        
        {agent.description && (
          <Text className="mt-4">{agent.description}</Text>
        )}
      </Card>

      <Grid numItemsMd={3} className="gap-6 mb-6">
        <Card>
          <div className="h-28">
            <Flex justifyContent="start" className="space-x-1">
              <Text>Sessions</Text>
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
            </Flex>
            <Metric>{metrics?.total_sessions || 0}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Flex justifyContent="start" className="space-x-1">
              <Text>Conversations</Text>
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
            </Flex>
            <Metric>{metrics?.total_conversations || 0}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Flex justifyContent="start" className="space-x-1">
              <Text>Events</Text>
              <ClockIcon className="h-5 w-5 text-gray-500" />
            </Flex>
            <Metric>{metrics?.total_events || 0}</Metric>
          </div>
        </Card>
      </Grid>

      <TabGroup className="mt-6">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Recent Events</Tab>
          <Tab>Performance</Tab>
          <Tab>Configuration</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid numItemsMd={2} className="gap-6 mt-6">
              <Card>
                <Title>Event Type Distribution</Title>
                <DonutChart
                  className="mt-6"
                  data={eventTypeDistribution}
                  category="count"
                  index="type"
                  valueFormatter={(value) => `${value.toLocaleString()} events`}
                  colors={["blue", "cyan", "indigo", "violet", "fuchsia", "pink", "rose"]}
                />
              </Card>
              <Card>
                <Title>API Call Distribution</Title>
                <Grid numItemsMd={2} className="gap-4 mt-4">
                  <Card decoration="top" decorationColor="blue">
                    <Flex justifyContent="start" className="space-x-1">
                      <Text>LLM Calls</Text>
                      <BoltIcon className="h-5 w-5 text-blue-500" />
                    </Flex>
                    <Metric className="mt-2">{metrics?.llm_calls || 0}</Metric>
                  </Card>
                  <Card decoration="top" decorationColor="indigo">
                    <Flex justifyContent="start" className="space-x-1">
                      <Text>Tool Calls</Text>
                      <CpuChipIcon className="h-5 w-5 text-indigo-500" />
                    </Flex>
                    <Metric className="mt-2">{metrics?.tool_calls || 0}</Metric>
                  </Card>
                </Grid>
                <Card className="mt-4" decoration="top" decorationColor="red">
                  <Flex justifyContent="start" className="space-x-1">
                    <Text>Security Alerts</Text>
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  </Flex>
                  <Metric className="mt-2">{metrics?.security_alerts || 0}</Metric>
                </Card>
              </Card>
            </Grid>
          </TabPanel>
          
          <TabPanel>
            <Card className="mt-6">
              <Title>Recent Events</Title>
              {recentEvents.length === 0 ? (
                <Text className="mt-4">No events found for this agent.</Text>
              ) : (
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>ID</TableHeaderCell>
                      <TableHeaderCell>Timestamp</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Session</TableHeaderCell>
                      <TableHeaderCell>Conversation</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.id}</TableCell>
                        <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                        <TableCell>{getEventTypeName(event.event_type)}</TableCell>
                        <TableCell>
                          {event.session_id ? (
                            <Link 
                              href={`/events/sessions/${event.session_id}`}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              {event.session_id}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {event.conversation_id ? (
                            <Link 
                              href={`/events/conversations/${event.conversation_id}`}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              {event.conversation_id}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {event.status ? (
                            <Badge 
                              color={event.status === 'success' ? 'green' : 
                                event.status === 'error' ? 'red' : 'gray'}
                            >
                              {event.status}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 text-right">
                <Link href={`/events?agentId=${agent.id}`} className="text-blue-500 hover:text-blue-700">
                  View all events
                </Link>
              </div>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Grid numItemsMd={1} className="gap-6 mt-6">
              <Card>
                <Title>Response Time (Last 24 Hours)</Title>
                {responseTimeData.length === 0 ? (
                  <Text className="mt-4">No response time data available.</Text>
                ) : (
                  <AreaChart
                    className="mt-4 h-80"
                    data={responseTimeData}
                    index="hour"
                    categories={["avg_response_time"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value.toFixed(0)}ms`}
                    showLegend={false}
                    curveType="natural"
                  />
                )}
              </Card>
              <Card className="mt-6">
                <Title>Event Type Distribution</Title>
                {eventTypeDistribution.length === 0 ? (
                  <Text className="mt-4">No event distribution data available.</Text>
                ) : (
                  <BarChart
                    className="mt-4 h-80"
                    data={eventTypeDistribution}
                    index="type"
                    categories={["count"]}
                    colors={["indigo"]}
                    valueFormatter={(value) => `${value} events`}
                    showLegend={false}
                  />
                )}
              </Card>
            </Grid>
          </TabPanel>
          
          <TabPanel>
            <Card className="mt-6">
              <Title>Agent Configuration</Title>
              {agent.config ? (
                <pre className="mt-4 bg-gray-50 p-4 rounded overflow-auto">
                  {JSON.stringify(agent.config, null, 2)}
                </pre>
              ) : (
                <Text className="mt-4">No configuration data available.</Text>
              )}
            </Card>
            <Card className="mt-6">
              <Title>Version Information</Title>
              <Text className="mt-2">
                Version: {agent.version || 'Unknown'}
              </Text>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 