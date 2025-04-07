import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Text,
  Icon,
  Flex,
  Button
} from '@tremor/react';
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Define types
export type SlowToolData = {
  tool_name: string;
  count: number;
  avg_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  success_count: number;
  error_count: number;
  is_internal: boolean;
  failure_rate: number;
};

export type SlowToolsTableProps = {
  toolsData: SlowToolData[];
  thresholds?: {
    slow: number; // Default: 1000ms
    medium: number; // Default: 500ms
  };
  className?: string;
  onRowClick?: (tool: SlowToolData) => void;
  filtersActive?: boolean;
  onResetFilters?: () => void;
};

// Format duration utility function
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Get status color utility function
function getStatusColor(duration: number, thresholds: { slow: number; medium: number }): string {
  if (duration >= thresholds.slow) return 'red';
  if (duration >= thresholds.medium) return 'amber';
  return 'green';
}

export default function SlowToolsTable({
  toolsData,
  thresholds = { slow: 1000, medium: 500 },
  className = '',
  onRowClick,
  filtersActive = false,
  onResetFilters
}: SlowToolsTableProps) {
  // Sort tools by average duration (descending)
  const sortedTools = [...toolsData].sort((a, b) => b.avg_duration_ms - a.avg_duration_ms);
  
  // Filter to only show slow and medium tools
  const slowTools = sortedTools.filter(tool => tool.avg_duration_ms >= thresholds.medium);
  
  if (slowTools.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-8 text-gray-500">
        <div className="flex items-center">
          <ClockIcon className="w-6 h-6 mr-2" />
          <Text>No slow tools detected</Text>
        </div>
        {filtersActive && onResetFilters && (
          <Button 
            className="mt-4" 
            variant="secondary" 
            size="xs"
            onClick={onResetFilters}
          >
            Reset Filters
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <Table className={className}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Tool Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Avg Duration</TableHeaderCell>
          <TableHeaderCell>Max Duration</TableHeaderCell>
          <TableHeaderCell>Call Count</TableHeaderCell>
          <TableHeaderCell>Failure Rate</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {slowTools.map((tool) => (
          <TableRow 
            key={tool.tool_name}
            onClick={() => onRowClick && onRowClick(tool)}
            className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
          >
            <TableCell>{tool.tool_name}</TableCell>
            <TableCell>
              <Badge color={tool.is_internal ? 'indigo' : 'violet'}>
                {tool.is_internal ? 'Internal' : 'External'}
              </Badge>
            </TableCell>
            <TableCell>
              <Flex alignItems="center">
                <Badge color={getStatusColor(tool.avg_duration_ms, thresholds)} className="mr-2">
                  {formatDuration(tool.avg_duration_ms)}
                </Badge>
                {tool.avg_duration_ms >= thresholds.slow && (
                  <Button
                    size="xs"
                    variant="light"
                    icon={ExclamationTriangleIcon}
                    color="red"
                    tooltip="This tool is performing slowly"
                    className="p-0"
                  />
                )}
              </Flex>
            </TableCell>
            <TableCell>{formatDuration(tool.max_duration_ms)}</TableCell>
            <TableCell>{tool.count}</TableCell>
            <TableCell>
              <Flex alignItems="center">
                <Badge color={tool.failure_rate > 0.1 ? 'red' : 'green'}>
                  {(tool.failure_rate * 100).toFixed(1)}%
                </Badge>
              </Flex>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 