'use client'

import React, { useState, useEffect } from 'react'
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
  const [showFilters, setShowFilters] = useState(false)
  
  // Initialize filter values from URL params or defaults on component mount
  useEffect(() => {
    const initialState: Record<string, any> = {}
    
    filters.forEach(filter => {
      // First try to get value from URL if preserveFiltersInUrl is true
      if (preserveFiltersInUrl) {
        const urlValue = searchParams.get(filter.id)
        if (urlValue !== null) {
          initialState[filter.id] = urlValue
          return
        }
      }
      
      // Otherwise use the default value from filter definition
      if (filter.defaultValue !== undefined) {
        initialState[filter.id] = filter.defaultValue
      }
    })
    
    setFilterState(initialState)
    
    // Only trigger onFilterChange if we have any values
    if (Object.keys(initialState).length > 0) {
      onFilterChange(initialState)
    }
  }, [filters, searchParams, preserveFiltersInUrl, onFilterChange])
  
  // Update URL with filter values if preserveFiltersInUrl is true
  useEffect(() => {
    if (!preserveFiltersInUrl) return
    
    const params = new URLSearchParams(searchParams.toString())
    
    // Update params with filter state
    Object.entries(filterState).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })
    
    const queryString = params.toString()
    const newPath = queryString ? `${pathname}?${queryString}` : pathname
    
    router.replace(newPath, { scroll: false })
  }, [filterState, pathname, router, searchParams, preserveFiltersInUrl])
  
  const handleFilterChange = (id: string, value: any) => {
    const newState = {
      ...filterState,
      [id]: value
    }
    
    // Remove empty values
    if (value === '' || value === null || value === undefined) {
      delete newState[id]
    }
    
    setFilterState(newState)
    onFilterChange({ [id]: value })
  }
  
  const handleClearAll = () => {
    setFilterState({})
    if (onClearAll) {
      onClearAll()
    } else {
      onFilterChange({})
    }
  }
  
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }
  
  // Determine if we have any active filters
  const hasActiveFilters = Object.values(filterState).some(
    value => value !== undefined && value !== null && value !== ''
  )
  
  // Find the search filter if any
  const searchFilter = filters.find(f => f.type === 'search')
  
  return (
    <div className={`mb-4 ${className}`}>
      <Flex justifyContent="between" className="mb-2">
        <Flex className="gap-2">
          {searchFilter && (
            <div className="w-64">
              <TextInput
                placeholder={searchFilter.placeholder || 'Search...'}
                value={filterState[searchFilter.id] || ''}
                onChange={e => handleFilterChange(searchFilter.id, e.target.value)}
                icon={MagnifyingGlassIcon}
              />
            </div>
          )}
          
          <Button
            size="xs"
            variant="secondary"
            icon={AdjustmentsHorizontalIcon}
            onClick={toggleFilters}
          >
            Filters
          </Button>
        </Flex>
        
        {hasActiveFilters && (
          <Button
            size="xs"
            variant="light"
            onClick={handleClearAll}
            icon={XMarkIcon}
          >
            Clear
          </Button>
        )}
      </Flex>
      
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
          {filters
            .filter(filter => filter.type !== 'search') // Search is already shown above
            .map(filter => (
              <div key={filter.id} className="min-w-[180px] max-w-xs">
                {filter.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {filter.label}
                    </label>
                    <Select
                      value={filterState[filter.id] || ''}
                      onValueChange={value => handleFilterChange(filter.id, value)}
                      placeholder={filter.placeholder || 'Select...'}
                    >
                      {filter.options?.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                )}
                
                {filter.type === 'date-range' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {filter.label}
                    </label>
                    <DateRangePicker
                      value={filterState[filter.id] as DateRangePickerValue || { from: undefined, to: undefined }}
                      onValueChange={value => handleFilterChange(filter.id, value)}
                      placeholder={filter.placeholder || 'Select date range'}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default FilterBar 