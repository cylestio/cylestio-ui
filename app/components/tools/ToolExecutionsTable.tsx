'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Title,
  Text,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
  Flex,
  Select,
  SelectItem,
  TextInput
} from '@tremor/react';
import {
  ArrowsUpDownIcon,
  ClockIcon,
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Types
type ToolExecution = {
  id: string;
  timestamp: string;
  trace_id: string;
  span_id: string;
  agent_id: string;
  tool_name: string;
  tool_type: string;
  status: string;
  duration_ms: number;
  input_summary: string;
  output_summary: string;
  error: string | null;
};

type ToolExecutionsTableProps = {
  executions: ToolExecution[];
};

export default function ToolExecutionsTable({ executions }: ToolExecutionsTableProps) {
  const router = useRouter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Handle pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Handle sorting
  const sortedExecutions = [...executions].sort((a, b) => {
    let aValue: any = a[sortField as keyof ToolExecution];
    let bValue: any = b[sortField as keyof ToolExecution];
    
    // For timestamps, convert to Date objects
    if (sortField === 'timestamp') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Get current page data
  const currentData = sortedExecutions.slice(startIndex, endIndex);
  
  // Calculate total pages
  const totalPages = Math.ceil(executions.length / pageSize);
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle sorting
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      // If clicking the same field, toggle sort direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set as the sort field with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Format duration and determine color based on length
  const formatDuration = (ms: number): { text: string; color: 'green' | 'blue' | 'amber' | 'red' } => {
    let text = '';
    let color: 'green' | 'blue' | 'amber' | 'red' = 'green';
    
    if (ms < 100) {
      text = `${ms}ms`;
      color = 'green';
    } else if (ms < 1000) {
      text = `${ms}ms`;
      color = 'blue';
    } else if (ms < 5000) {
      text = `${(ms / 1000).toFixed(2)}s`;
      color = 'amber';
    } else {
      text = `${(ms / 1000).toFixed(2)}s`;
      color = 'red';
    }
    
    return { text, color };
  };
  
  // Get status color
  const getStatusColor = (status: string): 'green' | 'red' | 'amber' | 'blue' | 'gray' => {
    switch (status) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'timeout':
        return 'amber';
      case 'pending':
        return 'blue';
      default:
        return 'gray';
    }
  };
  
  // View execution details
  const handleViewDetails = (executionId: string) => {
    router.push(`/tools/executions/${executionId}`);
  };
  
  // Handle empty state
  if (executions.length === 0) {
    return (
      <Card className="mt-6">
        <div className="text-center py-10">
          <Text>No tool executions found matching the current filters.</Text>
          <Button 
            variant="light" 
            className="mt-4"
            onClick={() => window.location.href = '/tools'}
          >
            Reset Filters
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <Title>Tool Executions</Title>
        
        <Flex className="gap-2">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(parseInt(value))}
            className="w-32"
          >
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </Select>
          
          <TextInput
            icon={MagnifyingGlassIcon}
            placeholder="Search in results..."
            className="w-64"
          />
        </Flex>
      </Flex>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell 
              className="cursor-pointer"
              onClick={() => handleSortChange('timestamp')}
            >
              <Flex alignItems="center">
                Timestamp
                {sortField === 'timestamp' && (
                  <ArrowsUpDownIcon className="h-4 w-4 ml-1" />
                )}
              </Flex>
            </TableHeaderCell>
            
            <TableHeaderCell 
              className="cursor-pointer"
              onClick={() => handleSortChange('tool_name')}
            >
              <Flex alignItems="center">
                Tool Name
                {sortField === 'tool_name' && (
                  <ArrowsUpDownIcon className="h-4 w-4 ml-1" />
                )}
              </Flex>
            </TableHeaderCell>
            
            <TableHeaderCell>Type</TableHeaderCell>
            
            <TableHeaderCell 
              className="cursor-pointer"
              onClick={() => handleSortChange('status')}
            >
              <Flex alignItems="center">
                Status
                {sortField === 'status' && (
                  <ArrowsUpDownIcon className="h-4 w-4 ml-1" />
                )}
              </Flex>
            </TableHeaderCell>
            
            <TableHeaderCell 
              className="cursor-pointer"
              onClick={() => handleSortChange('duration_ms')}
            >
              <Flex alignItems="center">
                Duration
                {sortField === 'duration_ms' && (
                  <ArrowsUpDownIcon className="h-4 w-4 ml-1" />
                )}
              </Flex>
            </TableHeaderCell>
            
            <TableHeaderCell>Agent</TableHeaderCell>
            <TableHeaderCell>Input/Output</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        
        <TableBody>
          {currentData.map((execution) => {
            const duration = formatDuration(execution.duration_ms);
            
            return (
              <TableRow key={execution.id} className="hover:bg-gray-50">
                <TableCell>
                  <Text className="font-medium">{formatTimestamp(execution.timestamp)}</Text>
                  <Text className="text-xs text-gray-500">Trace: {execution.trace_id.substring(0, 8)}...</Text>
                </TableCell>
                
                <TableCell>
                  <Text className="font-medium">{execution.tool_name}</Text>
                </TableCell>
                
                <TableCell>
                  <Badge color="indigo">
                    {execution.tool_type}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    color={getStatusColor(execution.status)}
                    icon={
                      execution.status === 'success' ? CheckCircleIcon :
                      execution.status === 'error' ? ExclamationTriangleIcon : undefined
                    }
                  >
                    {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    color={duration.color}
                    icon={ClockIcon}
                  >
                    {duration.text}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <Text>{execution.agent_id.substring(0, 8)}...</Text>
                </TableCell>
                
                <TableCell>
                  <div className="max-w-xs">
                    <Text className="text-xs truncate" title={execution.input_summary}>
                      In: {execution.input_summary}
                    </Text>
                    {execution.status === 'success' ? (
                      <Text className="text-xs truncate" title={execution.output_summary}>
                        Out: {execution.output_summary}
                      </Text>
                    ) : (
                      <Text className="text-xs text-red-500 truncate" title={execution.error || ''}>
                        Error: {execution.error}
                      </Text>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => handleViewDetails(execution.id)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      <Flex justifyContent="between" className="mt-4">
        <Text>
          Showing {startIndex + 1} to {Math.min(endIndex, executions.length)} of {executions.length} executions
        </Text>
        
        <Flex className="gap-2">
          <Button
            icon={ChevronDoubleLeftIcon}
            variant="light"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            color="gray"
            size="xs"
          />
          
          <Button
            icon={ChevronLeftIcon}
            variant="light"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            color="gray"
            size="xs"
          />
          
          {/* Page number display */}
          <Flex alignItems="center" className="gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculate which page numbers to show
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={i}
                  variant={currentPage === pageNum ? "primary" : "light"}
                  color={currentPage === pageNum ? "blue" : "gray"}
                  onClick={() => handlePageChange(pageNum)}
                  size="xs"
                >
                  {pageNum}
                </Button>
              );
            })}
          </Flex>
          
          <Button
            icon={ChevronRightIcon}
            variant="light"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            color="gray"
            size="xs"
          />
          
          <Button
            icon={ChevronDoubleRightIcon}
            variant="light"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            color="gray"
            size="xs"
          />
        </Flex>
      </Flex>
    </Card>
  );
} 