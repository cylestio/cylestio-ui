'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableBody,
  Badge,
  Title,
  Text,
  TextInput,
  Select,
  SelectItem,
  Button,
  Flex,
  Grid,
  Metric,
  DateRangePicker,
  DateRangePickerValue,
  Divider,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@tremor/react';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CodeBlock } from '../components/CodeBlock';

// Define types
type EventData = {
  id: number;
  timestamp: string;
  type: string;
  agent_id?: number;
  agent_name?: string;
  session_id?: number;
  conversation_id?: number;
  status: string;
  duration?: number;
  details?: string;
  data?: any;
};

export function EventsDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateRangePickerValue>({ from: undefined, to: undefined });
  const [sortField, setSortField] = useState<keyof EventData>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds by default
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 25 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [agents, setAgents] = useState<{id: number, name: string}[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [isDetailView, setIsDetailView] = useState(false);

  // Function to fetch events
  const fetchEvents = useCallback(async () => {
    try {
      // Build URL with query parameters
      const url = new URL('/api/events', window.location.origin);
      
      // Add pagination
      url.searchParams.append('page', pagination.currentPage.toString());
      url.searchParams.append('pageSize', pagination.pageSize.toString());
      
      // Add filters if any
      if (searchQuery) url.searchParams.append('search', searchQuery);
      if (statusFilter !== 'all') url.searchParams.append('status', statusFilter);
      if (typeFilter !== 'all') url.searchParams.append('type', typeFilter);
      if (agentFilter !== 'all') url.searchParams.append('agentId', agentFilter);
      
      // Add date range if set
      if (dateFilter.from) {
        const fromDate = dateFilter.from.toISOString();
        url.searchParams.append('from', fromDate);
      }
      if (dateFilter.to) {
        const toDate = dateFilter.to.toISOString();
        url.searchParams.append('to', toDate);
      }
      
      // Add sorting
      url.searchParams.append('sort', sortField);
      url.searchParams.append('order', sortDirection);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.events);
      setFilteredEvents(data.events);
      
      // Update pagination based on API response
      setPagination({
        currentPage: data.pagination?.currentPage || 1,
        totalPages: data.pagination?.totalPages || 1,
        pageSize: data.pagination?.pageSize || 25
      });
      
      // Extract event types for filtering
      if (data.events && data.events.length > 0) {
        const types = Array.from(new Set(data.events.map((event: EventData) => 
          typeof event.type === 'string' ? event.type : String(event.type)
        ).filter(Boolean)));
        setEventTypes(types as string[]);
      }
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.pageSize,
    searchQuery,
    statusFilter,
    typeFilter,
    agentFilter,
    dateFilter,
    sortField,
    sortDirection
  ]);

  // Function to fetch agents for filtering
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      
      const data = await response.json();
      setAgents(data.map((agent: any) => ({ 
        id: agent.id, 
        name: agent.name || `Agent #${agent.id}` 
      })));
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchEvents();
    fetchAgents();
  }, [fetchEvents, fetchAgents]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (refreshInterval === 0) return; // No refresh

    const intervalId = setInterval(() => {
      fetchEvents();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchEvents]);

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get friendly name for event types
  const getEventTypeName = (type?: string): string => {
    if (!type) return 'Unknown';
    
    const eventTypeMap: Record<string, string> = {
      'llm_request': 'LLM Request',
      'llm_response': 'LLM Response',
      'tool_call': 'Tool Call',
      'tool_response': 'Tool Response',
      'user_message': 'User Message',
      'agent_message': 'Agent Message',
      'session_start': 'Session Start',
      'session_end': 'Session End',
      'api_call': 'API Call',
      'security_alert': 'Security Alert',
      'error': 'Error',
    };
    
    return eventTypeMap[type.toLowerCase()] || type;
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status?.toLowerCase() || '') {
      case 'success':
        return <Badge color="green">Success</Badge>;
      case 'error':
        return <Badge color="red">Error</Badge>;
      case 'warning':
        return <Badge color="amber">Warning</Badge>;
      case 'info':
        return <Badge color="blue">Info</Badge>;
      case 'pending':
        return <Badge color="indigo">Pending</Badge>;
      default:
        return <Badge color="gray">{status || 'Unknown'}</Badge>;
    }
  };

  // Handle row click to show event detail
  const handleRowClick = (event: EventData) => {
    setSelectedEvent(event);
    setIsDetailView(true);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({...pagination, currentPage: newPage});
  };

  // Handle sorting
  const handleSort = (field: keyof EventData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setAgentFilter('all');
    setDateFilter({ from: undefined, to: undefined });
  };

  // Handle back from detail view
  const handleBackFromDetail = () => {
    setIsDetailView(false);
    setSelectedEvent(null);
  };

  // JSON viewer for detailed event data
  const JsonViewer = ({data}: {data: any}) => {
    if (!data) return <Text>No data available</Text>;
    
    const jsonString = JSON.stringify(data, null, 2);
    return (
      <CodeBlock code={jsonString} language="json" />
    );
  };

  // Render the event detail view
  if (isDetailView && selectedEvent) {
    return (
      <div className="p-6 space-y-6">
        <Flex justifyContent="between" alignItems="center" className="mb-6">
          <Button 
            variant="light" 
            onClick={handleBackFromDetail}
            icon={ArrowPathIcon}
            iconPosition="left"
          >
            Back to Events List
          </Button>
          <Text>Event ID: {selectedEvent.id}</Text>
        </Flex>

        <Card>
          <Grid numItemsMd={2} className="gap-6">
            <div>
              <Title>Event Details</Title>
              <Divider />
              <div className="space-y-4 mt-4">
                <div>
                  <Text className="font-semibold">Event ID</Text>
                  <Text>{selectedEvent.id}</Text>
                </div>
                <div>
                  <Text className="font-semibold">Timestamp</Text>
                  <Text>{formatTimestamp(selectedEvent.timestamp)}</Text>
                </div>
                <div>
                  <Text className="font-semibold">Type</Text>
                  <Text>{getEventTypeName(selectedEvent.type)}</Text>
                </div>
                <div>
                  <Text className="font-semibold">Status</Text>
                  <StatusBadge status={selectedEvent.status} />
                </div>
                {selectedEvent.duration !== undefined && (
                  <div>
                    <Text className="font-semibold">Duration</Text>
                    <Text>{selectedEvent.duration} ms</Text>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Title>Related Information</Title>
              <Divider />
              <div className="space-y-4 mt-4">
                {selectedEvent.agent_id && (
                  <div>
                    <Text className="font-semibold">Agent</Text>
                    <Link href={`/agents/${selectedEvent.agent_id}`}>
                      <Text className="text-blue-500 hover:underline">
                        {selectedEvent.agent_name || `Agent #${selectedEvent.agent_id}`}
                      </Text>
                    </Link>
                  </div>
                )}
                {selectedEvent.session_id && (
                  <div>
                    <Text className="font-semibold">Session ID</Text>
                    <Text>{selectedEvent.session_id}</Text>
                  </div>
                )}
                {selectedEvent.conversation_id && (
                  <div>
                    <Text className="font-semibold">Conversation ID</Text>
                    <Text>{selectedEvent.conversation_id}</Text>
                  </div>
                )}
                {selectedEvent.details && (
                  <div>
                    <Text className="font-semibold">Details</Text>
                    <Text>{selectedEvent.details}</Text>
                  </div>
                )}
              </div>
            </div>
          </Grid>
        </Card>

        {selectedEvent.data && (
          <Card>
            <TabGroup>
              <TabList>
                <Tab>Raw Data</Tab>
                {selectedEvent.type && selectedEvent.type.toLowerCase().includes('llm') && <Tab>LLM Content</Tab>}
                {selectedEvent.type && selectedEvent.type.toLowerCase().includes('tool') && <Tab>Tool Data</Tab>}
              </TabList>
              <TabPanels>
                <TabPanel>
                  <div className="mt-4">
                    <JsonViewer data={selectedEvent.data} />
                  </div>
                </TabPanel>
                {selectedEvent.type && selectedEvent.type.toLowerCase().includes('llm') && (
                  <TabPanel>
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <Text className="whitespace-pre-wrap">
                        {selectedEvent.data?.content || selectedEvent.data?.message || 'No content available'}
                      </Text>
                    </div>
                  </TabPanel>
                )}
                {selectedEvent.type && selectedEvent.type.toLowerCase().includes('tool') && (
                  <TabPanel>
                    <div className="mt-4">
                      <Text className="font-semibold">Tool Name</Text>
                      <Text>{selectedEvent.data?.tool_name || 'Unknown'}</Text>
                      <div className="mt-4">
                        <Text className="font-semibold">Tool Input</Text>
                        <JsonViewer data={selectedEvent.data?.input || {}} />
                      </div>
                      {selectedEvent.type && selectedEvent.type.toLowerCase() === 'tool_response' && (
                        <div className="mt-4">
                          <Text className="font-semibold">Tool Output</Text>
                          <JsonViewer data={selectedEvent.data?.output || {}} />
                        </div>
                      )}
                    </div>
                  </TabPanel>
                )}
              </TabPanels>
            </TabGroup>
          </Card>
        )}
      </div>
    );
  }

  // Render the main events list view
  return (
    <div className="p-6 space-y-6">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <Title>Events and Logs</Title>
        <Flex justifyContent="end" className="space-x-4">
          <Select
            value={refreshInterval.toString()}
            onValueChange={(value) => setRefreshInterval(parseInt(value))}
            className="w-40"
          >
            <SelectItem value="0">Manual refresh</SelectItem>
            <SelectItem value="5000">5 seconds</SelectItem>
            <SelectItem value="15000">15 seconds</SelectItem>
            <SelectItem value="30000">30 seconds</SelectItem>
            <SelectItem value="60000">1 minute</SelectItem>
          </Select>
          <Button
            icon={ArrowPathIcon}
            variant="light"
            loading={loading}
            onClick={() => fetchEvents()}
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

      <Grid numItemsMd={3} className="gap-6 mb-6">
        <Card>
          <div className="h-28">
            <Text>Total Events</Text>
            <Metric>{events.length > 0 ? pagination.totalPages * pagination.pageSize : 0}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Text>Success Rate</Text>
            <Metric>
              {events.length > 0
                ? `${Math.round((events.filter(e => e.status && e.status.toLowerCase() === 'success').length / events.length) * 100)}%`
                : 'N/A'}
            </Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Text>Recent Errors</Text>
            <Metric>{events.filter(e => e.status && e.status.toLowerCase() === 'error').length}</Metric>
          </div>
        </Card>
      </Grid>

      <Card>
        <Flex justifyContent="between" className="mb-4">
          <TextInput
            icon={MagnifyingGlassIcon}
            placeholder="Search events..."
            className="max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            onClick={() => setShowFilters(!showFilters)}
            icon={AdjustmentsHorizontalIcon}
            variant="light"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </Flex>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <Grid numItemsMd={3} className="gap-4">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
                placeholder="Filter by status"
              >
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </Select>

              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value)}
                placeholder="Filter by type"
              >
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getEventTypeName(type)}
                  </SelectItem>
                ))}
              </Select>

              <Select
                value={agentFilter}
                onValueChange={(value) => setAgentFilter(value)}
                placeholder="Filter by agent"
              >
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </Select>
            </Grid>

            <div className="mt-4">
              <DateRangePicker
                className="w-full"
                value={dateFilter}
                onValueChange={setDateFilter}
                displayFormat="MMM dd, yyyy"
                placeholder="Filter by date range"
              />
            </div>

            <Flex justifyContent="end" className="mt-4">
              <Button
                onClick={resetFilters}
                variant="light"
              >
                Reset Filters
              </Button>
            </Flex>
          </div>
        )}

        {error ? (
          <div className="text-center py-10">
            <Text color="red">{error}</Text>
          </div>
        ) : loading ? (
          <div className="text-center py-10">
            <Text>Loading events...</Text>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10">
            <Text>No events found matching your criteria.</Text>
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell 
                    className="cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <Flex alignItems="center" justifyContent="between">
                      ID
                      {sortField === 'id' && (
                        sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </Flex>
                  </TableHeaderCell>
                  <TableHeaderCell 
                    className="cursor-pointer"
                    onClick={() => handleSort('timestamp')}
                  >
                    <Flex alignItems="center" justifyContent="between">
                      Timestamp
                      {sortField === 'timestamp' && (
                        sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </Flex>
                  </TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Agent</TableHeaderCell>
                  <TableHeaderCell>Details</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow 
                    key={event.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(event)}
                  >
                    <TableCell>{event.id}</TableCell>
                    <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                    <TableCell>{getEventTypeName(event.type)}</TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell>
                      {event.agent_id ? (
                        <Link href={`/agents/${event.agent_id}`}>
                          <span className="text-blue-500 hover:underline">
                            {event.agent_name || `Agent #${event.agent_id}`}
                          </span>
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="truncate max-w-xs">{event.details || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Flex justifyContent="between" className="mt-4">
              <Text>
                Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalPages * pagination.pageSize)} of {pagination.totalPages * pagination.pageSize}
              </Text>
              <Flex className="space-x-2">
                <Button
                  variant="light"
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="light"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </Flex>
            </Flex>
          </>
        )}
      </Card>
    </div>
  );
} 