'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Metric, Text } from '@tremor/react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

export type DrilldownMetricVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral'

export interface DrilldownMetricCardProps {
  title: string
  value: string | number
  subtext?: string
  variant?: DrilldownMetricVariant
  loading?: boolean
  drilldownHref?: string
  onClick?: () => void
  className?: string
  preserveCurrentFilters?: boolean
}

/**
 * A metric card component that can be clicked to drill down to more details
 */
const DrilldownMetricCard: React.FC<DrilldownMetricCardProps> = ({
  title,
  value,
  subtext,
  variant = 'primary',
  loading = false,
  drilldownHref,
  onClick,
  className = '',
  preserveCurrentFilters = false
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Map variant to colors
  const getColors = (variant: DrilldownMetricVariant) => {
    switch (variant) {
      case 'primary':
        return { decoration: 'blue', hover: 'hover:bg-blue-50' }
      case 'success':
        return { decoration: 'emerald', hover: 'hover:bg-emerald-50' }
      case 'warning':
        return { decoration: 'amber', hover: 'hover:bg-amber-50' }
      case 'error':
        return { decoration: 'rose', hover: 'hover:bg-rose-50' }
      case 'neutral':
      default:
        return { decoration: 'gray', hover: 'hover:bg-gray-50' }
    }
  }
  
  const { decoration, hover } = getColors(variant)
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (drilldownHref) {
      // If we should preserve current filters, append them to the URL
      if (preserveCurrentFilters) {
        const params = new URLSearchParams(searchParams.toString())
        const queryString = params.toString()
        const separator = drilldownHref.includes('?') ? '&' : '?'
        const url = queryString ? `${drilldownHref}${separator}${queryString}` : drilldownHref
        router.push(url)
      } else {
        router.push(drilldownHref)
      }
    }
  }
  
  return (
    <Card
      decoration="top"
      decorationColor={decoration}
      className={`transform transition-all ${
        (drilldownHref || onClick) ? `cursor-pointer ${hover}` : ''
      } ${className}`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <Text>{title}</Text>
        {(drilldownHref || onClick) && (
          <ArrowTopRightOnSquareIcon 
            className="h-4 w-4 text-gray-400 hover:text-gray-600" 
          />
        )}
      </div>
      <Metric className="mt-2">{loading ? '...' : value}</Metric>
      {subtext && <Text className="text-gray-500 mt-1">{subtext}</Text>}
    </Card>
  )
}

export default DrilldownMetricCard 