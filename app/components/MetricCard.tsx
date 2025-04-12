'use client'

import React from 'react'
import { Card, Flex, Text } from '@tremor/react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { colors } from './DesignSystem'

export type MetricCardProps = {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'flat'
    label?: string
    isPositive?: boolean
  }
  className?: string
  valueClassName?: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  footer?: React.ReactNode
}

const getVariantStyles = (variant: MetricCardProps['variant'] = 'primary') => {
  const variants = {
    primary: {
      icon: 'bg-blue-50 text-blue-600',
      card: 'border-blue-100',
      value: 'text-blue-700'
    },
    secondary: {
      icon: 'bg-indigo-50 text-indigo-600',
      card: 'border-indigo-100',
      value: 'text-indigo-700'
    },
    success: {
      icon: 'bg-emerald-50 text-emerald-600',
      card: 'border-emerald-100',
      value: 'text-emerald-700'
    },
    warning: {
      icon: 'bg-amber-50 text-amber-600',
      card: 'border-amber-100',
      value: 'text-amber-700'
    },
    error: {
      icon: 'bg-red-50 text-red-600',
      card: 'border-red-100',
      value: 'text-red-700'
    },
    neutral: {
      icon: 'bg-gray-50 text-gray-600',
      card: 'border-gray-100',
      value: 'text-gray-700'
    }
  }
  
  return variants[variant]
}

const getSizeStyles = (size: MetricCardProps['size'] = 'md') => {
  const sizes = {
    sm: {
      card: 'p-4',
      title: 'text-sm font-medium',
      value: 'text-xl font-semibold',
      trend: 'text-xs'
    },
    md: {
      card: 'p-5',
      title: 'text-base font-medium',
      value: 'text-2xl font-semibold',
      trend: 'text-sm'
    },
    lg: {
      card: 'p-6',
      title: 'text-lg font-medium',
      value: 'text-3xl font-semibold',
      trend: 'text-sm'
    }
  }
  
  return sizes[size]
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = '',
  valueClassName = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  footer
}) => {
  const variantStyles = getVariantStyles(variant)
  const sizeStyles = getSizeStyles(size)
  
  const getTrendColor = (trend?: MetricCardProps['trend']) => {
    if (!trend) return 'text-neutral-500'
    
    if (trend.isPositive !== undefined) {
      return trend.isPositive 
        ? (trend.direction === 'up' ? 'text-success-500' : 'text-error-500')
        : (trend.direction === 'up' ? 'text-error-500' : 'text-success-500')
    }
    
    if (trend.direction === 'up') return 'text-success-500'
    if (trend.direction === 'down') return 'text-error-500'
    return 'text-neutral-500'
  }
  
  return (
    <Card 
      className={`border border-t-0 border-r-0 border-b-2 border-l-0 shadow-sm ${variantStyles.card} ${sizeStyles.card} transition-all duration-200 hover:shadow-md ${className}`}
    >
      <Flex className="justify-between items-start">
        {icon && (
          <div className={`rounded-full p-3 ${variantStyles.icon}`}>
            {icon}
          </div>
        )}
        
        <div className={`flex flex-col ${icon ? 'ml-4' : ''} flex-grow`}>
          <Text className={`${sizeStyles.title} text-gray-600`}>{title}</Text>
          
          {loading ? (
            <div className="animate-pulse h-8 bg-neutral-100 rounded w-2/3 mt-1"></div>
          ) : (
            <Text className={`${sizeStyles.value} ${variantStyles.value} ${valueClassName}`}>
              {value}
            </Text>
          )}
          
          {trend && (
            <Flex className={`items-center mt-2 ${getTrendColor(trend)}`}>
              {trend.direction === 'up' && <ArrowUpIcon className="h-4 w-4 mr-1" />}
              {trend.direction === 'down' && <ArrowDownIcon className="h-4 w-4 mr-1" />}
              <Text className={`${sizeStyles.trend}`}>
                {trend.value}% {trend.label || (trend.direction === 'flat' ? 'flat' : trend.direction)}
              </Text>
            </Flex>
          )}
          
          {footer && (
            <div className="mt-2">
              {footer}
            </div>
          )}
        </div>
      </Flex>
    </Card>
  )
}

export default MetricCard