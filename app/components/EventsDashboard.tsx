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
  FaSearch, 
  FaSync, 
  FaChevronRight, 
  FaChevronLeft, 
  FaCalendar,
  FaFilter, 
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CodeBlock } from '../components/CodeBlock';
import apiClient, { EnhancedApiError, createEnhancedApiError } from '@/lib/api/client';
import { useApiRequest } from '@/hooks/useApiRequest';
import { EventsService } from '@/lib/api/services';
import { ErrorDisplay } from '@/components/ui/error-display';

// Define types
interface EventData {
  id: number | string;
  event_id?: string;
  timestamp: string;
  event_type: string;
  status?: string;
  agent_id?: string | number;
  agent_name?: string;
  session_id?: string | number;
  conversation_id?: string | number;
  duration?: number;
  content?: string;
  metadata?: Record<string, any>;
}

export function EventsDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EnhancedApiError | null>(null);
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

  // Modified fetchEvents to use API client with retry logic
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params: any = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
      };
      
      // Add filters if any
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.event_type = typeFilter;
      if (agentFilter !== 'all') params.agent_id = agentFilter;
      
      // Add date range if set
      if (dateFilter.from) {
        params.start_time = dateFilter.from.toISOString();
      }
      if (dateFilter.to) {
        params.end_time = dateFilter.to.toISOString();
      }
      
      // Add sorting
      params.sort_by = sortField;
      params.sort_order = sortDirection;

      // Use API client directly with correct path
      const response = await apiClient.get('/events/', { params });
      const data = response.data;
      
      if (data && data.items) {
        setEvents(data.items);
        setFilteredEvents(data.items);
        
        // Update pagination based on API response
        setPagination({
          currentPage: data.page || 1,
          totalPages: Math.ceil(data.total / data.page_size) || 1,
          pageSize: data.page_size || 25
        });
        
        // Extract event types for filtering
        if (data.items && data.items.length > 0) {
          const types = Array.from(new Set(data.items.map((event: EventData) => 
            event.event_type || 'unknown'
          )));
          setEventTypes(types as string[]);
        }
      } else {
        // Handle empty response
        setEvents([]);
        setFilteredEvents([]);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching events:', err);
      
      // Enhanced error handling
      setError(err instanceof Error ? createEnhancedApiError(err) : createEnhancedApiError('Failed to load events data. Please try again.'));
      setEvents([]);
      setFilteredEvents([]);
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

  // Replace the fetchAgents function with this improved version
  const fetchAgents = useCallback(async () => {
    try {
      const response = await apiClient.get('/agents/');
      const data = response.data;
      
      if (data && data.items) {
        setAgents(data.items.map((agent: any) => ({ 
          id: agent.id || agent.agent_id, 
          name: agent.name || `Agent #${agent.id || agent.agent_id}` 
        })));
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      // We don't set a global error for agents since it's not critical
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
  const getEventTypeName = (type: string): string => {
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
            icon={FaSync}
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
                  <Text>{getEventTypeName(selectedEvent.event_type)}</Text>
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
                {selectedEvent.content && (
                  <div>
                    <Text className="font-semibold">Details</Text>
                    <Text>{selectedEvent.content}</Text>
                  </div>
                )}
              </div>
            </div>
          </Grid>
        </Card>

        {selectedEvent.metadata && (
          <Card>
            <TabGroup>
              <TabList>
                <Tab>Raw Data</Tab>
                {selectedEvent.event_type.toLowerCase().includes('llm') && <Tab>LLM Content</Tab>}
                {selectedEvent.event_type.toLowerCase().includes('tool') && <Tab>Tool Data</Tab>}
              </TabList>
              <TabPanels>
                <TabPanel>
                  <div className="mt-4">
                    <JsonViewer data={selectedEvent.metadata} />
                  </div>
                </TabPanel>
                {selectedEvent.event_type.toLowerCase().includes('llm') && (
                  <TabPanel>
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <Text className="whitespace-pre-wrap">
                        {selectedEvent.metadata?.content || selectedEvent.metadata?.message || 'No content available'}
                      </Text>
                    </div>
                  </TabPanel>
                )}
                {selectedEvent.event_type.toLowerCase().includes('tool') && (
                  <TabPanel>
                    <div className="mt-4">
                      <Text className="font-semibold">Tool Name</Text>
                      <Text>{selectedEvent.metadata?.tool_name || 'Unknown'}</Text>
                      <div className="mt-4">
                        <Text className="font-semibold">Tool Input</Text>
                        <JsonViewer data={selectedEvent.metadata?.input || {}} />
                      </div>
                      {selectedEvent.event_type.toLowerCase() === 'tool_response' && (
                        <div className="mt-4">
                          <Text className="font-semibold">Tool Output</Text>
                          <JsonViewer data={selectedEvent.metadata?.output || {}} />
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
            icon={FaSync}
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
            icon={FaSearch}
            placeholder="Search events..."
            className="max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            onClick={() => setShowFilters(!showFilters)}
            icon={FaFilter}
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

        {error && (
          <div className="mb-4">
            <ErrorDisplay
              error={error}
              title="Failed to load events"
              onRetry={fetchEvents}
              onClear={() => setError(null)}
              withDetails={true}
            />
          </div>
        )}

        {loading ? (
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
                        sortDirection === 'asc' ? <FaChevronRight className="h-4 w-4" /> : <FaChevronLeft className="h-4 w-4" />
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
                        sortDirection === 'asc' ? <FaChevronRight className="h-4 w-4" /> : <FaChevronLeft className="h-4 w-4" />
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
                    <TableCell>{getEventTypeName(event.event_type)}</TableCell>
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
                    <TableCell className="truncate max-w-xs">{event.content || '-'}</TableCell>
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