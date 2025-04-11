'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Badge, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Select, SelectItem } from '@tremor/react';
import { UserGroupIcon, ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import BreadcrumbNavigation from '../../../components/drilldown/BreadcrumbNavigation';
import LoadingState from '../../../components/LoadingState';
import ErrorMessage from '../../../components/ErrorMessage';

// Types
type Session = {
  session_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  event_count: number;
  llm_request_count: number;
  tool_execution_count: number;
  error_count: number;
  status: string;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

interface AgentSessionsPageProps {
  params: {
    id: string;
  };
}

export default function AgentSessionsPage({ params }: AgentSessionsPageProps) {
  const agentId = params.id;
  
  // State
  const [agentName, setAgentName] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 0
  });
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch agent basic info for the name
        const agentResponse = await fetch(`/api/agents/${agentId}`);
        if (!agentResponse.ok) {
          throw new Error(`Failed to fetch agent: ${agentResponse.statusText}`);
        }
        const agentData = await agentResponse.json();
        setAgentName(agentData.name);
        
        // Fetch sessions data
        // In a real implementation, this would use a real API endpoint
        // For MVP, we're using sample data
        const sampleSessions: Session[] = [];
        const statuses = ['completed', 'in_progress', 'error'];
        const now = new Date();
        
        for (let i = 0; i < 15; i++) {
          const startDate = new Date(now);
          startDate.setHours(startDate.getHours() - Math.floor(Math.random() * 24 * 7));
          const durationSeconds = Math.floor(Math.random() * 3600);
          const endDate = new Date(startDate);
          endDate.setSeconds(endDate.getSeconds() + durationSeconds);
          
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const errorCount = status === 'error' ? Math.floor(Math.random() * 5) + 1 : 0;
          
          sampleSessions.push({
            session_id: `sess-${i.toString().padStart(5, '0')}`,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            duration_seconds: durationSeconds,
            event_count: Math.floor(Math.random() * 100) + 20,
            llm_request_count: Math.floor(Math.random() * 20) + 5,
            tool_execution_count: Math.floor(Math.random() * 30) + 2,
            error_count: errorCount,
            status
          });
        }
        
        // Sort sessions by start time, newest first
        sampleSessions.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
        
        // Apply status filter if not 'all'
        const filteredSessions = statusFilter === 'all' 
          ? sampleSessions 
          : sampleSessions.filter(s => s.status === statusFilter);
        
        // Update pagination
        const totalItems = filteredSessions.length;
        const totalPages = Math.ceil(totalItems / pagination.page_size);
        
        // Paginate results
        const startIndex = (pagination.page - 1) * pagination.page_size;
        const endIndex = startIndex + pagination.page_size;
        const paginatedSessions = filteredSessions.slice(startIndex, endIndex);
        
        setSessions(paginatedSessions);
        setPagination({
          ...pagination,
          total_items: totalItems,
          total_pages: totalPages
        });
        
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, timeRange, statusFilter, pagination.page, pagination.page_size]);

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return <Badge color="green">Completed</Badge>;
      case 'in_progress':
        return <Badge color="blue">In Progress</Badge>;
      case 'error':
        return <Badge color="red">Error</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page when filter changes
  };

  if (loading) {
    return <LoadingState message="Loading session data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <BreadcrumbNavigation
        items={[
          { label: 'Agents', href: '/agents' },
          { label: agentName, href: `/agents/${agentId}` },
          { label: 'Sessions', href: `/agents/${agentId}/sessions` },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title className="text-2xl font-bold">Agent Sessions</Title>
          <Text>Session history for this agent</Text>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-40">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </Select>
          </div>
          <Link href={`/agents/${agentId}`}>
            <div className="flex items-center text-blue-500 hover:underline cursor-pointer">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              <span>Back to Agent Overview</span>
            </div>
          </Link>
        </div>
      </div>
      
      <Card>
        <div className="mb-4">
          <Title>Session History</Title>
          <Text>Detailed list of agent sessions</Text>
        </div>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Session ID</TableHeaderCell>
              <TableHeaderCell>Start Time</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
              <TableHeaderCell>Events</TableHeaderCell>
              <TableHeaderCell>LLM Requests</TableHeaderCell>
              <TableHeaderCell>Tool Executions</TableHeaderCell>
              <TableHeaderCell>Errors</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.session_id}>
                <TableCell className="font-medium">{session.session_id}</TableCell>
                <TableCell>{formatTimestamp(session.start_time)}</TableCell>
                <TableCell>{formatDuration(session.duration_seconds)}</TableCell>
                <TableCell>{session.event_count}</TableCell>
                <TableCell>{session.llm_request_count}</TableCell>
                <TableCell>{session.tool_execution_count}</TableCell>
                <TableCell className={session.error_count > 0 ? 'text-red-500 font-medium' : ''}>
                  {session.error_count}
                </TableCell>
                <TableCell>
                  <StatusBadge status={session.status} />
                </TableCell>
                <TableCell>
                  <Link href={`/agents/${agentId}/sessions/${session.session_id}`}>
                    <div className="flex items-center text-blue-500 hover:underline cursor-pointer">
                      <span className="mr-1">Details</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </div>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Text>
              Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_items)} of {pagination.total_items} sessions
            </Text>
            
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                disabled={pagination.page === pagination.total_pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 