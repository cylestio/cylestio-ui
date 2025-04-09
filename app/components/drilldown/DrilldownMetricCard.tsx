'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import MetricCard, { MetricCardProps } from '../MetricCard'

export interface DrilldownMetricCardProps extends MetricCardProps {
  /**
   * Where to navigate on click
   */
  drilldownHref?: string
  
  /**
   * Simple filters to apply in the target view
   */
  drilldownFilters?: Record<string, string | number>
  
  /**
   * Accessible label for the drilldown action
   */
  drilldownLabel?: string
  
  /**
   * Optional onClick handler that will be called before navigation
   */
  onClick?: (e: React.MouseEvent) => void
}

/**
 * An enhanced version of MetricCard that supports navigation to drill-down pages
 */
const DrilldownMetricCard: React.FC<DrilldownMetricCardProps> = ({ 
  drilldownHref,
  drilldownFilters,
  drilldownLabel,
  onClick,
  className = '',
  ...metricCardProps
}) => {
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e)
    }
    
    if (!drilldownHref) return
    
    let url = drilldownHref
    
    // Add query parameters if provided
    if (drilldownFilters && Object.keys(drilldownFilters).length > 0) {
      const params = new URLSearchParams()
      
      Object.entries(drilldownFilters).forEach(([key, value]) => {
        params.append(key, value.toString())
      })
      
      url = `${url}?${params.toString()}`
    }
    
    router.push(url)
  }
  
  if (!drilldownHref) {
    return <MetricCard {...metricCardProps} className={className} />
  }
  
  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer transition-transform duration-200 hover:-translate-y-1"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as unknown as React.MouseEvent)
        }
      }}
      aria-label={drilldownLabel || `View details for ${metricCardProps.title}`}
    >
      <MetricCard
        {...metricCardProps}
        className={`${className}`}
      />
    </div>
  )
}

export default DrilldownMetricCard 