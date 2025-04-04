'use client'

import React, { ReactNode, useState } from 'react'
import { Card, Title, Text, Flex } from '@tremor/react'
import { InformationCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export type DashboardCardProps = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  contentClassName?: string
  icon?: ReactNode
  footer?: ReactNode
  helpText?: string
  isLoading?: boolean
  showBorder?: boolean
  variant?: 'default' | 'primary' | 'secondary' | 'neutral'
  collapsible?: boolean
  defaultCollapsed?: boolean
  mobileOptimized?: boolean
}

const getVariantStyles = (variant: DashboardCardProps['variant'] = 'default') => {
  const variants = {
    default: {
      header: '',
      border: 'border-neutral-200',
      title: 'text-neutral-900'
    },
    primary: {
      header: 'bg-primary-50',
      border: 'border-primary-200',
      title: 'text-primary-900'
    },
    secondary: {
      header: 'bg-secondary-50',
      border: 'border-secondary-200',
      title: 'text-secondary-900'
    },
    neutral: {
      header: 'bg-neutral-50',
      border: 'border-neutral-200',
      title: 'text-neutral-900'
    }
  }
  
  return variants[variant]
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  children,
  className = '',
  contentClassName = '',
  icon,
  footer,
  helpText,
  isLoading = false,
  showBorder = true,
  variant = 'default',
  collapsible = false,
  defaultCollapsed = false,
  mobileOptimized = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const variantStyles = getVariantStyles(variant)
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Determine if we should apply mobile styles
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  
  return (
    <Card 
      className={`
        overflow-hidden
        ${showBorder ? `border ${variantStyles.border}` : 'border-transparent'} 
        transition-all duration-200 hover:shadow-md
        ${mobileOptimized && isMobile ? 'dashboard-card-mobile' : ''}
        ${className}
      `}
    >
      {/* Card Header */}
      {(title || icon) && (
        <div 
          className={`
            flex justify-between items-center
            ${description ? 'mb-1' : 'mb-4'}
            ${variantStyles.header && 'px-6 py-3 -mx-6 -mt-6 mb-6 border-b border-neutral-200'}
            ${collapsible ? 'cursor-pointer' : ''}
          `}
          onClick={collapsible ? toggleCollapse : undefined}
        >
          <Flex className="items-center space-x-2">
            {icon && <span className="text-neutral-500">{icon}</span>}
            
            <Title className={`text-lg font-medium ${variantStyles.title} ${mobileOptimized && isMobile ? 'dashboard-card-title-mobile' : ''}`}>
              {title}
            </Title>
            
            {helpText && (
              <div className="relative group">
                <InformationCircleIcon className="h-5 w-5 text-neutral-400 cursor-help" />
                <div className="absolute z-10 left-0 bottom-full mb-2 w-64 p-2 bg-white rounded shadow-lg border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Text className="text-xs text-neutral-700">{helpText}</Text>
                </div>
              </div>
            )}
          </Flex>
          
          {collapsible && (
            <span className="text-neutral-400">
              {isCollapsed ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronUpIcon className="h-5 w-5" />
              )}
            </span>
          )}
        </div>
      )}
      
      {/* Description */}
      {description && (
        <Text className="text-neutral-500 text-sm mb-4">
          {description}
        </Text>
      )}
      
      {/* Card Content - collapsible if specified */}
      <div 
        className={`
          ${contentClassName}
          ${collapsible ? 'transition-all duration-300 ease-in-out' : ''}
          ${collapsible && isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-screen opacity-100'}
        `}
      >
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-12 bg-neutral-100 rounded"></div>
            <div className="h-28 bg-neutral-100 rounded"></div>
            <div className="h-8 bg-neutral-100 rounded w-2/3"></div>
          </div>
        ) : (
          children
        )}
      </div>
      
      {/* Card Footer */}
      {footer && !isCollapsed && (
        <div className="mt-4 pt-3 border-t border-neutral-200">
          {footer}
        </div>
      )}
    </Card>
  )
}

export default DashboardCard 