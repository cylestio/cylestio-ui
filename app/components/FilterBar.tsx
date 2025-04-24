'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { 
  TextInput, 
  Button, 
  Select, 
  SelectItem,
  DateRangePicker, 
  DateRangePickerValue,
  Flex
} from '@tremor/react'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

/**
 * Type definitions for filter options
 */
export type FilterOption = {
  id: string
  label: string
  type: 'select' | 'search' | 'date-range'
  options?: { value: string; label: string }[]
  placeholder?: string
  defaultValue?: string | string[] | DateRangePickerValue
}

export interface FilterBarProps {
  filters: FilterOption[]
  onFilterChange: (filters: Record<string, any>) => void
  onClearAll?: () => void
  className?: string
  preserveFiltersInUrl?: boolean
}

/**
 * FilterBar component for consistent filtering across the application
 */
const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  className = '',
  preserveFiltersInUrl = false
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Initialize filter state from props and URL parameters if enabled
  const [filterState, setFilterState] = useState<Record<string, any>>({})
  
  // Initialize filter values from URL params or defaults on component mount
  const filterStateInitialized = useRef(false);
  
  useEffect(() => {
    // Only initialize once
    if (filterStateInitialized.current) return;
    
    const initialState: Record<string, any> = {};
    
    // Process each filter option
    for (const filter of filters) {
      let valueFound = false;
      
      // Try to get from URL first
      if (preserveFiltersInUrl) {
        const urlValue = searchParams.get(filter.id);
        if (urlValue !== null) {
          initialState[filter.id] = urlValue;
          valueFound = true;
        }
      }
      
      // If no value found yet, use default from filter definition
      if (!valueFound && filter.defaultValue !== undefined) {
        initialState[filter.id] = filter.defaultValue;
      }
    }
    
    // Update state if we have values
    if (Object.keys(initialState).length > 0) {
      setFilterState(initialState);
      
      // Only notify parent if values differ from current URL
      if (!preserveFiltersInUrl) {
        onFilterChange(initialState);
      }
    }
    
    // Mark as initialized
    filterStateInitialized.current = true;
  }, [filters]); // Only depend on filters array
  
  // Update URL with filter values if preserveFiltersInUrl is true
  const urlUpdateInProgress = useRef(false);
  
  useEffect(() => {
    if (!preserveFiltersInUrl || urlUpdateInProgress.current) return;
    
    // Check if URL params match current filter state 
    let needsUpdate = false;
    const currentParams = new URLSearchParams(searchParams.toString());
    
    // Compare current URL params with filter state
    Object.entries(filterState).forEach(([key, value]) => {
      const stringValue = value !== undefined && value !== null && value !== '' 
        ? String(value) 
        : '';
      const paramValue = currentParams.get(key) || '';
      
      if (stringValue !== paramValue) {
        needsUpdate = true;
      }
    });
    
    // Check for params in URL that aren't in filter state
    currentParams.forEach((value, key) => {
      if (filterState[key] === undefined && key !== 'page' && key !== 'time_range') {
        needsUpdate = true;
      }
    });
    
    // Only update if there's an actual change
    if (needsUpdate) {
      urlUpdateInProgress.current = true;
      
      try {
        const params = new URLSearchParams();
        
        // Only add non-empty values to URL
        Object.entries(filterState).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        });
        
        // Preserve page and time_range params individually
        const pageValue = currentParams.get('page');
        if (pageValue) {
          params.set('page', pageValue);
        }
        
        const timeRangeValue = currentParams.get('time_range');
        if (timeRangeValue) {
          params.set('time_range', timeRangeValue);
        }
        
        const queryString = params.toString();
        const newPath = queryString ? `${pathname}?${queryString}` : pathname;
        
        router.replace(newPath, { scroll: false });
      } finally {
        // Reset flag in next tick
        setTimeout(() => {
          urlUpdateInProgress.current = false;
        }, 0);
      }
    }
  }, [filterState, pathname, router, searchParams, preserveFiltersInUrl]);
  
  const handleFilterChange = (id: string, value: any) => {
    // Create a complete new state object with all current filters
    const newState = { ...filterState }
    
    // Remove empty values or add new value
    if (value === '' || value === null || value === undefined) {
      delete newState[id]
    } else {
      newState[id] = value
    }
    
    // Update local state
    setFilterState(newState)
    
    // Pass the FULL updated filter state to parent, not just the changed field
    onFilterChange(newState)
  }
  
  const handleClearAll = () => {
    // Force reset the filter state in the UI
    setFilterState({})
    
    // Reset URL immediately if needed to avoid flashing of old values
    if (preserveFiltersInUrl) {
      // Create new params object
      const params = new URLSearchParams()
      const currentParams = new URLSearchParams(searchParams.toString())
      
      // Preserve page param if it exists
      const pageValue = currentParams.get('page')
      if (pageValue) {
        params.set('page', pageValue)
      }
      
      // Preserve time_range param if it exists
      const timeRangeValue = currentParams.get('time_range')
      if (timeRangeValue) {
        params.set('time_range', timeRangeValue)
      }
      
      // Update URL without filter params
      const queryString = params.toString()
      const newPath = queryString ? `${pathname}?${queryString}` : pathname
      router.replace(newPath, { scroll: false })
    }
    
    // Use custom handler if provided
    if (onClearAll) {
      onClearAll()
    } else {
      // Explicitly pass an empty object to parent
      // This is important for components that need to know filters were cleared
      onFilterChange({})
    }
  }
  
  // Determine if we have any active filters
  const hasActiveFilters = Object.values(filterState).some(
    value => value !== undefined && value !== null && value !== ''
  )
  
  // Find the search filter if any
  const searchFilter = filters.find(f => f.type === 'search')
  
  return (
    <div className={`${className}`}>
      <div className="flex flex-nowrap items-center gap-4 overflow-x-auto">
        {searchFilter && (
          <div className="min-w-[200px] flex-shrink-0">
            <TextInput
              placeholder={searchFilter.placeholder || 'Search...'}
              value={filterState[searchFilter.id] || ''}
              onChange={e => handleFilterChange(searchFilter.id, e.target.value)}
              icon={MagnifyingGlassIcon}
              className="border-gray-200"
            />
          </div>
        )}
        
        {filters
          .filter(filter => filter.type !== 'search') // Search is already shown above
          .map(filter => (
            <div key={filter.id} className="flex items-center gap-2 min-w-[220px] flex-shrink-0">
              <span className="text-sm text-gray-600 whitespace-nowrap">{filter.label}:</span>
              {filter.type === 'select' && (
                <Select
                  value={filterState[filter.id] || ''}
                  onValueChange={value => handleFilterChange(filter.id, value)}
                  placeholder={filter.placeholder || 'Select...'}
                  className="border-gray-200 min-w-[140px]"
                >
                  {filter.options?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              )}
              
              {filter.type === 'date-range' && (
                <DateRangePicker
                  value={filterState[filter.id] as DateRangePickerValue || { from: undefined, to: undefined }}
                  onValueChange={value => handleFilterChange(filter.id, value)}
                  placeholder={filter.placeholder || 'Select date range'}
                  className="border-gray-200"
                />
              )}
            </div>
          ))}
          
        {hasActiveFilters && (
          <Button
            size="xs"
            variant="light"
            onClick={handleClearAll}
            icon={XMarkIcon}
            className="text-gray-500 ml-auto"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

export default FilterBar 