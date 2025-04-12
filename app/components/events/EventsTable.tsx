'use client';

import React from 'react';
import {
  Card,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Button,
  Title,
  Text,
  Flex,
  Select,
  SelectItem,
} from '@tremor/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Type for event data
type Event = {
  id: string;
  schema_version: string;
  timestamp: string;
  trace_id: string;
  span_id?: string;
  parent_span_id?: string;
  name: string;
  level: string;
  agent_id: string;
  attributes: Record<string, any>;
};

type EventsTableProps = {
  events: Event[];
  loading: boolean;
  error: string | null;
  limit: number;
  offset: number;
  totalEvents: number;
  onPageChange: (offset: number) => void;
  onViewEvent: (eventId: string) => void;
};

export function EventsTable({
  events,
  loading,
  error,
  limit,
  offset,
  totalEvents,
  onPageChange,
  onViewEvent,
}: EventsTableProps) {
  // Format timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get badge color based on level
  const getLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'rose';
      case 'warning':
        return 'amber';
      case 'info':
        return 'blue';
      case 'debug':
        return 'gray';
      case 'critical':
        return 'purple';
      case 'security_alert':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Get a friendly display name for event types
  const getEventTypeDisplay = (name: string): string => {
    // Map telemetry event names to display names
    const typeMap: Record<string, string> = {
      'llm.request': 'LLM Request',
      'llm.response': 'LLM Response',
      'llm.call.start': 'LLM Call Started',
      'llm.call.finish': 'LLM Call Finished',
      'tool.call': 'Tool Call',
      'tool.result': 'Tool Result',
      'tool.response': 'Tool Response',
      'session.start': 'Session Started',
      'session.end': 'Session Ended',
      'error': 'Error',
      'trace.start': 'Trace Started',
      'trace.end': 'Trace Ended',
      'message.user': 'User Message',
      'message.assistant': 'Assistant Message',
      'framework.initialization': 'Framework Initialized',
      'security.content.suspicious': 'Suspicious Content',
    };
    
    return typeMap[name] || name.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Calculate pagination
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalEvents / limit));

  // Handle page changes
  const handlePrevPage = () => {
    if (offset > 0) {
      onPageChange(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (offset + limit < totalEvents) {
      onPageChange(offset + limit);
    }
  };

  return (
    <Card>
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <Title>Events</Title>
        <Text>
          Showing {Math.min(offset + 1, totalEvents)} to {Math.min(offset + limit, totalEvents)} of {totalEvents} events
        </Text>
      </Flex>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Text>Loading events...</Text>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center">
          <Text color="red">{error}</Text>
        </div>
      ) : events.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <Text>No events found for the selected filters.</Text>
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Timestamp</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Agent</TableHeaderCell>
                <TableHeaderCell>Level</TableHeaderCell>
                <TableHeaderCell>Trace ID</TableHeaderCell>
                <TableHeaderCell>Span</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                  <TableCell>{getEventTypeDisplay(event.name)}</TableCell>
                  <TableCell>
                    <Link href={`/agents/${event.agent_id}`}>
                      {event.agent_id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge color={getLevelColor(event.level)}>
                      {event.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/events/trace/${event.trace_id}`}>
                      {event.trace_id.substring(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell>
                    {event.parent_span_id ? (
                      <Text>
                        <span className="text-xs text-gray-500">↪</span>{' '}
                        {event.span_id?.substring(0, 6)}...
                      </Text>
                    ) : (
                      <Text>{event.span_id?.substring(0, 6)}...</Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="xs"
                      variant="light"
                      icon={EyeIcon}
                      onClick={() => onViewEvent(event.id)}
                      tooltip="View details"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Flex justifyContent="between" alignItems="center" className="mt-4">
            <Button
              icon={ArrowLeftIcon}
              variant="light"
              onClick={handlePrevPage}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <Text>
              Page {currentPage} of {totalPages}
            </Text>
            <Button
              icon={ArrowRightIcon}
              iconPosition="right"
              variant="light"
              onClick={handleNextPage}
              disabled={offset + limit >= totalEvents}
            >
              Next
            </Button>
          </Flex>
        </>
      )}
    </Card>
  );
} 