'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  const isInitialMount = useRef(true)
  const isUpdatingFromUrl = useRef(false)
  const didInitialize = useRef(false)
  const lastUrlUpdateTime = useRef(0)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSearchValue = useRef<string | null>(null)
  
  // Initialize filter values from URL parameters or defaults - only once
  useEffect(() => {
    if (didInitialize.current) return
    
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
    didInitialize.current = true
  }, [filters, preserveFiltersInUrl, searchParams])
  
  // Debounced search handler to prevent too many updates
  const debouncedSearchChange = useCallback((id: string, value: string) => {
    pendingSearchValue.current = value
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (pendingSearchValue.current !== null) {
        setFilterValues(prev => ({
          ...prev,
          [id]: pendingSearchValue.current
        }))
        pendingSearchValue.current = null
      }
      debounceTimerRef.current = null
    }, 300) // 300ms debounce
  }, [])
  
  // Update URL and call onChange handler
  const updateUrl = useCallback(() => {
    if (!didInitialize.current || isUpdatingFromUrl.current) return
    
    // Rate limiting - don't update URL more than once every 500ms
    const now = Date.now()
    if (now - lastUrlUpdateTime.current < 500) return
    lastUrlUpdateTime.current = now

    if (onFilterChange) {
      onFilterChange(filterValues)
    }
    
    if (preserveFiltersInUrl) {
      const params = new URLSearchParams()
      
      // Get all existing non-filter params
      searchParams.forEach((value, key) => {
        const isFilterKey = filters.some(filter => filter.id === key)
        if (!isFilterKey) {
          params.set(key, value)
        }
      })
      
      // Add our filter values
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
      router.replace(newUrl, { scroll: false })
    }
  }, [filterValues, onFilterChange, preserveFiltersInUrl, pathname, router, searchParams, filters])
  
  // Update URL when filter values change, with debouncing
  useEffect(() => {
    if (!didInitialize.current) return
    
    // Skip first render
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    if (isUpdatingFromUrl.current) {
      isUpdatingFromUrl.current = false
      return
    }
    
    updateUrl()
  }, [filterValues, updateUrl])
  
  // Check if URL params have changed externally
  useEffect(() => {
    if (!didInitialize.current) return
    
    const newValues: Record<string, any> = {...filterValues}
    let hasChanges = false
    
    filters.forEach(filter => {
      if (searchParams.has(filter.id)) {
        const paramValue = searchParams.get(filter.id)
        
        if (filter.type === 'dateRange' && paramValue) {
          try {
            const parsed = JSON.parse(paramValue)
            if (JSON.stringify(filterValues[filter.id]) !== JSON.stringify(parsed)) {
              newValues[filter.id] = parsed
              hasChanges = true
            }
          } catch (e) {
            // Invalid JSON
          }
        } else if (filterValues[filter.id] !== paramValue) {
          newValues[filter.id] = paramValue
          hasChanges = true
        }
      } else if (filterValues[filter.id]) {
        newValues[filter.id] = ''
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      isUpdatingFromUrl.current = true
      setFilterValues(newValues)
    }
  }, [searchParams, filters, filterValues])
  
  // Handle filter changes
  const handleFilterChange = (id: string, value: any) => {
    // For search inputs, use debouncing
    if (filters.find(f => f.id === id)?.type === 'search') {
      debouncedSearchChange(id, value)
      return
    }
    
    // For other inputs, update immediately
    setFilterValues(prev => ({
      ...prev,
      [id]: value
    }))
  }
  
  // Handle clearing filters
  const handleClearFilters = () => {
    const defaultValues: Record<string, any> = {}
    
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaultValues[filter.id] = filter.defaultValue
      } else {
        defaultValues[filter.id] = ''
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
                value={filterValues[filter.id] !== undefined ? filterValues[filter.id] : ''}
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
                value={pendingSearchValue.current !== null ? 
                  pendingSearchValue.current : 
                  (filterValues[filter.id] || '')}
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