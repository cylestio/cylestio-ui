'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button } from '@tremor/react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronRightIcon
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

  // Fetch sessions data
  useEffect(() => {
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
          `${AGENTS.SESSIONS(agentId)}?time_range=${timeRange}&page=${pagination.page}&page_size=${pagination.page_size}`
        );
        
        setSessions(data.items || []);
        setPagination({
          page: data.page || 1,
          page_size: data.page_size || 10,
          total_items: data.total_items || 0,
          total_pages: data.total_pages || 0
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [agentId, timeRange, pagination.page, pagination.page_size]);

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
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.total_pages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
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
        <Title>Recent Sessions</Title>
        <Text className="mt-2">No sessions found for this time period</Text>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Title>Recent Sessions</Title>
        <Text>Sessions for this agent in the selected time period</Text>
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
              <TableCell className="font-medium">{session.session_id.slice(0, 8)}...</TableCell>
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
                  <Button 
                    variant="light" 
                    color="blue"
                    size="xs"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronRightIcon className="h-4 w-4" />
                      <span>Details</span>
                    </div>
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Text>
            Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_items)} of {pagination.total_items} sessions
          </Text>
          
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              disabled={pagination.page === 1}
              onClick={handlePrevPage}
              size="xs"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={pagination.page === pagination.total_pages}
              onClick={handleNextPage}
              size="xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-right">
        <Link href={`/agents/${agentId}/sessions`}>
          <Button variant="light">
            <div className="flex items-center gap-1">
              <ArrowPathIcon className="h-4 w-4" />
              <span>View All Sessions</span>
            </div>
          </Button>
        </Link>
      </div>
    </div>
  );
} 