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
}

const getVariantStyles = (variant: MetricCardProps['variant'] = 'primary') => {
  const variants = {
    primary: {
      icon: 'bg-primary-100 text-primary-700',
      card: 'border-primary-100',
      value: 'text-primary-700'
    },
    secondary: {
      icon: 'bg-secondary-100 text-secondary-700',
      card: 'border-secondary-100',
      value: 'text-secondary-700'
    },
    success: {
      icon: 'bg-success-100 text-success-700',
      card: 'border-success-100',
      value: 'text-success-700'
    },
    warning: {
      icon: 'bg-warning-100 text-warning-700',
      card: 'border-warning-100',
      value: 'text-warning-700'
    },
    error: {
      icon: 'bg-error-100 text-error-700',
      card: 'border-error-100',
      value: 'text-error-700'
    },
    neutral: {
      icon: 'bg-neutral-100 text-neutral-700',
      card: 'border-neutral-100',
      value: 'text-neutral-700'
    }
  }
  
  return variants[variant]
}

const getSizeStyles = (size: MetricCardProps['size'] = 'md') => {
  const sizes = {
    sm: {
      card: 'p-4',
      title: 'text-sm',
      value: 'text-xl font-semibold',
      trend: 'text-xs'
    },
    md: {
      card: 'p-5',
      title: 'text-sm',
      value: 'text-2xl font-semibold',
      trend: 'text-sm'
    },
    lg: {
      card: 'p-6',
      title: 'text-base',
      value: 'text-3xl font-bold',
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
  loading = false
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
      className={`border ${variantStyles.card} ${sizeStyles.card} transition-all duration-200 hover:shadow-md ${className}`}
    >
      <Flex className="justify-between items-start">
        {icon && (
          <div className={`rounded-md p-2 ${variantStyles.icon}`}>
            {icon}
          </div>
        )}
        
        <div className={`flex flex-col ${icon ? 'ml-3' : ''} flex-grow`}>
          <Text className={`${sizeStyles.title} text-neutral-600 mb-1`}>{title}</Text>
          
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
        </div>
      </Flex>
    </Card>
  )
}

export default MetricCard 