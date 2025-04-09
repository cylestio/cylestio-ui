'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import MetricCard, { MetricCardProps } from './MetricCard'

export interface DrilldownMetricCardProps extends MetricCardProps {
  /**
   * The URL to navigate to when the card is clicked
   */
  href: string
  
  /**
   * Optional query parameters to add to the URL
   */
  queryParams?: Record<string, string | number | boolean>
  
  /**
   * Optional onClick handler that will be called before navigation
   */
  onClick?: (e: React.MouseEvent) => void
  
  /**
   * Whether to disable the hover effect
   */
  disableHover?: boolean
}

/**
 * An enhanced version of MetricCard that supports navigation to drill-down pages
 */
const DrilldownMetricCard: React.FC<DrilldownMetricCardProps> = ({ 
  href,
  queryParams,
  onClick,
  disableHover = false,
  className = '',
  ...metricCardProps
}) => {
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e)
    }
    
    let url = href
    
    // Add query parameters if provided
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams()
      
      Object.entries(queryParams).forEach(([key, value]) => {
        params.append(key, value.toString())
      })
      
      url = `${url}?${params.toString()}`
    }
    
    router.push(url)
  }
  
  return (
    <div 
      onClick={handleClick}
      className={`cursor-pointer ${!disableHover ? 'transition-transform duration-200 hover:-translate-y-1' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as unknown as React.MouseEvent)
        }
      }}
      aria-label={`View details for ${metricCardProps.title}`}
    >
      <MetricCard
        {...metricCardProps}
        className={`${className}`}
      />
    </div>
  )
}

export default DrilldownMetricCard 