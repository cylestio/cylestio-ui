'use client';

import { useState } from 'react';
import {
  Card,
  TextInput,
  DateRangePicker,
  DateRangePickerValue,
  Select,
  SelectItem,
  Button,
  Flex
} from '@tremor/react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

type ToolsFilterBarProps = {
  timeRange: string;
  toolName: string;
  toolType: string;
  status: string;
  agentId: string;
  fromTime: string;
  toTime: string;
  onFilterChange: (filterName: string, value: string) => void;
  onResetFilters: () => void;
};

export default function ToolsFilterBar({
  timeRange,
  toolName,
  toolType,
  status,
  agentId,
  fromTime,
  toTime,
  onFilterChange,
  onResetFilters
}: ToolsFilterBarProps) {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangePickerValue>({
    from: fromTime ? new Date(fromTime) : undefined,
    to: toTime ? new Date(toTime) : undefined,
  });
  const [minDuration, setMinDuration] = useState<number>(0);
  const [maxDuration, setMaxDuration] = useState<number>(5000);
  
  // Handle date range changes
  const handleDateRangeChange = (value: DateRangePickerValue) => {
    setDateRange(value);
    if (value?.from) {
      onFilterChange('from_time', value.from.toISOString());
    } else {
      onFilterChange('from_time', '');
    }
    
    if (value?.to) {
      onFilterChange('to_time', value.to.toISOString());
    } else {
      onFilterChange('to_time', '');
    }
  };
  
  // Toggle advanced filters
  const toggleAdvancedFilters = () => {
    setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen);
  };
  
  // Calculate if any filters are active
  const hasActiveFilters = toolName || toolType || status || agentId || fromTime || toTime || 
                         minDuration > 0 || maxDuration < 5000;
  
  // Handle duration input
  const handleMinDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setMinDuration(value);
    // Dispatch filter change event here if needed
  };
  
  const handleMaxDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 5000;
    setMaxDuration(value);
    // Dispatch filter change event here if needed
  };
  
  return (
    <Card className="p-4">
      <Flex justifyContent="between" className="mb-4">
        <Flex className="gap-2">
          <TextInput 
            placeholder="Search tool name..." 
            value={toolName}
            onChange={(e) => onFilterChange('tool_name', e.target.value)}
            icon={MagnifyingGlassIcon}
            className="w-64"
          />
          
          <Select
            value={toolType}
            onValueChange={(value) => onFilterChange('tool_type', value)}
            placeholder="Tool Type"
            className="w-48"
          >
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="retrieval">Retrieval</SelectItem>
            <SelectItem value="generation">Generation</SelectItem>
            <SelectItem value="calculation">Calculation</SelectItem>
            <SelectItem value="action">Action</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="utility">Utility</SelectItem>
          </Select>
          
          <Select
            value={status}
            onValueChange={(value) => onFilterChange('status', value)}
            placeholder="Status"
            className="w-40"
          >
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="timeout">Timeout</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </Select>
        </Flex>
        
        <Flex className="gap-2">
          <Button 
            variant="light" 
            color="gray" 
            icon={AdjustmentsHorizontalIcon}
            onClick={toggleAdvancedFilters}
          >
            Advanced Filters
          </Button>
          
          {hasActiveFilters && (
            <Button 
              variant="light" 
              color="red" 
              icon={XMarkIcon}
              onClick={onResetFilters}
            >
              Reset
            </Button>
          )}
        </Flex>
      </Flex>
      
      {isAdvancedFiltersOpen && (
        <div className="mt-4 border-t pt-4">
          <Flex className="gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <div className="mb-2 text-sm font-medium text-gray-700">Date Range</div>
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                <DateRangePicker 
                  value={dateRange}
                  onValueChange={handleDateRangeChange}
                  enableClear={true}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-[240px]">
              <div className="mb-2 text-sm font-medium text-gray-700">Agent</div>
              <Select
                value={agentId}
                onValueChange={(value) => onFilterChange('agent_id', value)}
                placeholder="Select Agent"
                className="w-full"
              >
                <SelectItem value="">All Agents</SelectItem>
                <SelectItem value="agent-123">Research Assistant</SelectItem>
                <SelectItem value="agent-124">Creative Assistant</SelectItem>
                <SelectItem value="agent-125">Data Analyst</SelectItem>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[240px]">
              <div className="mb-2 text-sm font-medium text-gray-700">Duration (ms)</div>
              <Flex justifyContent="between" className="gap-2">
                <div className="w-1/2">
                  <div className="text-xs text-gray-500 mb-1">Min</div>
                  <TextInput
                    placeholder="0"
                    value={minDuration.toString()}
                    onChange={handleMinDurationChange}
                    type="number"
                  />
                </div>
                <div className="w-1/2">
                  <div className="text-xs text-gray-500 mb-1">Max</div>
                  <TextInput
                    placeholder="5000"
                    value={maxDuration.toString()}
                    onChange={handleMaxDurationChange}
                    type="number"
                  />
                </div>
              </Flex>
            </div>
          </Flex>
        </div>
      )}
    </Card>
  );
} 