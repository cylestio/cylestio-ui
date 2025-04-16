'use client';

import { useState, useEffect } from 'react';
import {
  TextInput,
  Select,
  SelectItem,
  Button,
  Flex,
  Card,
} from '@tremor/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SecurityFilterBarProps {
  filters: {
    severity: string;
    category: string;
    alert_level: string;
    llm_vendor: string;
    search: string;
    time_range: string;
  };
  onFilterChange: (filters: Record<string, any>) => void;
}

const severityOptions = [
  { value: '', label: 'All Severities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'prompt_injection', label: 'Prompt Injection' },
  { value: 'sensitive_data', label: 'Sensitive Data' },
  { value: 'malicious_content', label: 'Malicious Content' },
  { value: 'system_instruction_leak', label: 'System Instruction Leak' },
];

const alertLevelOptions = [
  { value: '', label: 'All Alert Levels' },
  { value: 'none', label: 'None' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'dangerous', label: 'Dangerous' },
  { value: 'critical', label: 'Critical' },
];

const llmVendorOptions = [
  { value: '', label: 'All Vendors' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'huggingface', label: 'Hugging Face' },
];

const timeRangeOptions = [
  { value: '1h', label: 'Last Hour' },
  { value: '1d', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

export default function SecurityFilterBar({ filters, onFilterChange }: SecurityFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  
  useEffect(() => {
    setSearchQuery(filters.search || '');
  }, [filters.search]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = () => {
    onFilterChange({ search: searchQuery });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };
  
  const handleClearFilters = () => {
    onFilterChange({
      severity: '',
      category: '',
      alert_level: '',
      llm_vendor: '',
      search: '',
    });
    setSearchQuery('');
  };
  
  const hasActiveFilters = 
    filters.severity !== '' || 
    filters.category !== '' || 
    filters.alert_level !== '' || 
    filters.llm_vendor !== '' || 
    filters.search !== '';
  
  return (
    <div>
      <Flex justifyContent="between" className="mb-2">
        <Flex className="gap-2 lg:gap-4">
          <div className="w-64">
            <TextInput
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              icon={MagnifyingGlassIcon}
              onBlur={handleSearchSubmit}
            />
          </div>
          
          <div>
            <Select 
              value={filters.time_range} 
              onValueChange={(value) => onFilterChange({ time_range: value })}
            >
              {timeRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          
          <Button
            size="xs"
            variant="secondary"
            icon={FunnelIcon}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters {hasActiveFilters && '(active)'}
          </Button>
          
          {hasActiveFilters && (
            <Button
              size="xs"
              variant="light"
              icon={XMarkIcon}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}
        </Flex>
      </Flex>
      
      {showFilters && (
        <Card className="mb-4 p-4">
          <Flex className="gap-4 flex-wrap">
            <div className="min-w-[200px]">
              <Select
                placeholder="Filter by Severity"
                value={filters.severity}
                onValueChange={(value) => onFilterChange({ severity: value })}
              >
                {severityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="min-w-[200px]">
              <Select
                placeholder="Filter by Category"
                value={filters.category}
                onValueChange={(value) => onFilterChange({ category: value })}
              >
                {categoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="min-w-[200px]">
              <Select
                placeholder="Filter by Alert Level"
                value={filters.alert_level}
                onValueChange={(value) => onFilterChange({ alert_level: value })}
              >
                {alertLevelOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="min-w-[200px]">
              <Select
                placeholder="Filter by LLM Vendor"
                value={filters.llm_vendor}
                onValueChange={(value) => onFilterChange({ llm_vendor: value })}
              >
                {llmVendorOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </Flex>
        </Card>
      )}
    </div>
  );
} 