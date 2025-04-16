'use client'

import { useState } from 'react'
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Badge,
  Button,
  Flex,
  Select,
  SelectItem,
  Divider
} from '@tremor/react'
import {
  ClockIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

// Define request types
export type LLMRequest = {
  id: string;
  timestamp: string;
  trace_id: string;
  span_id: string;
  model: string;
  status: 'success' | 'error' | 'timeout' | 'filtered' | 'pending' | 'canceled';
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  prompt_summary: string;
  completion_summary: string;
  error: string | null;
  agent_id?: string;
  agent_name?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  parent_id?: string;
}

export type LLMRequestsPagination = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LLMRequestsTableProps {
  requests: LLMRequest[];
  pagination: LLMRequestsPagination;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRequestClick: (requestId: string) => void;
  onViewConversation?: (traceId: string) => void;
  loading?: boolean;
  className?: string;
}

// Map status to badge color
const statusColorMap: Record<string, string> = {
  success: 'emerald',
  error: 'red',
  timeout: 'amber',
  filtered: 'purple',
  pending: 'blue',
  canceled: 'gray'
}

// Get duration color based on time
const getDurationColor = (duration: number): string => {
  if (duration < 1000) return 'emerald';
  if (duration < 3000) return 'blue';
  if (duration < 5000) return 'amber';
  return 'red';
}

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
}

// Format duration for display
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Truncate text with ellipsis
const truncateText = (text: string, length: number): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
}

export default function LLMRequestsTable({
  requests,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRequestClick,
  onViewConversation,
  loading = false,
  className = ''
}: LLMRequestsTableProps) {
  
  // Available page size options
  const pageSizeOptions = [10, 25, 50, 100];
  
  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    onPageSizeChange(parseInt(value));
  };
  
  // Handle navigation to previous page
  const goToPrevPage = () => {
    if (pagination.has_prev) {
      onPageChange(pagination.page - 1);
    }
  };
  
  // Handle navigation to next page
  const goToNextPage = () => {
    if (pagination.has_next) {
      onPageChange(pagination.page + 1);
    }
  };
  
  // Handle clicking on a request
  const handleRequestClick = (requestId: string) => {
    onRequestClick(requestId);
  };
  
  return (
    <Card className={`w-full ${className}`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Model</TableHeaderCell>
              <TableHeaderCell>Agent</TableHeaderCell>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
              <TableHeaderCell>Tokens (In/Out)</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading ? (
              Array.from({ length: pagination.page_size }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell colSpan={7}>
                    <div className="animate-pulse h-10 bg-gray-100 rounded"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="text-center py-4 text-gray-500">
                    <p>No LLM requests found.</p>
                    <p className="text-sm mt-2">This could be due to:</p>
                    <ul className="text-sm list-disc list-inside mt-1">
                      <li>No matching data for the selected filters</li>
                      <li>API connection issue</li>
                      <li>The selected time range contains no data</li>
                    </ul>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Text className="font-medium">{request.model}</Text>
                  </TableCell>
                  
                  <TableCell>
                    <Text>{request.agent_name || request.agent_id || '-'}</Text>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <Text>{formatDate(request.timestamp)}</Text>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge color={getDurationColor(request.duration_ms)} size="xs">
                      {formatDuration(request.duration_ms)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Text>
                      {(request.input_tokens || 0).toLocaleString()} / {(request.output_tokens || 0).toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Total: {((request.input_tokens || 0) + (request.output_tokens || 0)).toLocaleString()}
                    </Text>
                  </TableCell>
                  
                  <TableCell>
                    <Badge color={statusColorMap[request.status] || 'gray'}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Flex justifyContent="start" className="gap-2">
                      {onViewConversation ? (
                        <Button
                          variant="light"
                          color="blue"
                          size="xs"
                          onClick={(e) => {
                            onViewConversation(request.trace_id);
                          }}
                        >
                          Watch full conversation
                        </Button>
                      ) : (
                        <Link
                          href={`/trace/${request.trace_id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Trace
                        </Link>
                      )}
                    </Flex>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 px-2">
        <div className="flex items-center gap-2">
          <Text>Rows per page:</Text>
          <Select
            value={String(pagination.page_size)}
            onValueChange={handlePageSizeChange}
            className="w-20"
          >
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </Select>
          
          <Text className="ml-4">
            {pagination.total > 0 ? (
              <>
                Showing {(pagination.page - 1) * pagination.page_size + 1} to{' '}
                {Math.min(pagination.page * pagination.page_size, pagination.total)} of{' '}
                {pagination.total} results
              </>
            ) : (
              'No results'
            )}
          </Text>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            icon={ChevronLeftIcon}
            variant="light"
            disabled={!pagination.has_prev || loading}
            onClick={goToPrevPage}
          >
            Previous
          </Button>
          
          <Text>
            Page {pagination.page} of {pagination.total_pages}
          </Text>
          
          <Button
            icon={ChevronRightIcon}
            iconPosition="right"
            variant="light"
            disabled={!pagination.has_next || loading}
            onClick={goToNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
} 