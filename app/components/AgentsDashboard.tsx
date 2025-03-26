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
} from '@tremor/react';
import { FaSearch, FaSync, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePagination } from '@/hooks/usePagination';
import { Agent } from '@/types/api';
import apiClient, { EnhancedApiError, createEnhancedApiError } from '@/lib/api/client';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Pagination } from '@/components/ui/pagination';

export function AgentsDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('last_active');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds by default
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EnhancedApiError | null>(null);
  const [data, setData] = useState<{items: Agent[], total: number} | null>(null);

  // Use the pagination hook
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    initialSortBy: 'last_active',
    initialSortOrder: 'desc'
  });

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        page: pagination.page,
        page_size: pagination.pageSize,
        sort_by: sortField,
        sort_order: sortDirection
      };
      
      const response = await apiClient.get('/agents/', { params: queryParams });
      setData(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching agents:', err);
      
      // More detailed error handling
      if (err instanceof Error) {
        setError(createEnhancedApiError(err));
      } else {
        setError(createEnhancedApiError('Failed to load agents. Please try again later.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAgents();
  }, [pagination.page, pagination.pageSize, sortField, sortDirection]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (refreshInterval === 0) return; // No refresh

    const intervalId = setInterval(() => {
      fetchAgents();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Filter agents whenever dependencies change
  useEffect(() => {
    if (!data?.items) return;
    
    let result = [...data.items];

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(lowerQuery) ||
          agent.description.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter((agent) => agent.active === isActive);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter((agent) => agent.version === typeFilter);
    }

    setFilteredAgents(result);
  }, [data, searchQuery, statusFilter, typeFilter]);

  // Get unique agent types for the filter
  const agentTypes = data?.items ? Array.from(new Set(data.items.map((agent) => agent.version))) : [];

  // Manual refresh handler
  const handleRefresh = () => {
    fetchAgents();
  };

  // Handle row click to navigate to agent details
  const handleRowClick = (agentId: string) => {
    router.push(`/agents/${agentId}`);
  };

  // Format the last active date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Never';
    
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
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

  // Render status badge
  const StatusBadge = ({ active }: { active: boolean }) => {
    return (
      <Badge
        color={active ? 'green' : 'gray'}
        icon={active ? undefined : undefined}
      >
        {active ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  return (
    <div className="p-4 mx-auto max-w-7xl">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <div>
          <Title>Agent Management</Title>
          <Text>View and manage all registered agents</Text>
        </div>
        <div className="flex items-center gap-2">
          <Text className="text-sm text-gray-500">
            {lastUpdated
              ? `Last updated: ${formatDate(lastUpdated)}`
              : 'Not yet updated'}
          </Text>
          <div className="flex gap-2">
            <Select
              className="w-40"
              value={refreshInterval.toString()}
              onValueChange={(value) => setRefreshInterval(parseInt(value, 10))}
            >
              <SelectItem value="0">No auto-refresh</SelectItem>
              <SelectItem value="5000">5 seconds</SelectItem>
              <SelectItem value="10000">10 seconds</SelectItem>
              <SelectItem value="30000">30 seconds</SelectItem>
              <SelectItem value="60000">1 minute</SelectItem>
            </Select>
            <Button
              variant="secondary"
              icon={FaSync}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Link href="/agents/new">
              <Button>Add Agent</Button>
            </Link>
          </div>
        </div>
      </Flex>

      <Grid numItemsMd={3} className="gap-6 mb-6">
        <Card>
          <div className="h-28">
            <Text>Total Agents</Text>
            <Metric>{data?.total || 0}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Text>Active Agents</Text>
            <Metric>{data?.items?.filter(a => a.active).length || 0}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Text>Inactive Agents</Text>
            <Metric>{data?.items?.filter(a => !a.active).length || 0}</Metric>
          </div>
        </Card>
      </Grid>

      <Card>
        <Flex justifyContent="between" className="mb-4 gap-2">
          <TextInput
            icon={FaSearch}
            placeholder="Search agents..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-2">
            <Select
              className="w-40"
              placeholder="Filter by status"
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </Select>
            <Select
              className="w-40"
              placeholder="Filter by type"
              value={typeFilter}
              onValueChange={setTypeFilter}
              disabled={!agentTypes.length}
            >
              <SelectItem value="all">All Types</SelectItem>
              {agentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </Select>
            <Select
              className="w-40"
              value={`${sortField}-${sortDirection}`}
              onValueChange={(value) => {
                const [field, direction] = value.split('-');
                setSortField(field);
                setSortDirection(direction as 'asc' | 'desc');
              }}
            >
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="last_active-desc">
                Most Recently Active
              </SelectItem>
              <SelectItem value="last_active-asc">Least Recently Active</SelectItem>
            </Select>
          </div>
        </Flex>

        {error && (
          <div className="mb-4">
            <ErrorDisplay 
              error={error} 
              title="Failed to load agents"
              onRetry={fetchAgents}
              onClear={() => setError(null)}
              withDetails={true}
            />
          </div>
        )}

        {loading && !data?.items?.length ? (
          <LoadingState message="Loading agents..." />
        ) : filteredAgents.length === 0 ? (
          <div className="py-10 text-center">
            <Text className="text-gray-500">No agents found</Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Version</TableHeaderCell>
                <TableHeaderCell>Last Active</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow 
                  key={agent.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(agent.agent_id)}
                >
                  <TableCell>{agent.name}</TableCell>
                  <TableCell><StatusBadge active={agent.active} /></TableCell>
                  <TableCell>{agent.version}</TableCell>
                  <TableCell>{formatDate(agent.last_active)}</TableCell>
                  <TableCell className="max-w-xs truncate">{agent.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="light"
                      icon={FaChevronRight}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(agent.agent_id);
                      }}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {data && (
          <div className="mt-4">
            <Pagination
              currentPage={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={data.total}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        )}
      </Card>
    </div>
  );
} 