'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Metric, Text, Flex } from '@tremor/react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

export type DrilldownMetricVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral'

export interface DrilldownMetricCardProps {
  title: string
  value: string | number
  subtext?: string
  variant?: DrilldownMetricVariant
  icon?: React.ReactNode
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
  icon,
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
        return { 
          decoration: 'blue', 
          hover: 'hover:bg-blue-50',
          bg: 'bg-gradient-to-br from-blue-50 to-white',
          border: 'border-blue-200',
          iconColor: 'text-blue-600'
        }
      case 'success':
        return { 
          decoration: 'emerald', 
          hover: 'hover:bg-emerald-50',
          bg: 'bg-gradient-to-br from-emerald-50 to-white',
          border: 'border-emerald-200',
          iconColor: 'text-emerald-600'
        }
      case 'warning':
        return { 
          decoration: 'amber', 
          hover: 'hover:bg-amber-50',
          bg: 'bg-gradient-to-br from-amber-50 to-white',
          border: 'border-amber-200',
          iconColor: 'text-amber-600'
        }
      case 'error':
        return { 
          decoration: 'rose', 
          hover: 'hover:bg-rose-50',
          bg: 'bg-gradient-to-br from-rose-50 to-white',
          border: 'border-rose-200', 
          iconColor: 'text-rose-600'
        }
      case 'neutral':
      default:
        return { 
          decoration: 'gray', 
          hover: 'hover:bg-gray-50',
          bg: 'bg-white',
          border: 'border-gray-200',
          iconColor: 'text-gray-500'
        }
    }
  }
  
  const { decoration, hover, bg, border, iconColor } = getColors(variant)
  
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
      className={`transform transition-all ${bg} ${border} ${
        (drilldownHref || onClick) ? `cursor-pointer ${hover}` : ''
      } ${className}`}
      onClick={handleClick}
    >
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Flex alignItems="center" className="space-x-2 mb-2">
            {icon && <div className={`${iconColor}`}>{icon}</div>}
            <Text>{title}</Text>
          </Flex>
          <Metric>{loading ? '...' : value}</Metric>
          {subtext && <Text className="text-gray-500 mt-1">{subtext}</Text>}
        </div>
        {(drilldownHref || onClick) && (
          <ArrowTopRightOnSquareIcon 
            className="h-4 w-4 text-gray-400 hover:text-gray-600" 
          />
        )}
      </Flex>
    </Card>
  )
}

export default DrilldownMetricCard 