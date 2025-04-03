'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Flex,
  Badge,
  Divider,
  Button,
  Grid,
  List,
  ListItem,
  Metric,
  AreaChart,
} from '@tremor/react';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CommandLineIcon,
  BoltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { CodeBlock } from './CodeBlock';

// Define types based on new API
type Session = {
  session_id: string;
  agent_id: string;
  agent_name: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  status: string;
  metadata: Record<string, any>;
  stats: {
    message_count: number;
    llm_request_count: number;
    token_usage: number;
    tool_execution_count: number;
  };
};

type Message = {
  message_id: string;
  timestamp: string;
  role: string;
  content: string;
  metadata?: Record<string, any>;
};

type Event = {
  event_id: string;
  timestamp: string;
  type: string; 
  agent_id: string;
  agent_name: string;
  session_id: string;
  trace_id: string;
  source: string;
  metadata: Record<string, any>;
  event_data: Record<string, any>;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type EventsResponse = {
  items: Event[];
  pagination: PaginationInfo;
  meta: {
    time_period: string;
    from_time: string;
    to_time: string;
  };
};

type MessagesResponse = {
  items: Message[];
  pagination: PaginationInfo;
};

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Token usage over time data
  const [tokenUsageData, setTokenUsageData] = useState<{ date: string; value: number }[]>([]);

  // Function to fetch session data
  const fetchSessionData = async () => {
    try {
      setLoading(true);

      // Fetch session details
      const response = await fetch(`/v1/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }

      const sessionData = await response.json();
      setSession(sessionData);

      // Fetch messages for this session
      const messagesResponse = await fetch(`/v1/sessions/${sessionId}/messages?page=1&page_size=50`);
      
      if (messagesResponse.ok) {
        const messagesData: MessagesResponse = await messagesResponse.json();
        setMessages(messagesData.items || []);
      }

      // Fetch events for this session
      const eventsResponse = await fetch(`/v1/events?session_id=${sessionId}&page=1&page_size=50`);
      
      if (eventsResponse.ok) {
        const eventsData: EventsResponse = await eventsResponse.json();
        setEvents(eventsData.items || []);
        
        // Create token usage timeline if we have LLM request events
        const llmEvents = eventsData.items
          .filter(event => event.type === 'llm_request' || event.type === 'llm_response')
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        if (llmEvents.length > 0) {
          const tokenData = llmEvents.map(event => {
            const timestamp = new Date(event.timestamp);
            const tokens = event.event_data?.token_count || 
                          event.event_data?.usage?.total_tokens || 0;
            
            return {
              date: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              value: tokens
            };
          });
          
          setTokenUsageData(tokenData);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError('Failed to load session data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format duration in seconds to a human-readable string
  const formatDuration = (seconds?: number) => {
    if (seconds === undefined) return 'In progress';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds} seconds`;
    } else if (minutes === 1) {
      return `${minutes} minute ${remainingSeconds} seconds`;
    } else {
      return `${minutes} minutes ${remainingSeconds} seconds`;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'error':
        return 'red';
      case 'terminated':
        return 'amber';
      default:
        return 'gray';
    }
  };

  // Get event type display name
  const getEventTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'message': 'Message',
      'user_message': 'User Message',
      'assistant_message': 'Assistant Message',
      'llm_request': 'LLM Request',
      'llm_response': 'LLM Response',
      'tool_execution': 'Tool Execution',
      'tool_response': 'Tool Response',
      'session_start': 'Session Start',
      'session_end': 'Session End',
      'error': 'Error',
      'trace_start': 'Trace Start',
      'trace_end': 'Trace End'
    };
    
    return typeMap[type] || type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format JSON with syntax highlighting
  const formatJson = (data: any) => {
    return <CodeBlock code={JSON.stringify(data, null, 2)} language="json" />;
  };

  // Show loading state
  if (loading) {
    return (
      <Card className="mt-6">
        <Flex className="items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mr-3"></div>
          <Text>Loading session data...</Text>
        </Flex>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="mt-6">
        <Flex className="items-center justify-center flex-col py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-amber-500 mb-4" />
          <Title className="mb-2">Error Loading Session</Title>
          <Text>{error}</Text>
          <Button 
            className="mt-4" 
            onClick={fetchSessionData} 
            icon={ArrowPathIcon}
          >
            Retry
          </Button>
        </Flex>
      </Card>
    );
  }

  // Show not found state
  if (!session) {
    return (
      <Card className="mt-6">
        <Flex className="items-center justify-center flex-col py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-4" />
          <Title className="mb-2">Session Not Found</Title>
          <Text>The session with ID {sessionId} does not exist or has been deleted.</Text>
          <Link href="/sessions" className="mt-4">
            <Button icon={ArrowLeftIcon}>Back to Sessions</Button>
          </Link>
        </Flex>
      </Card>
    );
  }

  return (
    <div className="p-6">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <Flex alignItems="center" className="gap-2">
          <Link href="/sessions">
            <Button variant="light" icon={ArrowLeftIcon}>
              Back to Sessions
            </Button>
          </Link>
          <Title>Session Details</Title>
        </Flex>
        <Flex className="gap-2">
          <Button
            variant="light"
            icon={ArrowPathIcon}
            onClick={fetchSessionData}
          >
            Refresh
          </Button>
          <Badge color={getStatusColor(session.status)} size="lg">
            {session.status}
          </Badge>
        </Flex>
      </Flex>

      {/* Session Summary Card */}
      <Card className="mb-6">
        <Grid numItemsMd={2} className="gap-6">
          <div>
            <Text className="text-gray-500">Session ID</Text>
            <Text className="font-medium">{session.session_id}</Text>
          </div>
          <div>
            <Text className="text-gray-500">Agent</Text>
            <Link href={`/agents/${session.agent_id}`} className="text-blue-500 hover:text-blue-700">
              {session.agent_name}
            </Link>
          </div>
          <div>
            <Text className="text-gray-500">Start Time</Text>
            <Text className="font-medium">{formatTimestamp(session.start_time)}</Text>
          </div>
          <div>
            <Text className="text-gray-500">End Time</Text>
            <Text className="font-medium">{session.end_time ? formatTimestamp(session.end_time) : 'Session in progress'}</Text>
          </div>
          <div>
            <Text className="text-gray-500">Duration</Text>
            <Text className="font-medium">{formatDuration(session.duration)}</Text>
          </div>
          <div>
            <Text className="text-gray-500">Status</Text>
            <Badge color={getStatusColor(session.status)}>{session.status}</Badge>
          </div>
        </Grid>

        <Divider className="my-6" />
        
        {/* Session Stats */}
        <Title className="mb-4">Session Statistics</Title>
        <Grid numItemsMd={4} className="gap-4">
          <Card decoration="top" decorationColor="blue">
            <Flex justifyContent="start" className="gap-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />
              <div>
                <Text>Messages</Text>
                <Metric>{session.stats.message_count}</Metric>
              </div>
            </Flex>
          </Card>
          <Card decoration="top" decorationColor="indigo">
            <Flex justifyContent="start" className="gap-2">
              <ClockIcon className="h-6 w-6 text-indigo-500" />
              <div>
                <Text>LLM Requests</Text>
                <Metric>{session.stats.llm_request_count}</Metric>
              </div>
            </Flex>
          </Card>
          <Card decoration="top" decorationColor="purple">
            <Flex justifyContent="start" className="gap-2">
              <CommandLineIcon className="h-6 w-6 text-purple-500" />
              <div>
                <Text>Token Usage</Text>
                <Metric>{session.stats.token_usage}</Metric>
              </div>
            </Flex>
          </Card>
          <Card decoration="top" decorationColor="cyan">
            <Flex justifyContent="start" className="gap-2">
              <BoltIcon className="h-6 w-6 text-cyan-500" />
              <div>
                <Text>Tool Executions</Text>
                <Metric>{session.stats.tool_execution_count}</Metric>
              </div>
            </Flex>
          </Card>
        </Grid>
        
        {tokenUsageData.length > 0 && (
          <div className="mt-6">
            <Title className="mb-2">Token Usage Over Time</Title>
            <AreaChart
              className="h-64"
              data={tokenUsageData}
              index="date"
              categories={["value"]}
              colors={["purple"]}
              valueFormatter={(value) => `${value} tokens`}
              showLegend={false}
            />
          </div>
        )}
      </Card>

      {/* Session Details Tabs */}
      <TabGroup onIndexChange={setActiveTab} index={activeTab}>
        <TabList>
          <Tab>Conversation</Tab>
          <Tab>Events</Tab>
          <Tab>Metadata</Tab>
        </TabList>
        <TabPanels>
          {/* Conversation Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Conversation</Title>
              <div className="mt-4 space-y-4">
                {messages.length === 0 ? (
                  <Text className="italic">No messages found for this session.</Text>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.message_id} 
                      className={`p-4 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-gray-100 ml-10' 
                          : 'bg-blue-50 mr-10'
                      }`}
                    >
                      <Flex className="gap-2 mb-2">
                        <Badge color={message.role === 'user' ? 'gray' : 'blue'}>
                          {message.role === 'user' ? 'User' : 'Assistant'}
                        </Badge>
                        <Text className="text-sm text-gray-500">
                          {formatTimestamp(message.timestamp)}
                        </Text>
                      </Flex>
                      <Text className="whitespace-pre-wrap">{message.content}</Text>
                      {message.metadata && Object.keys(message.metadata).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <Text className="text-sm text-gray-500 mb-1">Metadata</Text>
                          <div className="text-xs">
                            {formatJson(message.metadata)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabPanel>

          {/* Events Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Session Events</Title>
              <div className="mt-4">
                {events.length === 0 ? (
                  <Text className="italic">No events found for this session.</Text>
                ) : (
                  <List>
                    {events.map((event) => (
                      <ListItem key={event.event_id}>
                        <Flex className="justify-between items-start">
                          <div>
                            <Flex className="gap-2 items-center">
                              <Badge>{getEventTypeDisplay(event.type)}</Badge>
                              <Text>{formatTimestamp(event.timestamp)}</Text>
                            </Flex>
                            <Text className="text-sm text-gray-500 mt-1">
                              Event ID: {event.event_id}
                            </Text>
                          </div>
                          <Button
                            variant="light"
                            size="xs"
                            icon={EyeIcon}
                            onClick={() => window.open(`/events/${event.event_id}`, '_blank')}
                          >
                            View
                          </Button>
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                )}
              </div>
            </Card>
          </TabPanel>

          {/* Metadata Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Session Metadata</Title>
              {Object.keys(session.metadata || {}).length === 0 ? (
                <Text className="mt-2 italic">No metadata available</Text>
              ) : (
                <div className="mt-4 overflow-auto">{formatJson(session.metadata)}</div>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 