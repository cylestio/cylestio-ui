'use client'

import { FC, ReactNode } from 'react'
import { Card, Title, Text, Button, Flex } from '@tremor/react'
import {
  DocumentTextIcon,
  ChartBarIcon,
  TableCellsIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export type EmptyStateProps = {
  /**
   * Primary title text
   */
  title?: string
  /**
   * Description or guidance text
   */
  description?: string
  /**
   * Type of content that is empty, affects default messaging and icon
   */
  contentType?: 'data' | 'chart' | 'metrics' | 'table' | 'custom'
  /**
   * Custom icon to display
   */
  icon?: ReactNode
  /**
   * Action button text
   */
  actionText?: string
  /**
   * Function to execute when action button is clicked
   */
  onAction?: () => void
  /**
   * Secondary action button text
   */
  secondaryActionText?: string
  /**
   * Function to execute when secondary action button is clicked
   */
  onSecondaryAction?: () => void
  /**
   * Card to wrap the empty state (set to false for inline empty state)
   */
  card?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Show illustration or just use icon
   */
  showIllustration?: boolean
  /**
   * Icon size
   */
  iconSize?: 'sm' | 'md' | 'lg'
  /**
   * Additional custom content to display
   */
  children?: ReactNode
}

/**
 * Empty state component for when there is no data to display
 */
const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  contentType = 'data',
  icon,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  card = true,
  className = '',
  showIllustration = true,
  iconSize = 'lg',
  children
}) => {
  // Get default values based on content type
  const getDefaultValues = () => {
    switch (contentType) {
      case 'chart':
        return {
          title: title || 'No chart data available',
          description: description || 'There is no visualization data to display right now.',
          icon: icon || <ChartBarIcon className={getIconSizeClass()} />
        }
      case 'metrics':
        return {
          title: title || 'No metrics available',
          description: description || 'No metrics data has been collected yet.',
          icon: icon || <ChartBarIcon className={getIconSizeClass()} />
        }
      case 'table':
        return {
          title: title || 'No items found',
          description: description || 'No data entries match the current criteria.',
          icon: icon || <TableCellsIcon className={getIconSizeClass()} />
        }
      case 'custom':
        return {
          title: title || 'Nothing to display',
          description: description,
          icon: icon || <InformationCircleIcon className={getIconSizeClass()} />
        }
      default:
        return {
          title: title || 'No data available',
          description: description || 'There is no data to display right now.',
          icon: icon || <DocumentTextIcon className={getIconSizeClass()} />
        }
    }
  }

  // Get icon size class based on size prop
  const getIconSizeClass = () => {
    switch (iconSize) {
      case 'sm':
        return 'h-8 w-8 text-neutral-400'
      case 'md':
        return 'h-12 w-12 text-neutral-400'
      case 'lg':
      default:
        return 'h-16 w-16 text-neutral-400'
    }
  }

  const { title: defaultTitle, description: defaultDescription, icon: defaultIcon } = getDefaultValues()

  // Render the empty state content
  const renderEmptyContent = () => (
    <Flex justifyContent="center" alignItems="center" className="py-8" flexDirection="col">
      {showIllustration && (
        <div className="mb-4">
          {defaultIcon}
        </div>
      )}
      
      <Title className="text-center mb-2">{defaultTitle}</Title>
      
      {defaultDescription && (
        <Text className="text-center text-neutral-500 max-w-md mb-6">{defaultDescription}</Text>
      )}
      
      {children}
      
      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {actionText && onAction && (
            <Button onClick={onAction} icon={PlusCircleIcon} color="blue">
              {actionText}
            </Button>
          )}
          
          {secondaryActionText && onSecondaryAction && (
            <Button 
              onClick={onSecondaryAction} 
              icon={ArrowPathIcon} 
              variant="secondary" 
              color="gray"
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </Flex>
  )

  // Wrap in card if needed
  if (card) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        {renderEmptyContent()}
      </Card>
    )
  }
  
  // Otherwise return just the empty state content
  return <div className={className}>{renderEmptyContent()}</div>
}

export default EmptyState 