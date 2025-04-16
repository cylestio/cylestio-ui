'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { 
  Button, 
  Select, 
  SelectItem, 
  TextInput, 
  DateRangePicker, 
  DateRangePickerValue
} from '@tremor/react'
import { 
  FunnelIcon, 
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

export interface FilterOption {
  id: string
  label: string
  type: 'select' | 'daterange' | 'text'
  options?: Array<{value: string, label: string}>
  defaultValue?: any
}

export interface FilterBarProps {
  filters: FilterOption[]
  activeFilters: Record<string, any>
  onFilterChange: (filterId: string, value: any) => void
  onResetFilters: () => void
  className?: string
}

/**
 * Simple filter bar component for drill-down views
 */
const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onResetFilters,
  className = ''
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Update URL with active filters
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update URL parameters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key)
      } else if (typeof value === 'object') {
        params.set(key, JSON.stringify(value))
      } else {
        params.set(key, String(value))
      }
    })
    
    const newUrl = `${pathname}?${params.toString()}`
    router.push(newUrl)
  }, [activeFilters, pathname, router, searchParams])
  
  return (
    <div className={`p-4 bg-white border border-neutral-200 rounded-lg shadow-sm mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-neutral-900 flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-neutral-500" />
          Filters
        </h3>
        
        <Button 
          size="xs"
          variant="secondary" 
          onClick={onResetFilters}
        >
          Clear
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filters.map(filter => (
          <div key={filter.id} className="flex flex-col">
            <label htmlFor={filter.id} className="text-sm font-medium text-neutral-700 mb-1">
              {filter.label}
            </label>
            
            {filter.type === 'select' && (
              <Select
                id={filter.id}
                placeholder="Select..."
                value={activeFilters[filter.id] || ''}
                onValueChange={(value) => onFilterChange(filter.id, value)}
              >
                {filter.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            )}
            
            {filter.type === 'text' && (
              <TextInput
                id={filter.id}
                placeholder="Search..."
                value={activeFilters[filter.id] || ''}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
              />
            )}
            
            {filter.type === 'daterange' && (
              <DateRangePicker
                className="max-w-md"
                value={activeFilters[filter.id] || null}
                onValueChange={(value) => onFilterChange(filter.id, value)}
                enableSelect={true}
                placeholder="Select date range"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FilterBar 