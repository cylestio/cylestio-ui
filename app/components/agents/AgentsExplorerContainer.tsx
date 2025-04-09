'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Card, Title, Text, Select, SelectItem, Grid, 
  Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell,
  Badge, Button, Flex
} from '@tremor/react';
import BreadcrumbNavigation from '../drilldown/BreadcrumbNavigation';
import FilterBar from '../FilterBar';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';
import { SimpleDonutChart } from '../SimpleDonutChart';
import DrilldownMetricCard from '../drilldown/DrilldownMetricCard';
import appSettings from '../../config/app-settings';
import { fetchAPI, buildQueryParams, PaginationParams, SearchParams } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';

// Types
type Agent = {
  agent_id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  request_count: number;
  token_usage: number;
  error_count: number;
};

type AgentListResponse = {
  items: Agent[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  meta: {
    timestamp: string;
  };
};

type TimeRangeOption = '24h' | '7d' | '30d';

type AgentFilterState = {
  status?: string;
  agent_type?: string;
  page: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  search?: string;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// Helper function to determine if an agent is active based on its last activity
const isAgentActive = (agent: Agent): boolean => {
  const lastActive = new Date(agent.updated_at);
  const now = new Date();
  const thresholdHours = appSettings.agents.activeThresholdHours;
  const threshold = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000);
  
  return lastActive >= threshold;
};

export function AgentsExplorerContainer() {
  const router = useRouter();
  
  // Data state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pagination, setPagination] = useState({
    page: 1, 
    page_size: 10, 
    total: 0,
    total_pages: 1
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(appSettings.timeRanges.default as TimeRangeOption);
  
  // Filter state
  const [filters, setFilters] = useState<AgentFilterState>({
    page: 1
  });

  // Get initial filters from URL - only once on initial load
  const searchParams = useSearchParams();
  const didInitializeFromUrl = useRef(false);
  
  // Update filters from URL on initial load only
  useEffect(() => {
    if (didInitializeFromUrl.current) return;
    
    const initialFilters: AgentFilterState = {
      page: parseInt(searchParams.get('page') || '1', 10),
      status: searchParams.get('status') || undefined,
      agent_type: searchParams.get('agent_type') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_dir: (searchParams.get('sort_dir') as 'asc' | 'desc') || undefined,
      search: searchParams.get('search') || undefined
    };
    
    setFilters(initialFilters);
    didInitializeFromUrl.current = true;
  }, []); // Empty dependency array - only run once

  // Fetch agent data
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params: Record<string, any> = {
        page: filters.page,
        page_size: 10, // Fixed page size for MVP
        status: filters.status,
        agent_type: filters.agent_type,
        sort_by: filters.sort_by,
        sort_dir: filters.sort_dir,
        search: filters.search,
      };
      
      console.log('Fetching agents with params:', params);
      
      // Fetch agents using the API client with the proper endpoint
      const data = await fetchAPI<AgentListResponse>(
        `${AGENTS.LIST}${buildQueryParams(params)}`
      );
      
      // Process agents to set their active status based on activity
      const processedAgents = data.items.map(agent => ({
        ...agent,
        // Override the status based on activity if needed
        active: isAgentActive(agent) 
      }));
      
      setAgents(processedAgents);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching agents');
      // Set empty data on error
      setAgents([]);
      setPagination({
        page: 1,
        page_size: 10,
        total: 0,
        total_pages: 1
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Execute fetch when filters or time range change
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents, timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRangeOption);
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        ...newFilters,
        page: 1 // Reset to page 1 when filters change
      };
      
      // Only update if there are actual changes
      if (JSON.stringify(updated) === JSON.stringify(prev)) {
        return prev; // No changes, return previous state to avoid re-render
      }
      
      return updated;
    });
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => {
      if (prev.page === newPage) return prev; // No change
      
      return {
        ...prev,
        page: newPage
      };
    });
  };

  // Define filter options for FilterBar
  const filterOptions = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ],
      defaultValue: filters.status || ''
    },
    {
      id: 'search',
      label: 'Search',
      type: 'search' as const,
      placeholder: 'Search agent name...',
      defaultValue: filters.search || ''
    }
  ], [filters.status, filters.search]);

  if (loading && agents.length === 0) {
    return <LoadingState message="Loading agents..." />;
  }

  return (
    <div>
      <BreadcrumbNavigation
        items={[
          { label: 'Home', href: '/' },
          { label: 'Agents', href: '/agents' },
        ]}
      />
      
      <div className="mb-6 flex justify-between items-center">
        <Title className="text-2xl font-bold">Agents Explorer</Title>
        <div className="w-40">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </Select>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Overview metrics */}
        <AgentsOverview agents={agents} timeRange={timeRange} />
        
        {/* Filters */}
        <FilterBar
          filters={filterOptions}
          onFilterChange={handleFilterChange}
          preserveFiltersInUrl={true}
        />
        
        {/* Agents table */}
        <Card>
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <AgentsTable 
              agents={agents} 
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

