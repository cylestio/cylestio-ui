'use client'

import React from 'react'
import { Card, Badge, Flex, Metric, Text } from '@tremor/react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { MinusIcon } from '@heroicons/react/24/outline'
import { SPACING } from './spacing'

export type MetricTrend = 'up' | 'down' | 'flat'

export type MetricCardProps = {
  title: string
  value: string | number
  trend?: {
    value: number
    direction: MetricTrend
    isPositive?: boolean
  }
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  className?: string
  titleClassName?: string
  valueClassName?: string
  allowDecimals?: boolean
  formatValue?: (value: number | string) => string
  onClick?: () => void
}

export default function MetricCard({
  title,
  value,
  trend,
  icon,
  variant = 'neutral',
  size = 'md',
  loading = false,
  className = '',
  titleClassName = '',
  valueClassName = '',
  allowDecimals = false,
  formatValue,
  onClick
}: MetricCardProps) {
  
  // Helper to format the value
  const formatDisplayValue = () => {
    if (formatValue) {
      return formatValue(value)
    }
    
    if (typeof value === 'number') {
      return allowDecimals 
        ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : Math.round(value).toLocaleString()
    }
    
    return value
  }
  
  // Map variant to color classes
  const getVariantClasses = (variant: MetricCardProps['variant']) => {
    const variantMap = {
      primary: 'border-primary-200 bg-gradient-to-br from-primary-50 to-white',
      secondary: 'border-secondary-200 bg-gradient-to-br from-secondary-50 to-white',
      success: 'border-success-200 bg-gradient-to-br from-success-50 to-white',
      warning: 'border-warning-200 bg-gradient-to-br from-warning-50 to-white',
      error: 'border-error-200 bg-gradient-to-br from-error-50 to-white',
      neutral: 'border-neutral-200 bg-white'
    }
    
    return variantMap[variant || 'neutral']
  }
  
  // Map size to spacing classes
  const getSizeClasses = (size: MetricCardProps['size']) => {
    const sizeMap = {
      sm: {
        padding: SPACING.TAILWIND.CARD,
        title: 'text-xs',
        value: 'text-xl',
        icon: 'h-5 w-5'
      },
      md: {
        padding: SPACING.TAILWIND.CARD,
        title: 'text-sm',
        value: 'text-2xl',
        icon: 'h-6 w-6'
      },
      lg: {
        padding: SPACING.TAILWIND.CARD,
        title: 'text-base',
        value: 'text-3xl',
        icon: 'h-7 w-7'
      }
    }
    
    return sizeMap[size || 'md']
  }
  
  // Get trend badge color
  const getTrendColor = () => {
    if (!trend) return 'gray'
    
    const { direction, isPositive } = trend
    
    // If isPositive is explicitly set, use that to determine color
    if (isPositive !== undefined) {
      if (direction === 'flat') return 'gray'
      return isPositive ? 'green' : 'red'
    }
    
    // Otherwise, assume up is good, down is bad
    if (direction === 'up') return 'green'
    if (direction === 'down') return 'red'
    return 'gray'
  }
  
  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return null
    
    const { direction } = trend
    
    if (direction === 'up') {
      return <ArrowUpIcon className="h-4 w-4" />
    } else if (direction === 'down') {
      return <ArrowDownIcon className="h-4 w-4" />
    } else {
      return <MinusIcon className="h-4 w-4" />
    }
  }
  
  // Get trend text
  const getTrendText = () => {
    if (!trend) return ''
    
    const { value, direction } = trend
    const prefix = direction === 'flat' ? '' : direction === 'up' ? '+' : '-'
    const formattedValue = allowDecimals 
      ? Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : Math.abs(Math.round(value)).toLocaleString()
    
    return direction === 'flat' ? 'No change' : `${prefix}${formattedValue}%`
  }
  
  const sizeClasses = getSizeClasses(size)
  const variantClasses = getVariantClasses(variant)
  
  return (
    <Card
      className={`
        border ${variantClasses}
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className={`${sizeClasses.padding} -m-4`}>
        <Flex className={SPACING.TAILWIND.FLEX_GAP} justifyContent="between" alignItems="start">
          <div>
            <Text className={`${sizeClasses.title} font-medium text-neutral-500 ${titleClassName}`}>
              {title}
            </Text>
            
            <Metric className={`${sizeClasses.value} mt-1 font-semibold ${valueClassName}`}>
              {loading ? (
                <div className="h-8 w-20 bg-neutral-100 rounded animate-pulse"></div>
              ) : (
                formatDisplayValue()
              )}
            </Metric>
          </div>
          
          {icon && (
            <div className={`${sizeClasses.icon} ${getIconColorClass(variant)}`}>
              {icon}
            </div>
          )}
        </Flex>
        
        {trend && (
          <div className="mt-3">
            <Badge
              color={getTrendColor()}
              size="xs"
            >
              <span className="flex items-center">
                {getTrendIcon()}
                <span className="ml-1">{getTrendText()}</span>
              </span>
            </Badge>
          </div>
        )}
      </div>
    </Card>
  )
}

// Helper function to get icon color based on variant
function getIconColorClass(variant: MetricCardProps['variant'] = 'neutral') {
  const colorMap = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    error: 'text-error-500',
    neutral: 'text-neutral-500'
  }
  
  return colorMap[variant]
}