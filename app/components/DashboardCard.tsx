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
  actions?: ReactNode
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
  switch (variant) {
    case 'primary':
      return {
        header: 'bg-blue-50',
        border: 'border-blue-200',
        title: 'text-blue-700',
        iconColor: 'text-blue-600'
      }
    case 'secondary':
      return {
        header: 'bg-purple-50',
        border: 'border-purple-200',
        title: 'text-purple-700',
        iconColor: 'text-purple-600'
      }
    case 'neutral':
      return {
        header: 'bg-neutral-50',
        border: 'border-neutral-200',
        title: 'text-neutral-700',
        iconColor: 'text-neutral-600'
      }
    default:
      return {
        header: '',
        border: 'border-neutral-200',
        title: 'text-neutral-800',
        iconColor: 'text-neutral-500'
      }
  }
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  children,
  className = '',
  contentClassName = '',
  icon,
  actions,
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
        overflow-visible
        ${showBorder ? `border ${variantStyles.border}` : 'border-transparent'} 
        transition-all duration-200 hover:shadow-md
        ${mobileOptimized && isMobile ? 'dashboard-card-mobile' : ''}
        ${className}
      `}
    >
      {/* Card Header */}
      <div className={`flex items-center justify-between ${description ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-center">
          {icon && <div className={`mr-2 ${variantStyles.iconColor}`}>{icon}</div>}
          <Title className={mobileOptimized && isMobile ? 'dashboard-card-title-mobile' : ''}>{title}</Title>
          
          {helpText && (
            <div className="relative ml-1.5 group">
              <InformationCircleIcon className="h-4 w-4 text-neutral-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white rounded shadow-lg border border-neutral-200 text-xs text-neutral-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50">
                {helpText}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
          
          {collapsible && (
            <button 
              onClick={toggleCollapse} 
              className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors duration-150"
            >
              {isCollapsed ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronUpIcon className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
      
      {/* Card Description */}
      {description && (
        <Text className="text-sm text-neutral-500 mb-4">
          {description}
        </Text>
      )}
      
      {/* Card Content - collapsible if specified */}
      <div 
        className={`
          ${contentClassName}
          ${collapsible ? 'transition-all duration-300 ease-in-out' : ''}
          ${collapsible && isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'overflow-visible opacity-100'}
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