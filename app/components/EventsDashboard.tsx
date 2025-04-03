'use client';

import { useState, useEffect } from 'react';
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
  Divider,
  Grid,
  Metric,
  AreaChart,
  DonutChart,
} from '@tremor/react';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon, 
  ArrowLeftIcon,
  DocumentTextIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { EventDetail } from './EventDetail';
import { fetchAPI, buildQueryParams } from '../lib/api';
import { TELEMETRY } from '../lib/api-endpoints';

// Define types based on new API
type Event = {
  id: string;
  event_id?: string; // For backwards compatibility
  timestamp: string;
  name: string; 
  agent_id: string;
  trace_id: string;
  span_id?: string;
  parent_span_id?: string;
  level: string;
  attributes: Record<string, any>;
  schema_version?: string;
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
  meta?: {
    time_period?: string;
    from_time?: string;
    to_time?: string;
  };
};

type EventMetric = {
  name: string;
  value: number;
};

type ChartDataPoint = {
  timestamp: string;
  value: number;
  dimensions?: Record<string, string>;
};

export function EventsDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
  });
  const [eventTrend, setEventTrend] = useState<ChartDataPoint[]>([]);
  const [eventsByType, setEventsByType] = useState<EventMetric[]>([]);
  const [eventsBySource, setEventsBySource] = useState<EventMetric[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Function to fetch events from the API
  const fetchEvents = async (page = currentPage) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params: Record<string, any> = {
        page,
        page_size: pagination.page_size,
        time_range: timeRange
      };
      
      // Add filters if specified
      if (typeFilter !== 'all') params.event_name = typeFilter;
      if (levelFilter !== 'all') params.level = levelFilter;
      if (agentFilter !== 'all') params.agent_id = agentFilter;

      // Use the centralized API endpoint configuration and fetchAPI utility
      const endpoint = `${TELEMETRY.EVENTS}${buildQueryParams(params)}`;
      console.log('Fetching events from:', endpoint);
      
      // For the telemetry events endpoint, the API returns an array directly
      const data = await fetchAPI<Event[]>(endpoint);
      
      // Since API returns array instead of pagination object, we need to handle it
      setEvents(data || []);
      
      // Update pagination to reflect what we have
      const totalItems = data?.length || 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / pagination.page_size));
      setPagination({
        page,
        page_size: pagination.page_size,
        total_items: totalItems,
        total_pages: totalPages
      });
            
      // Process event data for charts
      // Group events by type for the donut chart
      const eventTypes: Record<string, number> = {};
      data?.forEach(event => {
        const type = event.name;
        eventTypes[type] = (eventTypes[type] || 0) + 1;
      });
      
      const typeMetrics = Object.entries(eventTypes)
        .map(([name, count]) => ({ name, value: count }));
        
      setEventsByType(typeMetrics);
      
      // Generate timeline data for area chart
      // Group events by hour/day for the timeline
      const timePoints: Record<string, number> = {};
      
      // Generate appropriate time points based on range
      const interval = getInterval(timeRange);
      const now = new Date();
      const points = getTimePoints(now, timeRange, interval);
      
      // Initialize all time points with zero
      points.forEach(point => {
        timePoints[point] = 0;
      });
      
      // Count events per time point
      data?.forEach(event => {
        const date = new Date(event.timestamp);
        const timeKey = formatDateForGrouping(date, interval);
        if (timePoints[timeKey] !== undefined) {
          timePoints[timeKey]++;
        }
      });
      
      // Convert to chart format
      const chartData = Object.entries(timePoints).map(([timestamp, count]) => ({
        timestamp,
        value: count
      }));
      
      setEventTrend(chartData);
      
      // For event source, extract from the available data
      const sourceTypes: Record<string, number> = {};
      data?.forEach(event => {
        // Use agent_id as source if available
        const source = event.agent_id || 'unknown';
        sourceTypes[source] = (sourceTypes[source] || 0) + 1;
      });
      
      const sourceMetrics = Object.entries(sourceTypes)
        .map(([name, count]) => ({ name, value: count }));
        
      setEventsBySource(sourceMetrics);
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate interval based on time range
  const getInterval = (range: string): string => {
    switch (range) {
      case '1h': return '5m';
      case '1d': return '1h';
      case '7d': return '6h';
      case '30d': return '1d';
      default: return '1d';
    }
  };
  
  // Generate time points for the chart based on interval
  const getTimePoints = (endDate: Date, range: string, interval: string): string[] => {
    const points: string[] = [];
    const end = new Date(endDate);
    let start: Date;
    
    // Determine start date based on range
    switch(range) {
      case '1h':
        start = new Date(end);
        start.setHours(end.getHours() - 1);
        break;
      case '1d':
        start = new Date(end);
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start = new Date(end);
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start = new Date(end);
        start.setDate(end.getDate() - 30);
        break;
      default:
        start = new Date(end);
        start.setDate(end.getDate() - 7);
    }
    
    // Generate points between start and end based on interval
    let current = new Date(start);
    while (current <= end) {
      points.push(formatDateForGrouping(current, interval));
      
      // Increment by interval
      switch(interval) {
        case '5m':
          current.setMinutes(current.getMinutes() + 5);
          break;
        case '1h':
          current.setHours(current.getHours() + 1);
          break;
        case '6h':
          current.setHours(current.getHours() + 6);
          break;
        case '1d':
          current.setDate(current.getDate() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }
    
    return points;
  };
  
  // Format date for grouping in charts
  const formatDateForGrouping = (date: Date, interval: string): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    switch(interval) {
      case '5m':
        // Round to nearest 5 minutes
        const roundedMinutes = Math.floor(date.getMinutes() / 5) * 5;
        return `${year}-${month}-${day} ${hours}:${String(roundedMinutes).padStart(2, '0')}`;
      case '1h':
        return `${year}-${month}-${day} ${hours}:00`;
      case '6h':
        // Round to 0, 6, 12, 18
        const roundedHours = Math.floor(date.getHours() / 6) * 6;
        return `${year}-${month}-${day} ${String(roundedHours).padStart(2, '0')}:00`;
      case '1d':
      default:
        return `${year}-${month}-${day}`;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchEvents(currentPage);
  }, [currentPage, timeRange, typeFilter, levelFilter, agentFilter]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format date for charts
  const formatChartDate = (timestamp: string, range: string) => {
    const date = new Date(timestamp);
    
    switch (range) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1d':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      default:
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Transform time series data for charts
  const prepareChartData = (data: ChartDataPoint[]) => {
    return data.map(item => ({
      date: formatChartDate(item.timestamp, timeRange),
      value: item.value
    }));
  };

  // Get a friendly display name for event types
  const getEventTypeDisplay = (name: string) => {
    // Updated to map telemetry event names
    const typeMap: Record<string, string> = {
      'llm.request': 'LLM Request',
      'llm.response': 'LLM Response',
      'tool.execution': 'Tool Execution',
      'tool.response': 'Tool Response',
      'session.start': 'Session Start',
      'session.end': 'Session End',
      'error': 'Error',
      'trace.start': 'Trace Start',
      'trace.end': 'Trace End',
      'message.user': 'User Message',
      'message.assistant': 'Assistant Message'
    };
    
    return typeMap[name] || name.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Generate pagination controls
  const renderPagination = () => {
    const { page, total_pages } = pagination;
    
    if (total_pages <= 1) return null;
    
    const pageButtons = [];
    const maxButtonsToShow = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(total_pages, startPage + maxButtonsToShow - 1);
    
    if (endPage - startPage + 1 < maxButtonsToShow) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }
    
    if (page > 1) {
      pageButtons.push(
        <Button 
          key="prev" 
          variant="light" 
          onClick={() => handlePageChange(page - 1)}
          icon={ArrowLeftIcon}
          size="xs"
        >
          Previous
        </Button>
      );
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant={i === page ? "primary" : "light"}
          onClick={() => handlePageChange(i)}
          size="xs"
        >
          {i}
        </Button>
      );
    }
    
    if (page < total_pages) {
      pageButtons.push(
        <Button 
          key="next" 
          variant="light" 
          onClick={() => handlePageChange(page + 1)}
          iconPosition="right"
          icon={ArrowLeftIcon}
          className="rotate-180"
          size="xs"
        >
          Next
        </Button>
      );
    }
    
    return (
      <Flex justifyContent="center" className="mt-4 gap-2">
        {pageButtons}
      </Flex>
    );
  };

  // If an event is selected, show its details
  if (selectedEventId) {
    return (
      <div>
        <Button
          variant="light"
          icon={ArrowLeftIcon}
          onClick={() => setSelectedEventId(null)}
          className="mb-4"
        >
          Back to Events
        </Button>
        <EventDetail eventId={selectedEventId} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <Flex alignItems="center" className="gap-2">
          <Link href="/">
            <Button variant="light" icon={ArrowLeftIcon}>
              Back to Dashboard
            </Button>
          </Link>
          <Title>Events</Title>
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

      {/* Summary Cards */}
      <Grid numItemsMd={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" className="gap-2">
            <DocumentTextIcon className="h-6 w-6 text-blue-500" />
            <div>
              <Text>Total Events</Text>
              <Metric>{pagination.total_items}</Metric>
            </div>
          </Flex>
        </Card>
        <Card>
          <Text>Top Event Type</Text>
          <Metric>
            {eventsByType.length > 0 
              ? getEventTypeDisplay(eventsByType.sort((a, b) => b.value - a.value)[0].name)
              : 'None'}
          </Metric>
        </Card>
        <Card>
          <Text>Top Event Source</Text>
          <Metric>
            {eventsBySource.length > 0 
              ? eventsBySource.sort((a, b) => b.value - a.value)[0].name
              : 'None'}
          </Metric>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Event Count Over Time</Title>
          <AreaChart
            className="h-72 mt-4"
            data={prepareChartData(eventTrend)}
            index="date"
            categories={["value"]}
            colors={["blue"]}
            valueFormatter={(value) => `${value} events`}
            showLegend={false}
          />
        </Card>
        <Card>
          <Title>Events by Type</Title>
          <DonutChart
            className="h-72 mt-4"
            data={eventsByType}
            category="value"
            index="name"
            colors={["blue", "cyan", "indigo", "sky", "violet"]}
            valueFormatter={(value) => `${value} events`}
          />
        </Card>
      </Grid>

      {/* Event Filters */}
      <Card className="mb-6">
        <Flex justifyContent="between" className="mb-4 gap-2">
          <TextInput
            icon={MagnifyingGlassIcon}
            placeholder="Search events..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchEvents();
              }
            }}
          />
          <Flex className="gap-2">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value)}
              placeholder="Filter by type"
              className="w-48"
            >
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="user_message">User Message</SelectItem>
              <SelectItem value="assistant_message">Assistant Message</SelectItem>
              <SelectItem value="llm_request">LLM Request</SelectItem>
              <SelectItem value="llm_response">LLM Response</SelectItem>
              <SelectItem value="tool_execution">Tool Execution</SelectItem>
              <SelectItem value="tool_response">Tool Response</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </Select>
            <Select
              value={levelFilter}
              onValueChange={(value) => setLevelFilter(value)}
              placeholder="Filter by level"
              className="w-40"
            >
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </Select>
            <Select
              value={agentFilter}
              onValueChange={(value) => setAgentFilter(value)}
              placeholder="Filter by agent"
              className="w-40"
            >
              <SelectItem value="all">All agents</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="llm">LLM</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
            </Select>
          </Flex>
        </Flex>

        <Divider />

        {error ? (
          <Text color="red">{error}</Text>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Event ID</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Level</TableHeaderCell>
                <TableHeaderCell>Agent</TableHeaderCell>
                <TableHeaderCell>Trace ID</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Text>Loading...</Text>
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Text>No events found.</Text>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.id}</TableCell>
                    <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                    <TableCell>{getEventTypeDisplay(event.name)}</TableCell>
                    <TableCell>{event.level}</TableCell>
                    <TableCell>
                      <Link 
                        href={`/agents/${event.agent_id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {event.attributes.agent_name || event.agent_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/traces/${event.trace_id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {event.trace_id.slice(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="light"
                        size="xs"
                        icon={EyeIcon}
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        
        {renderPagination()}
      </Card>
    </div>
  );
} 