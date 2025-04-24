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
import { ServerIcon, BoltIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { SPACING } from '../spacing';
import RefreshButton from '../RefreshButton';

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
  const updatingUrl = useRef(false);
  
  useEffect(() => {
    // Only update URL after initial load and not during an existing update
    if (!didInitializeFromUrl.current || updatingUrl.current) return;
    
    // Set flag to indicate we're updating
    updatingUrl.current = true;
    
    try {
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
    } finally {
      // Reset flag once update is complete (in next tick)
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
        icon: <ServerIcon className="h-6 w-6" />
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
          <Text className="text-sm text-gray-500">Page {page} of {total_pages}</Text>
          <Button
            size="xs"
            variant="light"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className={`text-gray-600 ${page === 1 ? 'opacity-50' : ''}`}
          >
            Previous
          </Button>
          <Button
            size="xs"
            variant="light"
            disabled={page === total_pages}
            onClick={() => onPageChange(page + 1)}
            className={`text-gray-600 ${page === total_pages ? 'opacity-50' : ''}`}
          >
            Next
          </Button>
        </div>
      </Flex>
    );
  };
  
  // Agents Table styling
  if (!agents.length) {
    return (
      <div className="text-center py-8 border-t border-gray-100">
        <ServerIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <Text className="text-base text-gray-700 mb-2">No Agents Found</Text>
        <Text className="text-sm text-gray-500 mb-5">
          Please check database connectivity or create agents first.
        </Text>
        <Button 
          variant="light"
          onClick={() => router.push('/settings/agents/create')}
          className="mx-auto text-primary-600"
        >
          Create New Agent
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="border-t border-b border-gray-200">
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
            {agents.map((agent) => {
              // Add debugging log to see what's happening with the names
              console.log(`Agent name: "${agent.name}", After prefix removal: "${agent.name.startsWith('Agent-') ? agent.name.substring(6) : agent.name}"`);
              
              return (
                <TableRow 
                  key={agent.agent_id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors duration-150" 
                  onClick={() => handleRowClick(agent.agent_id)}
                >
                  <TableCell className="font-medium text-primary-600">
                    {agent.name}
                  </TableCell>
                  <TableCell>{getStatusBadge(agent)}</TableCell>
                  <TableCell className="text-right">{agent.request_count.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{agent.error_count.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(agent.updated_at)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {renderPagination()}
    </div>
  );
} 