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
import DrilldownMetricCard from '../drilldown/DrilldownMetricCard';
import appSettings from '../../config/app-settings';
import { fetchAPI, buildQueryParams } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';
import { Agent, AgentListResponse, PaginationInfo, AgentFilterState, TimeRangeOption } from '../../types/agent';
import PageHeader from '../PageHeader';
import PageContainer from '../PageContainer';
import PageTemplate from '../PageTemplate';
import MetricsDisplay from '../MetricsDisplay';
import ContentSection from '../ContentSection';
import { ServerIcon, BoltIcon, ExclamationTriangleIcon, ClockIcon, ChevronRightIcon, ChevronLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import { SPACING } from '../spacing';
import RefreshButton from '../RefreshButton';
import { RiRobot2Line } from 'react-icons/ri';
import Link from 'next/link';

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

// Helper to filter agents based on time range
const isAgentInTimeRange = (agent: Agent, timeRange: TimeRangeOption): boolean => {
  const lastActive = new Date(agent.updated_at);
  const now = new Date();
  
  let timeThreshold: Date;
  
  // Calculate threshold date based on time range
  switch (timeRange) {
    case '24h':
      timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
  }
  
  return lastActive >= timeThreshold;
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

  // Get initial filters from URL - only once on initial mount
  const searchParams = useSearchParams();
  const didInitializeFromUrl = useRef(false);
  const didMount = useRef(false); // NEW: track first render

  // Initialize filters from URL only on first mount
  useEffect(() => {
    if (!didInitializeFromUrl.current) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Update URL with current filters, but skip first render
  const updatingUrl = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (updatingUrl.current) return;
    updatingUrl.current = true;
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.set(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    } finally {
      setTimeout(() => {
        updatingUrl.current = false;
      }, 0);
    }
  }, [filters, pathname, router]);

  // Fetch agent data
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a clean params object excluding undefined/empty values
      const params: Record<string, any> = {};
      
      // Only add defined values
      if (filters.page) params.page = filters.page;
      params.page_size = 10; // Fixed page size for MVP
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_dir) params.sort_dir = filters.sort_dir;
      if (filters.search) params.search = filters.search;
      if (filters.time_range) params.time_range = filters.time_range;
      
      // Don't send status in API call - we'll filter client side
      // to ensure our active/inactive logic is consistent
      
      console.log('Fetching agents with params:', params);
      
      // Fetch agents using the API client with the proper endpoint
      const data = await fetchAPI<AgentListResponse>(
        `${AGENTS.LIST}${buildQueryParams(params)}`
      );
      
      // Process agents data
      let filteredAgents = data.items || [];
      const currentStatus = filters.status;
      const currentTimeRange = filters.time_range as TimeRangeOption;
      
      console.log('Current filters - status:', currentStatus, 'time_range:', currentTimeRange);
      
      // Apply time range filter first - this affects all data including active/inactive status
      if (currentTimeRange) {
        console.log(`Filtering for agents active in the last ${currentTimeRange}`);
        filteredAgents = filteredAgents.filter(agent => isAgentInTimeRange(agent, currentTimeRange));
      }
      
      // Then apply active/inactive filter on top of the time range filtered results
      if (currentStatus === 'active') {
        console.log('Filtering for active agents');
        filteredAgents = filteredAgents.filter(agent => isAgentActive(agent));
      } else if (currentStatus === 'inactive') {
        console.log('Filtering for inactive agents');
        filteredAgents = filteredAgents.filter(agent => !isAgentActive(agent));
      }
      
      setAgents(filteredAgents);
      
      // Adjust pagination for client-side filtered results
      setPagination({
        ...data.pagination,
        total: filteredAgents.length,
        total_pages: Math.max(1, Math.ceil(filteredAgents.length / data.pagination.page_size))
      });
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
  const processingFilterChange = useRef(false);
  
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    // Prevent re-entrancy
    if (processingFilterChange.current) return;
    processingFilterChange.current = true;
    
    try {
      // Check if there are actual changes
      const currentFilters = { ...filters };
      let hasChanges = false;
      
      // Handle clearing all filters - special case for empty object
      if (Object.keys(newFilters).length === 0) {
        const updatedFilters = {
          // Only preserve pagination and time range
          page: 1, // Reset to page 1 when clearing filters
          time_range: filters.time_range
        };
        
        // If any filter fields were removed, mark as changed
        if (Object.keys(filters).some(key => 
          key !== 'page' && key !== 'time_range' && filters[key] !== undefined)) {
          hasChanges = true;
        }
        
        if (hasChanges) {
          console.log("Clearing all filters:", updatedFilters);
          setFilters(updatedFilters);
        }
        return;
      }
      
      // Handle incoming filter changes from FilterBar
      const fullFilterUpdate = Object.keys(newFilters).length > 1 || 
        (Object.keys(newFilters).length === 1 && !('page' in newFilters));
      
      // Check for different types of updates
      if (fullFilterUpdate) {
        // Full filter state update (from FilterBar)
        const updatedFilters = { 
          // Preserve pagination and time range
          page: filters.page, 
          time_range: filters.time_range
        };
        
        // Add all non-empty new filters
        Object.entries(newFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            updatedFilters[key] = value;
            
            // Check if this is a change
            if (filters[key] !== value) {
              hasChanges = true;
            }
          }
        });
        
        // Check if filters were removed
        Object.keys(filters).forEach(key => {
          if (key !== 'page' && key !== 'time_range' && 
              !(key in updatedFilters) && filters[key] !== undefined) {
            hasChanges = true;
          }
        });
        
        // Reset to page 1 if filters changed
        if (hasChanges) {
          updatedFilters.page = 1;
        }
        
        // Only update if there are changes
        if (hasChanges) {
          console.log("Updating filters:", updatedFilters);
          setFilters(updatedFilters);
        }
      } else {
        // Individual filter change
        const updatedFilters = { ...filters };
        
        // Apply changes
        Object.entries(newFilters).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            if (key in updatedFilters) {
              delete updatedFilters[key];
              hasChanges = true;
            }
          } else if (updatedFilters[key] !== value) {
            updatedFilters[key] = value;
            hasChanges = true;
          }
        });
        
        // Reset page to 1 if filter changed (except for page changes)
        if (hasChanges && !('page' in newFilters)) {
          updatedFilters.page = 1;
        }
        
        // Only update if there are changes
        if (hasChanges) {
          console.log("Updating filters:", updatedFilters);
          setFilters(updatedFilters);
        }
      }
    } finally {
      // Reset processing flag in next tick
      setTimeout(() => {
        processingFilterChange.current = false;
      }, 0);
    }
  }, [filters]);
  
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
      defaultValue: '' // Don't derive from filters to avoid circular dependency
    },
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search agent name...',
      defaultValue: '' // Don't derive from filters to avoid circular dependency
    }
  ], [appSettings.agents.activeThresholdHours]); // Only depends on app settings

  // Process data for metric cards
  const metricsData = useMemo(() => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(agent => isAgentActive(agent)).length;
    const errorAgents = agents.filter(agent => agent.status === 'error').length;
    const inactiveAgents = totalAgents - activeAgents;
    
    return [
      {
        title: 'Total Agents',
        value: totalAgents,
        variant: 'primary' as const,
        icon: <RiRobot2Line className="h-6 w-6" />
      },
      {
        title: 'Active (last 24h)',
        value: activeAgents,
        variant: 'success' as const,
        icon: <BoltIcon className="h-6 w-6" />
      },
      {
        title: 'Error State',
        value: errorAgents,
        variant: 'error' as const,
        icon: <ExclamationTriangleIcon className="h-6 w-6" />
      },
      {
        title: 'Inactive',
        value: inactiveAgents,
        variant: 'neutral' as const,
        icon: <ClockIcon className="h-6 w-6" />
      }
    ];
  }, [agents]);
  
  const breadcrumbs = [
    { label: 'Agents', current: true }
  ];

  // Add refresh key state
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Add refresh handler function after fetchAgents function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLoading(true);
    fetchAgents();
  };
  
  return (
    <PageTemplate
      title="Agents Explorer"
      description="Monitor, manage, and analyze your AI agents' activities and performance"
      breadcrumbs={breadcrumbs}
      timeRange={timeRange}
      onTimeRangeChange={handleTimeRangeChange}
      headerContent={<RefreshButton onClick={handleRefresh} />}
      contentSpacing="default"
    >
      {loading ? (
        <LoadingState variant="skeleton" contentType="table" />
      ) : error ? (
        <ErrorMessage 
          message={error}
          severity="error"
          retryText="Retry"
          onRetry={fetchAgents}
        />
      ) : (
        <>
          {/* Metrics Overview */}
          <MetricsDisplay
            metrics={metricsData}
            metricCardComponent={DrilldownMetricCard}
            columns={{ default: 1, sm: 2, lg: 4 }}
          />
          
          {/* Filters Section */}
          <ContentSection spacing="default">
            <FilterBar
              filters={[
                {
                  id: 'search',
                  label: 'Search',
                  type: 'search',
                  placeholder: 'Search agent name...',
                  defaultValue: filters.search || ''
                },
                {
                  id: 'status',
                  label: 'Status',
                  type: 'select',
                  options: [
                    { value: 'all', label: 'All' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ],
                  defaultValue: filters.status || 'all'
                },
                {
                  id: 'sort_by',
                  label: 'Sort By',
                  type: 'select',
                  options: [
                    { value: 'updated_at', label: 'Last Updated' },
                    { value: 'name', label: 'Name' },
                    { value: 'request_count', label: 'Requests' }
                  ],
                  defaultValue: filters.sort_by || 'updated_at'
                }
              ]}
              onFilterChange={handleFilterChange}
              preserveFiltersInUrl={true}
            />
          </ContentSection>
          
          {/* Agents Table */}
          <ContentSection spacing="default">
            <AgentsTable 
              agents={agents}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </ContentSection>
        </>
      )}
    </PageTemplate>
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
  
  // Get status badge with appropriate color
  const getStatusBadge = (agent: Agent) => {
    if (agent.error_count > 0) {
      return <Badge color="rose" size="sm">Error</Badge>;
    }
    
    if (isAgentActive(agent)) {
      return <Badge color="emerald" size="sm">Active</Badge>;
    }
    
    return <Badge color="gray" size="sm">Inactive</Badge>;
  };
  
  // Format date for display
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
      <Flex justifyContent="between" className="mt-6">
        <Text>
          Showing {agents.length} of {pagination.total} agents
        </Text>
        <Flex className="gap-2">
          <Button
            size="xs"
            icon={ChevronLeftIcon}
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="border border-gray-200"
          >
            Previous
          </Button>
          <Button
            size="xs"
            icon={ChevronRightIcon}
            iconPosition="right"
            disabled={page === total_pages}
            onClick={() => onPageChange(page + 1)}
            className="border border-gray-200"
          >
            Next
          </Button>
        </Flex>
      </Flex>
    );
  };
  
  // Agents Table styling - empty state
  if (!agents.length) {
    return (
      <div className="text-center py-12">
        <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <Title>No agents found</Title>
        <Text className="mt-2">
          No agents match your current filters. Try adjusting your filters or time range.
        </Text>
      </div>
    );
  }
  
  return (
    <div className="AgentsTable">
      <Table className="border border-gray-200 rounded-lg overflow-hidden w-full table-fixed bg-white">
        <TableHead className="bg-gray-50">
          <TableRow className="border-b border-gray-200">
            <TableHeaderCell className="font-semibold text-gray-700 w-[20%]">Name</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[15%]">Status</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[15%] text-right">Requests</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[15%] text-right">Errors</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[25%]">Last Updated</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[10%]">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {agents.map((agent) => (
            <TableRow 
              key={agent.agent_id} 
              className="border-b border-gray-100 transition-colors hover:bg-blue-50/30 cursor-pointer"
              onClick={() => handleRowClick(agent.agent_id)}
            >
              <TableCell className="font-medium text-primary-600">
                {agent.name}
              </TableCell>
              <TableCell>
                {getStatusBadge(agent)}
              </TableCell>
              <TableCell className="text-right">
                {(agent.request_count || 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {(agent.error_count || 0).toLocaleString()}
              </TableCell>
              <TableCell>
                <Flex justifyContent="start" alignItems="center" className="gap-1">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <Text>{formatDate(agent.updated_at)}</Text>
                </Flex>
              </TableCell>
              <TableCell>
                <Link href={`/agents/${agent.agent_id}`} onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="light" 
                    size="xs" 
                    icon={EyeIcon}
                    tooltip="View Agent Details"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {renderPagination()}
    </div>
  );
} 