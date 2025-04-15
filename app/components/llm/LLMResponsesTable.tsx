'use client'

import { useState } from 'react'
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Title,
  Badge,
  Button,
  TextInput,
  Select,
  SelectItem,
  MultiSelect,
  MultiSelectItem,
  DateRangePicker,
  DateRangePickerValue
} from '@tremor/react'
import { MagnifyingGlassIcon, FunnelIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/outline'

// Define types for response data
export type LLMResponse = {
  id: string;
  model: string;
  category: string;
  title: string;
  prompt: string;
  response: string;
  created_at: string;
  tokens: number;
  quality_score: number;
};

export type LLMResponsesPagination = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

export interface LLMResponsesTableProps {
  responses: LLMResponse[];
  pagination: LLMResponsesPagination;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onResponseClick: (responseId: string) => void;
  loading?: boolean;
  className?: string;
}

export default function LLMResponsesTable({
  responses,
  pagination,
  onPageChange,
  onPageSizeChange,
  onResponseClick,
  loading = false,
  className = ''
}: LLMResponsesTableProps) {
  // State for selected response
  const [selectedResponse, setSelectedResponse] = useState<LLMResponse | null>(
    responses?.length > 0 ? responses[0] : null
  );
  
  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get quality score color based on value
  const getQualityScoreColor = (score: number) => {
    if (score >= 4.5) return 'emerald';
    if (score >= 3.5) return 'blue';
    if (score >= 2.5) return 'amber';
    return 'rose';
  };

  // Handle click on a response
  const handleResponseClick = (responseId: string) => {
    const response = responses.find(r => r.id === responseId);
    if (response) {
      setSelectedResponse(response);
    }
    onResponseClick(responseId);
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <Title>Best Responses</Title>
          <div className="flex flex-wrap gap-2">
            <TextInput
              icon={MagnifyingGlassIcon}
              placeholder="Search by title..."
              className="max-w-xs"
            />
            <Select
              defaultValue="all"
              className="max-w-xs"
            >
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Model</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Tokens</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="h-10 animate-pulse rounded bg-gray-100"></div>
                </TableCell>
              </TableRow>
            ) : responses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No responses found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              responses.map((response) => (
                <TableRow key={response.id} className="cursor-pointer" onClick={() => handleResponseClick(response.id)}>
                  <TableCell className="font-medium">{response.title}</TableCell>
                  <TableCell>
                    <Badge color="blue" size="xs">
                      {response.model.replace(/-\d+$/, '')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatTimestamp(response.created_at)}</TableCell>
                  <TableCell>{response.tokens.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="xs"
                      variant="light"
                      icon={ChevronRightIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResponseClick(response.id);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Text>Rows per page:</Text>
            <Select
              defaultValue={String(pagination.page_size)}
              className="w-20"
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="light"
              disabled={!pagination.has_prev}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Text>
              Page {pagination.page} of {pagination.total_pages || 1}
            </Text>
            <Button
              size="xs"
              variant="light"
              disabled={!pagination.has_next}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      
      <Card>
        <Title>Response Details</Title>
        <Text className="mb-4">
          {selectedResponse
            ? `Showing details for "${selectedResponse.title}"`
            : "Select a response to view details"}
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <Text className="font-medium mb-2">Prompt</Text>
            <div className="bg-gray-50 p-4 rounded-md min-h-[200px] text-sm whitespace-pre-wrap">
              {selectedResponse ? selectedResponse.prompt : 'No prompt selected'}
            </div>
          </div>
          <div>
            <Text className="font-medium mb-2">Response</Text>
            <div className="bg-gray-50 p-4 rounded-md min-h-[200px] text-sm whitespace-pre-wrap">
              {selectedResponse ? selectedResponse.response : 'No response selected'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 