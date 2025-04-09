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
  MagnifyingGlassIcon, 
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

export type FilterOption = {
  id: string
  label: string
  type: 'select' | 'search' | 'dateRange'
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: string | string[] | DateRangePickerValue
}

export interface FilterBarProps {
  filters: FilterOption[]
  onFilterChange?: (filters: Record<string, any>) => void
  className?: string
  showClearButton?: boolean
  showFilterToggle?: boolean
  defaultExpanded?: boolean
  preserveFiltersInUrl?: boolean
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  className = '',
  showClearButton = true,
  showFilterToggle = true,
  defaultExpanded = true,
  preserveFiltersInUrl = true
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  
  // Initialize filter values from URL parameters or defaults
  useEffect(() => {
    const initialValues: Record<string, any> = {}
    
    filters.forEach(filter => {
      // Check URL parameters first if we're preserving filters in URL
      if (preserveFiltersInUrl && searchParams.has(filter.id)) {
        const paramValue = searchParams.get(filter.id)
        
        if (filter.type === 'dateRange' && paramValue) {
          try {
            initialValues[filter.id] = JSON.parse(paramValue)
          } catch (e) {
            initialValues[filter.id] = filter.defaultValue || null
          }
        } else {
          initialValues[filter.id] = paramValue
        }
      } else {
        // Use default value if provided
        if (filter.defaultValue !== undefined) {
          initialValues[filter.id] = filter.defaultValue
        }
      }
    })
    
    setFilterValues(initialValues)
  }, [filters, preserveFiltersInUrl, searchParams])
  
  // Update URL parameters and call onFilterChange when filters change
  useEffect(() => {
    if (Object.keys(filterValues).length === 0) return
    
    if (onFilterChange) {
      onFilterChange(filterValues)
    }
    
    if (preserveFiltersInUrl) {
      const params = new URLSearchParams(searchParams.toString())
      
      // Update URL parameters
      Object.entries(filterValues).forEach(([key, value]) => {
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
    }
  }, [filterValues, onFilterChange, preserveFiltersInUrl, pathname, router, searchParams])
  
  const handleFilterChange = (id: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [id]: value
    }))
  }
  
  const handleClearFilters = () => {
    const defaultValues: Record<string, any> = {}
    
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaultValues[filter.id] = filter.defaultValue
      }
    })
    
    setFilterValues(defaultValues)
  }
  
  if (!expanded && showFilterToggle) {
    return (
      <div className={`flex justify-end mb-4 ${className}`}>
        <Button 
          icon={FunnelIcon} 
          variant="secondary" 
          onClick={() => setExpanded(true)}
        >
          Show Filters
        </Button>
      </div>
    )
  }
  
  return (
    <div className={`p-4 bg-white border border-neutral-200 rounded-lg shadow-sm mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-neutral-900 flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-neutral-500" />
          Filters
        </h3>
        
        <div className="flex space-x-2">
          {showClearButton && (
            <Button 
              size="xs"
              variant="secondary" 
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}
          
          {showFilterToggle && (
            <Button 
              icon={XMarkIcon} 
              size="xs"
              variant="secondary" 
              onClick={() => setExpanded(false)}
            >
              Hide
            </Button>
          )}
        </div>
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
                placeholder={filter.placeholder || 'Select...'}
                value={filterValues[filter.id] || ''}
                onValueChange={(value) => handleFilterChange(filter.id, value)}
              >
                {filter.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            )}
            
            {filter.type === 'search' && (
              <TextInput
                id={filter.id}
                placeholder={filter.placeholder || 'Search...'}
                value={filterValues[filter.id] || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                icon={MagnifyingGlassIcon}
              />
            )}
            
            {filter.type === 'dateRange' && (
              <DateRangePicker
                className="max-w-md mx-auto"
                value={filterValues[filter.id] || null}
                onValueChange={(value) => handleFilterChange(filter.id, value)}
                enableSelect={true}
                placeholder={filter.placeholder || 'Select date range'}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FilterBar 