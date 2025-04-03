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
  ChatBubbleLeftRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SessionDetail } from './SessionDetail';
import { fetchAPI, buildQueryParams } from '../lib/api';
import { SESSIONS } from '../lib/api-endpoints';

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

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type SessionsResponse = {
  items: Session[];
  pagination: PaginationInfo;
  meta: {
    time_period: string;
    from_time: string;
    to_time: string;
  };
};

type SessionMetric = {
  name: string;
  value: number;
};

type ChartDataPoint = {
  timestamp: string;
  value: number;
  dimensions?: {
    status?: string;
    agent?: string;
  };
};

export function SessionsDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
  });
  const [sessionTrend, setSessionTrend] = useState<ChartDataPoint[]>([]);
  const [sessionsByStatus, setSessionsByStatus] = useState<SessionMetric[]>([]);
  const [sessionsByAgent, setSessionsByAgent] = useState<SessionMetric[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Function to fetch sessions from the API
  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        time_range: timeRange,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        agent_id: agentFilter !== 'all' ? agentFilter : undefined,
        search: searchQuery || undefined
      };

      // Use the centralized API endpoint configuration and fetchAPI utility
      const data = await fetchAPI<SessionsResponse>(`${SESSIONS.LIST}${buildQueryParams(params)}`);
      
      setSessions(data.items);
      setPagination(data.pagination);
      
      // Fetch session trend data
      const trendParams = {
        time_range: timeRange,
        interval: getInterval(timeRange)
      };
      
      const trendData = await fetchAPI<any>(
        `${SESSIONS.METRICS}${buildQueryParams(trendParams)}`
      );
      setSessionTrend(trendData.data || []);
      
      // Fetch sessions by status
      const statusParams = {
        time_range: timeRange,
        dimensions: 'status'
      };
      
      const statusData = await fetchAPI<any>(
        `${SESSIONS.METRICS}${buildQueryParams(statusParams)}`
      );
      
      // Transform to format for charts
      const statusMetrics = Object.entries(
        statusData.data.reduce((acc: Record<string, number>, item: ChartDataPoint) => {
          const status = item.dimensions?.status || 'unknown';
          acc[status] = (acc[status] || 0) + item.value;
          return acc;
        }, {})
      ).map(([status, count]) => ({ name: status, value: count as number }));
      
      setSessionsByStatus(statusMetrics);
      
      // Fetch sessions by agent
      const agentParams = {
        time_range: timeRange,
        dimensions: 'agent_id'
      };
      
      const agentData = await fetchAPI<any>(
        `${SESSIONS.METRICS}${buildQueryParams(agentParams)}`
      );
      
      // Get agent names from sessions data
      const agentMap = sessions.reduce((acc: Record<string, string>, session) => {
        acc[session.agent_id] = session.agent_name;
        return acc;
      }, {});
      
      // Transform to format for charts
      const agentMetrics = Object.entries(
        agentData.data.reduce((acc: Record<string, number>, item: ChartDataPoint) => {
          const agentId = item.dimensions?.agent || 'unknown';
          acc[agentId] = (acc[agentId] || 0) + item.value;
          return acc;
        }, {})
      ).map(([agentId, count]) => ({ 
        name: agentMap[agentId] || `Agent ${agentId}`, 
        value: count as number 
      }));
      
      setSessionsByAgent(agentMetrics);
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate interval based on time range
  const getInterval = (range: string): string => {
    switch (range) {
      case '1h': return '5m';
      case '1d': return '1h';
      case '7d': return '1d';
      case '30d': return '1d';
      default: return '1h';
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSessions();
  }, [pagination.page, timeRange, statusFilter, agentFilter]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
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

  // If a session is selected, show its details
  if (selectedSessionId) {
    return (
      <div>
        <Button
          variant="light"
          icon={ArrowLeftIcon}
          onClick={() => setSelectedSessionId(null)}
          className="mb-4"
        >
          Back to Sessions
        </Button>
        <SessionDetail sessionId={selectedSessionId} />
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
          <Title>Sessions</Title>
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
            onClick={() => fetchSessions()}
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
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />
            <div>
              <Text>Total Sessions</Text>
              <Metric>{pagination.total_items}</Metric>
            </div>
          </Flex>
        </Card>
        <Card>
          <Text>Active Sessions</Text>
          <Metric>
            {sessionsByStatus.find(s => s.name.toLowerCase() === 'active')?.value || 0}
          </Metric>
        </Card>
        <Card>
          <Text>Top Agent</Text>
          <Metric>
            {sessionsByAgent.length > 0 
              ? sessionsByAgent.sort((a, b) => b.value - a.value)[0].name
              : 'None'}
          </Metric>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Session Count Over Time</Title>
          <AreaChart
            className="h-72 mt-4"
            data={prepareChartData(sessionTrend)}
            index="date"
            categories={["value"]}
            colors={["blue"]}
            valueFormatter={(value) => `${value} sessions`}
            showLegend={false}
          />
        </Card>
        <Card>
          <Title>Sessions by Status</Title>
          <DonutChart
            className="h-72 mt-4"
            data={sessionsByStatus}
            category="value"
            index="name"
            colors={["green", "blue", "red", "amber", "gray"]}
            valueFormatter={(value) => `${value} sessions`}
          />
        </Card>
      </Grid>

      {/* Sessions Filters */}
      <Card className="mb-6">
        <Flex justifyContent="between" className="mb-4 gap-2">
          <TextInput
            icon={MagnifyingGlassIcon}
            placeholder="Search sessions..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchSessions();
              }
            }}
          />
          <Flex className="gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
              placeholder="Filter by status"
              className="w-40"
            >
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </Select>
            {/* Eventually, we'd add an agent filter here that would dynamically load agent options */}
          </Flex>
        </Flex>

        <Divider />

        {error ? (
          <Text color="red">{error}</Text>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Session ID</TableHeaderCell>
                <TableHeaderCell>Agent</TableHeaderCell>
                <TableHeaderCell>Start Time</TableHeaderCell>
                <TableHeaderCell>End Time</TableHeaderCell>
                <TableHeaderCell>Duration</TableHeaderCell>
                <TableHeaderCell>Messages</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <Text>Loading...</Text>
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <Text>No sessions found.</Text>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell>{session.session_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Link 
                        href={`/agents/${session.agent_id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {session.agent_name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatTimestamp(session.start_time)}</TableCell>
                    <TableCell>
                      {session.end_time ? formatTimestamp(session.end_time) : 'In progress'}
                    </TableCell>
                    <TableCell>{formatDuration(session.duration)}</TableCell>
                    <TableCell>{session.stats.message_count}</TableCell>
                    <TableCell>
                      <Badge color={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="light"
                        size="xs"
                        icon={EyeIcon}
                        onClick={() => setSelectedSessionId(session.session_id)}
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