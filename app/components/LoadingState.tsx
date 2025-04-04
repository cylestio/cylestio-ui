'use client'

import { FC, ReactNode } from 'react'
import { Card, Text, Flex } from '@tremor/react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export type LoadingStateProps = {
  /**
   * Text to display while loading
   */
  message?: string
  /**
   * Loading variant determines visual style
   */
  variant?: 'default' | 'skeleton' | 'spinner' | 'minimal'
  /**
   * Loading state for specific content type influencing appearance
   */
  contentType?: 'data' | 'chart' | 'metrics' | 'table'
  /**
   * Number of skeleton items to show (for skeleton variant)
   */
  skeletonCount?: number
  /**
   * Card to wrap the loading state (set to false for inline loading)
   */
  card?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Show loading indicator text
   */
  showText?: boolean
  /**
   * Custom icon to show alongside loading state
   */
  icon?: ReactNode
  /**
   * Height of the loading container
   */
  height?: string
}

/**
 * Consistent loading state component with multiple variants
 */
const LoadingState: FC<LoadingStateProps> = ({
  message = 'Loading data...',
  variant = 'default',
  contentType = 'data',
  skeletonCount = 4,
  card = true,
  className = '',
  showText = true,
  icon,
  height = 'h-40'
}) => {
  // Contextual loading message based on content type
  const getContextualMessage = () => {
    if (message !== 'Loading data...') return message
    
    switch (contentType) {
      case 'chart':
        return 'Loading visualization...'
      case 'metrics':
        return 'Loading metrics...'
      case 'table':
        return 'Loading table data...'
      default:
        return 'Loading data...'
    }
  }
  
  // Determine the appropriate loading content based on variant
  const renderLoadingContent = () => {
    switch (variant) {
      case 'skeleton':
        return (
          <div className="w-full animate-pulse space-y-4">
            {contentType === 'metrics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(skeletonCount)].map((_, i) => (
                  <div key={i} className="bg-neutral-100 h-32 rounded-lg"></div>
                ))}
              </div>
            )}
            
            {contentType === 'chart' && (
              <div className="bg-neutral-100 h-64 rounded-lg w-full"></div>
            )}
            
            {contentType === 'table' && (
              <div className="space-y-2">
                <div className="bg-neutral-100 h-10 rounded-lg w-full"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-neutral-100 h-12 rounded-lg w-full"></div>
                ))}
              </div>
            )}
            
            {contentType === 'data' && (
              <>
                <div className="bg-neutral-100 h-8 rounded-lg w-3/4"></div>
                <div className="bg-neutral-100 h-32 rounded-lg w-full"></div>
                <div className="bg-neutral-100 h-8 rounded-lg w-1/2"></div>
              </>
            )}
          </div>
        )
      
      case 'spinner':
        return (
          <Flex justifyContent="center" alignItems="center" className={`${height} w-full`}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mr-3"></div>
            {showText && <Text>{getContextualMessage()}</Text>}
          </Flex>
        )
        
      case 'minimal':
        return (
          <Flex justifyContent="center" alignItems="center" className="py-4">
            <div className="animate-spin h-5 w-5 text-primary-500 mr-2">
              {icon || <ArrowPathIcon className="h-5 w-5" />}
            </div>
            {showText && <Text className="text-sm">{getContextualMessage()}</Text>}
          </Flex>
        )
        
      default:
        return (
          <Flex justifyContent="center" alignItems="center" className={`${height} w-full`} flexDirection="col">
            <div
              role="status"
              aria-label="Loading"
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-3"
            ></div>
            {showText && <Text>{getContextualMessage()}</Text>}
          </Flex>
        )
    }
  }
  
  // Wrap in card if needed
  if (card) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        {renderLoadingContent()}
      </Card>
    )
  }
  
  // Otherwise return just the loading content
  return <div className={className}>{renderLoadingContent()}</div>
}

export default LoadingState 