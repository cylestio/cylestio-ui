'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
import { fetchAPI, buildQueryParams } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';
import { Agent, AgentListResponse, PaginationInfo, AgentFilterState, TimeRangeOption } from '../../types/agent';

// Helper function to determine if an agent is active based on its last activity
const isAgentActive = (agent: Agent): boolean => {
  // Check if the agent has any events in the last X hours
  // For now, we're using updated_at as a proxy for last event time
  const lastActive = new Date(agent.updated_at);
  const now = new Date();
  const thresholdHours = appSettings.agents.activeThresholdHours;
  const threshold = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000);
  
  return lastActive >= threshold;
};

export function AgentsExplorerContainer() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Data state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
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
    page: 1,
    time_range: timeRange
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
      sort_by: searchParams.get('sort_by') || undefined,
      sort_dir: (searchParams.get('sort_dir') as 'asc' | 'desc') || undefined,
      search: searchParams.get('search') || undefined,
      time_range: (searchParams.get('time_range') as TimeRangeOption) || timeRange
    };
    
    setFilters(initialFilters);
    if (initialFilters.time_range) {
      setTimeRange(initialFilters.time_range as TimeRangeOption);
    }
    didInitializeFromUrl.current = true;
  }, [searchParams, timeRange]); // Only run when searchParams change

  // Update URL with current filters
  useEffect(() => {
    // Only update URL after initial load
    if (!didInitializeFromUrl.current) return;
    
    const queryParams = new URLSearchParams();
    
    // Add all non-empty filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value));
      }
    });
    
    // Update URL with new query params
    const queryString = queryParams.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    // Use replace to avoid adding to browser history
    router.replace(newUrl, { scroll: false });
  }, [filters, pathname, router]);

  // Fetch agent data
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params: Record<string, any> = {
        page: filters.page,
        page_size: 10, // Fixed page size for MVP
        sort_by: filters.sort_by,
        sort_dir: filters.sort_dir,
        search: filters.search,
        time_range: filters.time_range
      };
      
      // Add status filter - note we'll apply active/inactive client-side
      // based on our time threshold logic
      if (filters.status) {
        params.status = filters.status;
      }
      
      console.log('Fetching agents with params:', params);
      
      // Fetch agents using the API client with the proper endpoint
      const data = await fetchAPI<AgentListResponse>(
        `${AGENTS.LIST}${buildQueryParams(params)}`
      );
      
      // Process agents data
      let filteredAgents = data.items || [];
      
      // Apply active/inactive filter client-side if needed
      if (filters.status === 'active') {
        filteredAgents = filteredAgents.filter(agent => isAgentActive(agent));
      } else if (filters.status === 'inactive') {
        filteredAgents = filteredAgents.filter(agent => !isAgentActive(agent));
      }
      
      setAgents(filteredAgents);
      
      // Adjust pagination for client-side filtered results
      if (filters.status === 'active' || filters.status === 'inactive') {
        setPagination({
          ...data.pagination,
          total: filteredAgents.length,
          total_pages: Math.max(1, Math.ceil(filteredAgents.length / data.pagination.page_size))
        });
      } else {
        setPagination(data.pagination);
      }
    } catch (err: any) {
      console.error('Error fetching agents:', err);
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
  }, [fetchAgents]);

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    const newTimeRange = value as TimeRangeOption;
    setTimeRange(newTimeRange);
    setFilters(prev => ({
      ...prev,
      time_range: newTimeRange,
      page: 1 // Reset to page 1 when time range changes
    }));
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
        { value: 'active', label: `Active (last ${appSettings.agents.activeThresholdHours}h)` },
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
          { label: 'Agents', href: '/agents', current: true },
        ]}
        preserveFilters={true}
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
      
      <div className="mb-6">
        <AgentsOverview agents={agents} timeRange={timeRange} />
      </div>
      
      <Card className="mb-6">
        <div className="mb-4">
          <FilterBar 
            filters={filterOptions} 
            onFilterChange={handleFilterChange}
            preserveFiltersInUrl={true}
          />
        </div>
        
        <AgentsTable 
          agents={agents} 
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
}

// Inline AgentsOverview component
function AgentsOverview({ agents, timeRange }: { agents: Agent[], timeRange: string }) {
  // Calculate metrics
  const totalAgents = agents.length;
  const activeAgents = agents.filter(agent => isAgentActive(agent)).length;
  const inactiveAgents = totalAgents - activeAgents;
  const errorAgents = agents.filter(a => a.error_count > 0).length;
  
  // Total request count & errors
  const totalRequests = agents.reduce((sum, agent) => sum + (agent.request_count || 0), 0);
  const totalErrors = agents.reduce((sum, agent) => sum + (agent.error_count || 0), 0);
  
  // Format status data for chart
  const statusChartData = [
    { name: 'Active', count: activeAgents },
    { name: 'Inactive', count: inactiveAgents }
  ];

  return (
    <div>
      <Grid numItems={1} numItemsMd={2} numItemsLg={4} className="gap-4 mb-6">
        <DrilldownMetricCard
          title="Total Agents"
          value={totalAgents.toString()}
          variant="primary"
          drilldownHref="/agents"
          preserveCurrentFilters={true}
        />
        
        <DrilldownMetricCard
          title={`Active (last ${appSettings.agents.activeThresholdHours}h)`}
          value={activeAgents.toString()}
          variant="success"
          drilldownHref={`/agents?status=active&time_range=${timeRange}`}
        />
        
        <DrilldownMetricCard
          title="Error State"
          value={errorAgents.toString()}
          variant="error"
          drilldownHref={errorAgents > 0 ? `/agents?error_count=1&time_range=${timeRange}` : undefined}
        />
        
        <DrilldownMetricCard
          title="Inactive"
          value={inactiveAgents.toString()}
          variant="neutral"
          drilldownHref={inactiveAgents > 0 ? `/agents?status=inactive&time_range=${timeRange}` : undefined}
        />
      </Grid>
      
      <div className="mb-6">
        <Card>
          <Title>Agent Status Distribution</Title>
          <SimpleDonutChart
            data={statusChartData}
            showLegend={true}
            showTotal={true}
            className="mt-6"
            valueFormatter={(value) => value.toString()}
            colors={['emerald', 'gray']}
            emptyMessage="No agent status data available"
          />
        </Card>
      </div>
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
    if (agent.error_count > 0) {
      return <Badge color="rose">Error</Badge>;
    }
    
    if (isAgentActive(agent)) {
      return <Badge color="emerald">Active</Badge>;
    }
    
    return <Badge color="gray">Inactive</Badge>;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Handle row click to navigate to agent detail
  const handleRowClick = (agentId: string) => {
    router.push(`/agents/${agentId}`);
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
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Requests</TableHeaderCell>
            <TableHeaderCell className="text-right">Errors</TableHeaderCell>
            <TableHeaderCell>Last Updated</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {agents.map((agent) => (
            <TableRow 
              key={agent.agent_id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors duration-150" 
              onClick={() => handleRowClick(agent.agent_id)}
            >
              <TableCell className="font-medium text-blue-600 hover:underline">
                {agent.name}
              </TableCell>
              <TableCell>{getStatusBadge(agent)}</TableCell>
              <TableCell className="text-right">{agent.request_count.toLocaleString()}</TableCell>
              <TableCell className="text-right">{agent.error_count.toLocaleString()}</TableCell>
              <TableCell>{formatDate(agent.updated_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {renderPagination()}
    </div>
  );
} 