// Inline AgentsOverview component
function AgentsOverview({ agents, timeRange }: { agents: Agent[], timeRange: string }) {
  // Calculate summary metrics
  const totalAgents = agents.length;
  
  // Use isAgentActive helper to determine active status
  const activeAgents = agents.filter(agent => isAgentActive(agent)).length;
  const inactiveAgents = totalAgents - activeAgents;
  const errorAgents = agents.filter(agent => agent.status === 'error').length;
  
  // Calculate agent distribution by status
  const agentStatusData = [
    { name: 'active', count: activeAgents },
    { name: 'inactive', count: inactiveAgents }
  ].filter(item => item.count > 0);
  
  return (
    <div className="space-y-6">
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <DrilldownMetricCard
          title="Total Agents"
          value={totalAgents.toString()}
          drilldownHref="/agents"
        />
        
        <DrilldownMetricCard
          title="Active Agents"
          value={activeAgents.toString()}
          variant="success"
          drilldownHref="/agents"
          drilldownFilters={{ status: 'active' }}
        />
        
        <DrilldownMetricCard
          title="Error State"
          value={errorAgents.toString()}
          variant="error"
          drilldownHref="/agents"
          drilldownFilters={{ status: 'error' }}
        />
        
        <DrilldownMetricCard
          title="Inactive Agents"
          value={inactiveAgents.toString()}
          variant="neutral"
          drilldownHref="/agents"
          drilldownFilters={{ status: 'inactive' }}
        />
      </Grid>
      
      <Grid numItemsMd={2} className="gap-6">
        <Card>
          <Text className="text-lg font-medium mb-2">Agent Status Distribution</Text>
          <div className="h-64 flex items-center justify-center">
            {agentStatusData.length > 0 ? (
              <SimpleDonutChart 
                data={agentStatusData} 
                showLegend={true}
              />
            ) : (
              <Text className="text-gray-500">No data available</Text>
            )}
          </div>
        </Card>
      </Grid>
    </div>
  );
}

// Inline AgentsTable component
function AgentsTable({ 
  agents, 
  pagination, 
  onPageChange 
}: { 
  agents: Agent[], 
  pagination: PaginationInfo,
  onPageChange: (page: number) => void
}) {
  const router = useRouter();
  
  // Format status as badge
  const getStatusBadge = (agent: Agent) => {
    const active = isAgentActive(agent);
    
    if (agent.status === 'error') {
      return <Badge color="rose">Error</Badge>;
    }
    
    if (active) {
      return <Badge color="emerald">Active</Badge>;
    }
    
    return <Badge color="gray">Inactive</Badge>;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Navigate to agent detail
  const handleRowClick = (agentId: string) => {
    router.push(`/agents/detail/${agentId}`);
  };
  
  // Generate pagination controls
  const renderPagination = () => {
    const { page, total_pages } = pagination;
    
    if (total_pages <= 1) {
      return null;
    }
    
    return (
      <Flex justifyContent="end" className="mt-4">
        <div className="flex items-center gap-2">
          <Text>Page {page} of {total_pages}</Text>
          <Button
            size="xs"
            variant="secondary"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            size="xs"
            variant="secondary"
            disabled={page === total_pages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </Flex>
    );
  };
  
  if (!agents.length) {
    return (
      <div className="text-center py-12">
        <Text>No agents found. Please check database connectivity or create agents first.</Text>
      </div>
    );
  }
  
  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Requests</TableHeaderCell>
            <TableHeaderCell>Errors</TableHeaderCell>
            <TableHeaderCell>Last Updated</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {agents.map((agent) => (
            <TableRow 
              key={agent.agent_id}
              onClick={() => handleRowClick(agent.agent_id)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <TableCell>{agent.name}</TableCell>
              <TableCell className="capitalize">{agent.type}</TableCell>
              <TableCell>{getStatusBadge(agent)}</TableCell>
              <TableCell>{agent.request_count.toLocaleString()}</TableCell>
              <TableCell>{agent.error_count.toLocaleString()}</TableCell>
              <TableCell>{formatDate(agent.updated_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {renderPagination()}
    </div>
  );
} 