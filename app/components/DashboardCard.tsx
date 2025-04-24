'use client'

import React, { ReactNode, useState } from 'react'
import { Card, Text, Flex, Divider } from '@tremor/react'
import { InformationCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { SPACING } from './spacing'

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
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  collapsible?: boolean
  defaultCollapsed?: boolean
  mobileOptimized?: boolean
}

const getVariantStyles = (variant: DashboardCardProps['variant'] = 'default') => {
  switch (variant) {
    case 'primary':
      return { border: 'border-primary-300', headerBg: 'bg-primary-50', iconColor: 'text-primary-500' }
    case 'success':
      return { border: 'border-success-300', headerBg: 'bg-success-50', iconColor: 'text-success-500' }
    case 'warning':
      return { border: 'border-warning-300', headerBg: 'bg-warning-50', iconColor: 'text-warning-500' }
    case 'error':
      return { border: 'border-error-300', headerBg: 'bg-error-50', iconColor: 'text-error-500' }
    default:
      return { border: 'border-neutral-200', headerBg: 'bg-white', iconColor: 'text-gray-500' }
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
      <div className={`-mx-4 -mt-4 ${SPACING.TAILWIND.CARD} ${variantStyles.headerBg} rounded-t-lg mb-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {icon && (
              <span className={`${variantStyles.iconColor} flex-shrink-0 mr-2`}>
                {icon}
              </span>
            )}
            <h2 className="text-lg font-semibold leading-6 text-gray-900 m-0">{title}</h2>
            
            {description && (
              <span className="ml-2">
                <Text className="text-sm text-gray-500">{description}</Text>
              </span>
            )}
            
            {helpText && (
              <div className="relative group ml-2 flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 cursor-help" />
                <div className="absolute left-0 -bottom-1 transform translate-y-full w-64 bg-white border border-gray-200 rounded-md p-2 shadow-lg text-sm hidden group-hover:block z-10">
                  {helpText}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {actions && <div>{actions}</div>}
            
            {collapsible && (
              <button 
                onClick={toggleCollapse} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {isCollapsed ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronUpIcon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Card Content */}
      {!isCollapsed && (
        <div className={contentClassName}>
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
      )}
      
      {/* Card Footer */}
      {footer && !isCollapsed && (
        <>
          <Divider className="my-3" />
          <div className="pt-2">
            {footer}
          </div>
        </>
      )}
    </Card>
  )
}

export default DashboardCard 