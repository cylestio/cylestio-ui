'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button, Flex } from '@tremor/react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import LoadingState from '../../components/LoadingState';
import ErrorMessage from '../../components/ErrorMessage';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';

// Types
type Session = {
  session_id: string;
  start_time: string;
  end_time?: string;
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

interface AgentSessionsTableProps {
  agentId: string;
  timeRange: string;
}

export function AgentSessionsTable({ agentId, timeRange }: AgentSessionsTableProps) {
  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track if we should fetch data to avoid unnecessary API calls
  const [shouldFetch, setShouldFetch] = useState(true);

  // Fetch sessions data
  useEffect(() => {
    // Skip API call if we don't have an agent ID
    if (!agentId) {
      setLoading(false);
      setError("No agent ID provided");
      return;
    }

    // Only fetch data when needed
    if (!shouldFetch) return;

    let isMounted = true;
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchAPI<{
          items: Session[];
          page: number;
          page_size: number;
          total_items: number;
          total_pages: number;
        }>(
          `${AGENTS.SESSIONS(agentId)}?time_range=${timeRange}&page=${pagination.page}&page_size=${pagination.page_size}&sort_by=start_time&sort_dir=desc`
        );
        
        // Check if component is still mounted before updating state
        if (!isMounted) return;
        
        setSessions(data.items || []);
        setPagination({
          page: data.page || 1,
          page_size: data.page_size || 10,
          total_items: data.total_items || 0,
          total_pages: data.total_pages || 0
        });
        // Reset the fetch flag
        setShouldFetch(false);
      } catch (err: any) {
        console.error('Error fetching sessions:', err);
        if (isMounted) {
          setError(err.message || 'An error occurred while fetching sessions');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSessions();
    
    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange, pagination.page, pagination.page_size, shouldFetch]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(1)}m`;
    } else {
      return `${(seconds / 3600).toFixed(1)}h`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <Badge color="green">
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Completed</span>
            </div>
          </Badge>
        );
      case 'active':
        return (
          <Badge color="blue">
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>Active</span>
            </div>
          </Badge>
        );
      case 'error':
        return (
          <Badge color="red">
            <div className="flex items-center gap-1">
              <XCircleIcon className="h-4 w-4" />
              <span>Error</span>
            </div>
          </Badge>
        );
      case 'warning':
        return (
          <Badge color="amber">
            <div className="flex items-center gap-1">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Warning</span>
            </div>
          </Badge>
        );
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 });
      setShouldFetch(true);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.total_pages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
      setShouldFetch(true);
    }
  };

  if (loading) {
    return <LoadingState message="Loading sessions..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Text className="mt-2">No sessions found for this time period</Text>
      </div>
    );
  }

  return (
    <div>
      <Table className="border border-gray-200 rounded-lg overflow-hidden w-full table-fixed bg-white">
        <TableHead className="bg-gray-50">
          <TableRow className="border-b border-gray-200">
            <TableHeaderCell className="font-semibold text-gray-700 w-[15%]">Start Time</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[15%]">End Time</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[15%]">Session ID</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[10%]">Duration</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[8%]">Events</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[10%]">LLM Requests</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[8%]">Tool Executions</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[7%]">Errors</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[7%]">Status</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[5%]">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow 
              key={session.session_id} 
              className="border-b border-gray-100 transition-colors hover:bg-blue-50/30 cursor-pointer"
              onClick={() => {
                window.location.href = `/events/session/${session.session_id}`;
              }}
            >
              <TableCell>
                <Flex justifyContent="start" alignItems="center" className="gap-1">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <Text>{formatTimestamp(session.start_time)}</Text>
                </Flex>
              </TableCell>
              <TableCell>
                {session.end_time ? (
                  <Flex justifyContent="start" alignItems="center" className="gap-1">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <Text>{formatTimestamp(session.end_time)}</Text>
                  </Flex>
                ) : (
                  <Text className="text-gray-500 italic">In progress</Text>
                )}
              </TableCell>
              <TableCell className="font-medium">{session.session_id}</TableCell>
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
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Link href={`/events/session/${session.session_id}`}>
                  <Button 
                    variant="light" 
                    size="xs" 
                    icon={ChevronRightIcon}
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

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <Flex justifyContent="between" className="mt-6">
          <Text>
            Showing {sessions.length} of {pagination.total_items} sessions
          </Text>
          <Flex className="gap-2">
            <Button
              size="xs"
              icon={ArrowLeftIcon}
              disabled={pagination.page === 1}
              onClick={handlePrevPage}
              className="border border-gray-200"
            >
              Previous
            </Button>
            <Button
              size="xs"
              icon={ChevronRightIcon}
              iconPosition="right"
              disabled={pagination.page === pagination.total_pages}
              onClick={handleNextPage}
              className="border border-gray-200"
            >
              Next
            </Button>
          </Flex>
        </Flex>
      )}
    </div>
  );
} 