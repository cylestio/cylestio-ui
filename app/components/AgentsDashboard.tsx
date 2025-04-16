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
  Grid,
  Metric,
  Subtitle,
  Divider,
  AreaChart,
} from '@tremor/react';
import { MagnifyingGlassIcon, ArrowPathIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI, buildQueryParams } from '../lib/api';
import { AGENTS } from '../lib/api-endpoints';

// Define types based on new API schema
type Agent = {
  agent_id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  request_count?: number;
  token_usage?: number;
  error_count?: number;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type AgentsResponse = {
  items: Agent[];
  pagination: PaginationInfo;
  meta: {
    total_agents: number;
    active_agents: number;
    inactive_agents: number;
  };
};

// Add initialData prop for testing
interface AgentsDashboardProps {
  initialData?: any; // This is used by tests
}

export function AgentsDashboard({ initialData }: AgentsDashboardProps) {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 0,
  });
  const [meta, setMeta] = useState<{
    total_agents: number;
    active_agents: number;
    inactive_agents: number;
  }>({
    total_agents: 0,
    active_agents: 0,
    inactive_agents: 0,
  });
  const [loading, setLoading] = useState(!initialData); // Don't show loading if we have initialData
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('request_count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [agentTypes, setAgentTypes] = useState<string[]>([]);

  // Apply initialData if provided (for testing)
  useEffect(() => {
    if (initialData) {
      // Map the test data format to our component's format
      if (initialData.items) {
        setAgents(initialData.items.map((item: any) => ({
          agent_id: item.agent_id,
          name: item.name,
          description: item.description,
          type: item.version || 'Standard',
          status: item.active ? 'active' : 'inactive',
          created_at: item.creation_time,
          updated_at: item.last_active,
          request_count: 0,
          token_usage: 0,
          error_count: 0
        })));
        
        setPagination({
          page: initialData.page || 1,
          page_size: initialData.page_size || 10,
          total_items: initialData.total || initialData.items.length,
          total_pages: Math.ceil((initialData.total || initialData.items.length) / (initialData.page_size || 10)),
        });
        
        // Calculate meta information from the items
        const activeCount = initialData.items.filter((item: any) => item.active).length;
        setMeta({
          total_agents: initialData.items.length,
          active_agents: activeCount,
          inactive_agents: initialData.items.length - activeCount
        });

        // Extract unique types
        const types = Array.from(new Set(initialData.items.map((agent: any) => agent.version || 'Standard'))) as string[];
        setAgentTypes(types);
        
        setLastUpdated(new Date());
        setError(null);
        setLoading(false);
      }
    }
  }, [initialData]);

  // Function to fetch agents from the new API
  const fetchAgents = async () => {
    // For tests, if initialData is provided, just use that instead of making API calls
    if (initialData && typeof window === 'undefined') {
      return;
    }

    try {
      setLoading(true);
      // Build query parameters
      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        sort_by: sortBy,
        sort_dir: sortDir,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        agent_type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined
      };

      // Use the centralized API endpoint configuration and fetchAPI utility
      const data = await fetchAPI<AgentsResponse>(`${AGENTS.LIST}${buildQueryParams(params)}`);
      
      setAgents(data.items);
      setPagination(data.pagination);
      setMeta(data.meta);

      // Extract unique agent types for filter dropdown
      const types = Array.from(new Set(data.items.map(agent => agent.type)));
      setAgentTypes(types);
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch - only if not using initialData
  useEffect(() => {
    if (!initialData) {
      fetchAgents();
    }
  }, [pagination.page, pagination.page_size, sortBy, sortDir, statusFilter, typeFilter, timeRange, initialData]);

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
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      
      if (diffSecs < 60) return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
      
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
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
        return <Badge color="red">Error</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const handleRowClick = (agentId: string) => {
    router.push(`/agents/${agentId}`);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
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
          icon={ChevronRightIcon}
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

  return (
    <div className="p-6">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <Flex alignItems="center" className="gap-2">
          <Link href="/">
            <Button variant="light" icon={ArrowLeftIcon}>
              Back to Dashboard
            </Button>
          </Link>
          <Title>Agent Management</Title>
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
            onClick={() => fetchAgents()}
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
            <Text>Total Agents</Text>
            <Metric>{meta.total_agents}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Text>Active Agents</Text>
            <Metric>{meta.active_agents}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Text>Inactive Agents</Text>
            <Metric>{meta.inactive_agents}</Metric>
          </div>
        </Card>
      </Grid>

      <Card>
        <Flex justifyContent="between" className="mb-4 gap-2">
          <TextInput
            icon={MagnifyingGlassIcon}
            placeholder="Search agents..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchAgents();
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
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value)}
              placeholder="Filter by type"
              className="w-40"
            >
              <SelectItem value="all">All types</SelectItem>
              {agentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </Select>
          </Flex>
        </Flex>

        {error ? (
          <Text color="red">{error}</Text>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => handleSortChange('agent_id')}
                >
                  ID
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => handleSortChange('name')}
                >
                  Name
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => handleSortChange('status')}
                >
                  Status
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => handleSortChange('type')}
                >
                  Type
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => handleSortChange('updated_at')}
                >
                  Last Active
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => handleSortChange('request_count')}
                >
                  Requests
                </TableHeaderCell>
                <TableHeaderCell>Details</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Text>Loading...</Text>
                  </TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Text>No agents found.</Text>
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow
                    key={agent.agent_id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(agent.agent_id)}
                  >
                    <TableCell>
                      <Badge color="blue">{agent.agent_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <Text>{agent.name}</Text>
                      {agent.description && (
                        <Text className="text-xs text-gray-500 truncate max-w-xs">
                          {agent.description}
                        </Text>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={agent.status} />
                    </TableCell>
                    <TableCell>
                      <Text>{agent.type}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{formatTimestamp(agent.updated_at)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{agent.request_count?.toLocaleString() || '0'}</Text>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/agents/${agent.agent_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Flex className="items-center gap-1">
                          <Text>Details</Text>
                          <ChevronRightIcon className="h-4 w-4" />
                        </Flex>
                      </Link>
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