'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export interface DrilldownChartConfig {
  targetPath: string
  getFilters: (item: any) => Record<string, any>
  getTooltip?: (item: any) => string
}

/**
 * HOC that enhances a chart component with drill-down capabilities
 */
export const withDrilldown = (
  ChartComponent: React.ComponentType<any>,
  drilldownConfig: DrilldownChartConfig
) => {
  const EnhancedComponent = (props: any) => {
    const router = useRouter()
    
    const handleElementClick = (item: any) => {
      // Build the URL with filters
      const filters = drilldownConfig.getFilters(item)
      let url = drilldownConfig.targetPath
      
      if (filters && Object.keys(filters).length > 0) {
        const params = new URLSearchParams()
        
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, value.toString())
        })
        
        url = `${url}?${params.toString()}`
      }
      
      // Navigate to the target path with filters
      router.push(url)
    }
    
    // Add hover styles and click handler to the chart
    return (
      <div className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]">
        <ChartComponent
          {...props}
          onValueClick={handleElementClick}
          tooltip={drilldownConfig.getTooltip && ((item: any) => drilldownConfig.getTooltip!(item))}
        />
      </div>
    )
  }
  
  return EnhancedComponent
}

export default withDrilldown 