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
import { MagnifyingGlassIcon, ArrowPathIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define types
type AgentData = {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'error';
  type: string;
  last_active: string;
  event_count: number;
};

export function AgentsDashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof AgentData>('last_active');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds by default
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch agents
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAgents();
  }, []);

  // Set up polling for real-time updates
  useEffect(() => {
    if (refreshInterval === 0) return; // No refresh

    const intervalId = setInterval(() => {
      fetchAgents();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Filter and sort agents whenever dependencies change
  useEffect(() => {
    let result = [...agents];

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(lowerQuery) ||
          agent.type.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((agent) => agent.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter((agent) => agent.type === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];

      // Handle string comparison
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc'
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }

      // Handle number comparison
      return sortDirection === 'asc'
        ? (fieldA as number) - (fieldB as number)
        : (fieldB as number) - (fieldA as number);
    });

    setFilteredAgents(result);
  }, [agents, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

  // Get unique agent types for the filter
  const agentTypes = Array.from(new Set(agents.map((agent) => agent.type)));

  // Format the last active date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
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
    switch (status) {
      case 'active':
        return <Badge color="green">Active</Badge>;
      case 'inactive':
        return <Badge color="gray">Inactive</Badge>;
      case 'error':
        return <Badge color="red">Error</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const handleRowClick = (agentId: number) => {
    router.push(`/agents/${agentId}`);
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
            <Metric>{agents.length}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Text>Active Agents</Text>
            <Metric>{agents.filter(a => a.status === 'active').length}</Metric>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Text>Agents with Errors</Text>
            <Metric>{agents.filter(a => a.status === 'error').length}</Metric>
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
              <SelectItem value="error">Error</SelectItem>
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
                  onClick={() => {
                    if (sortField === 'id') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('id');
                      setSortDirection('asc');
                    }
                  }}
                >
                  ID
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => {
                    if (sortField === 'name') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('name');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Name
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => {
                    if (sortField === 'status') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('status');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Status
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => {
                    if (sortField === 'type') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('type');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Type
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => {
                    if (sortField === 'last_active') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('last_active');
                      setSortDirection('desc');
                    }
                  }}
                >
                  Last Active
                </TableHeaderCell>
                <TableHeaderCell
                  className="cursor-pointer"
                  onClick={() => {
                    if (sortField === 'event_count') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('event_count');
                      setSortDirection('desc');
                    }
                  }}
                >
                  Events
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
              ) : filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Text>No agents found.</Text>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(agent.id)}
                  >
                    <TableCell>
                      <Badge color="blue">#{agent.id}</Badge>
                    </TableCell>
                    <TableCell>
                      <Text>{agent.name}</Text>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={agent.status} />
                    </TableCell>
                    <TableCell>
                      <Text>{agent.type}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{formatDate(agent.last_active)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{agent.event_count.toLocaleString()}</Text>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/agents/${agent.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Flex className="items-center gap-1">
                          <Text>View Details (ID: {agent.id})</Text>
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
      </Card>
    </div>
  );
} 