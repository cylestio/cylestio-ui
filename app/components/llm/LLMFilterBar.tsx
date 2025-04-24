'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Select,
  SelectItem,
  MultiSelect,
  MultiSelectItem,
  Button,
  TextInput,
  Text,
  Badge,
  DateRangePicker,
  DateRangePickerValue
} from '@tremor/react'
import { FunnelIcon, XMarkIcon, MagnifyingGlassIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

// Define the filter options and types
export type LLMFilters = {
  timeRange: string;
  customDateRange?: DateRangePickerValue;
  model: string[];
  status: string[];
  agent: string[];
  tokenRange: [number, number];
  query?: string;
  has_error?: boolean;
}

// Define props
export interface LLMFilterBarProps {
  filters: LLMFilters;
  onFilterChange: (filters: LLMFilters) => void;
  availableModels: { id: string; name: string }[];
  availableAgents: { id: string; name: string }[];
  loading?: boolean;
  showSearch?: boolean; // Whether to show search query box
}

// List of available time ranges
const timeRangeOptions = [
  { value: '1h', text: 'Last hour' },
  { value: '24h', text: 'Last 24 hours' },
  { value: '7d', text: 'Last 7 days' },
  { value: '30d', text: 'Last 30 days' },
  { value: '90d', text: 'Last 90 days' },
  { value: 'custom', text: 'Custom range' }
];

// List of status options
const statusOptions = [
  { value: 'success', text: 'Success' },
  { value: 'error', text: 'Error' },
  { value: 'timeout', text: 'Timeout' },
  { value: 'filtered', text: 'Filtered' },
  { value: 'pending', text: 'Pending' },
  { value: 'canceled', text: 'Canceled' }
];

export default function LLMFilterBar({
  filters,
  onFilterChange,
  availableModels,
  availableAgents,
  loading = false,
  showSearch = false // Default to false for backward compatibility
}: LLMFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<LLMFilters>(filters);
  const [showCustomDateRange, setShowCustomDateRange] = useState(filters.timeRange === 'custom');

  // Update local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters);
    setShowCustomDateRange(filters.timeRange === 'custom');
  }, [filters]);

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    // Reset custom date range if not on custom option
    if (value !== 'custom') {
      onFilterChange({
        ...filters,
        timeRange: value,
        customDateRange: undefined
      });
    } else {
      // Switch to custom, but keep current custom date range if it exists
      onFilterChange({
        ...filters,
        timeRange: 'custom',
        // Initialize with last 30 days if no custom range exists
        customDateRange: filters.customDateRange || {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        }
      });
    }
  };
  
  // Handle custom date range change
  const handleDateRangeChange = (value: DateRangePickerValue) => {
    onFilterChange({
      ...filters,
      timeRange: 'custom',
      customDateRange: value
    });
  };
  
  // Handle model selection change
  const handleModelChange = (values: string[]) => {
    onFilterChange({
      ...filters,
      model: values
    });
  };
  
  // Handle status selection change
  const handleStatusChange = (values: string[]) => {
    onFilterChange({
      ...filters,
      status: values
    });
  };
  
  // Handle agent selection change
  const handleAgentChange = (values: string[]) => {
    onFilterChange({
      ...filters,
      agent: values
    });
  };
  
  // Handle token range change - updated for TextInput approach
  const handleMinTokenChange = (value: string) => {
    const minToken = parseInt(value) || 0;
    onFilterChange({
      ...filters,
      tokenRange: [minToken, filters.tokenRange[1]]
    });
  };
  
  const handleMaxTokenChange = (value: string) => {
    const maxToken = parseInt(value) || 10000;
    onFilterChange({
      ...filters,
      tokenRange: [filters.tokenRange[0], maxToken]
    });
  };
  
  // Handle search query change
  const handleQueryChange = (value: string) => {
    onFilterChange({
      ...filters,
      query: value || undefined
    });
  };
  
  // Handle error filter toggle
  const handleErrorToggle = (checked: boolean) => {
    onFilterChange({
      ...filters,
      has_error: checked || undefined
    });
  };
  
  // Handle clearing all filters
  const handleClearFilters = () => {
    onFilterChange({
      timeRange: '7d',
      model: [],
      status: [],
      agent: [],
      tokenRange: [0, 10000]
    });
  };
  
  // Count active filters (excluding default time range)
  const getActiveFilterCount = () => {
    let count = 0;
    
    if (filters.timeRange !== '7d' || filters.customDateRange) count++;
    if (filters.model.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.agent.length > 0) count++;
    if (filters.tokenRange[0] > 0 || filters.tokenRange[1] < 10000) count++;
    if (filters.query) count++;
    if (filters.has_error) count++;
    
    return count;
  };

  // Toggle filter panel
  const toggleFilters = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <Text className="font-medium">Filters</Text>
          {getActiveFilterCount() > 0 && (
            <Badge color="blue">
              {getActiveFilterCount()}
            </Badge>
          )}
        </div>
        
        <div className="flex space-x-4">
          {getActiveFilterCount() > 0 && (
            <Button
              variant="light"
              color="gray"
              size="xs"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear filters
            </Button>
          )}
          <Button
            variant="light"
            color="gray"
            size="xs"
            onClick={toggleFilters}
            disabled={loading}
            icon={isOpen ? XMarkIcon : FunnelIcon}
          >
            {isOpen ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>
      
      {isOpen && (
        <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Range Filter */}
            <div className="w-full sm:w-64">
              <Text className="text-sm mb-1">Time Range</Text>
              <Select 
                value={filters.timeRange} 
                onValueChange={handleTimeRangeChange}
                disabled={loading}
              >
                {timeRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.text}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            {/* Custom Date Range Picker (shown only when custom time range is selected) */}
            {filters.timeRange === 'custom' && (
              <div className="w-full sm:flex-1">
                <Text className="text-sm mb-1">Custom Date Range</Text>
                <DateRangePicker 
                  value={filters.customDateRange}
                  onValueChange={handleDateRangeChange}
                  disabled={loading}
                  className="w-full"
                  enableSelect={false}
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Model Filter */}
            <div>
              <Text className="text-sm mb-1">Models</Text>
              <MultiSelect 
                value={filters.model}
                onValueChange={handleModelChange}
                disabled={loading}
                placeholder="All Models"
              >
                {availableModels.map(model => (
                  <MultiSelectItem key={model.id} value={model.id}>
                    {model.name}
                  </MultiSelectItem>
                ))}
              </MultiSelect>
            </div>
            
            {/* Status Filter */}
            <div>
              <Text className="text-sm mb-1">Status</Text>
              <MultiSelect 
                value={filters.status}
                onValueChange={handleStatusChange}
                disabled={loading}
                placeholder="All Statuses"
              >
                {statusOptions.map(status => (
                  <MultiSelectItem key={status.value} value={status.value}>
                    {status.text}
                  </MultiSelectItem>
                ))}
              </MultiSelect>
            </div>
            
            {/* Agent Filter */}
            <div>
              <Text className="text-sm mb-1">Agents</Text>
              <MultiSelect 
                value={filters.agent}
                onValueChange={handleAgentChange}
                disabled={loading}
                placeholder="All Agents"
              >
                {availableAgents.map(agent => (
                  <MultiSelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MultiSelectItem>
                ))}
              </MultiSelect>
            </div>
            
            {/* Token Range Slider */}
            <div>
              <Text className="text-sm mb-1">Token Range</Text>
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <TextInput
                    placeholder="Min"
                    value={String(filters.tokenRange[0])}
                    onChange={(e) => handleMinTokenChange(e.target.value)}
                    disabled={loading}
                    type="number"
                    min={0}
                  />
                </div>
                <div className="w-1/2">
                  <TextInput
                    placeholder="Max"
                    value={String(filters.tokenRange[1])}
                    onChange={(e) => handleMaxTokenChange(e.target.value)}
                    disabled={loading}
                    type="number"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Conversation search options */}
      {showSearch && (
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <TextInput
                placeholder="Search in conversation content..."
                value={filters.query || ''}
                onChange={(e) => handleQueryChange(e.target.value)}
                disabled={loading}
                icon={MagnifyingGlassIcon}
              />
            </div>
            
            <div className="flex items-center">
              <Button
                variant={filters.has_error ? "secondary" : "light"}
                color={filters.has_error ? "red" : "gray"}
                icon={ExclamationCircleIcon}
                onClick={() => handleErrorToggle(!filters.has_error)}
                disabled={loading}
                size="xs"
              >
                {filters.has_error ? "Showing errors only" : "Show errors only"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 