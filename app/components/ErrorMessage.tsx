'use client'

import { FC, ReactNode } from 'react'
import { Card, Title, Text, Button, Flex, Badge } from '@tremor/react'
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info'

export type ErrorMessageProps = {
  /**
   * The title of the error message
   */
  title?: string
  /**
   * The error message content
   */
  message: string
  /**
   * Technical details for developers (optional)
   */
  details?: string
  /**
   * The severity level of the error
   */
  severity?: ErrorSeverity
  /**
   * Text for the retry/refresh action button
   */
  retryText?: string
  /**
   * Function to call when retry button is clicked
   */
  onRetry?: () => void
  /**
   * Text for the alternative action button
   */
  alternativeActionText?: string
  /**
   * Function to call when alternative action button is clicked
   */
  onAlternativeAction?: () => void
  /**
   * Whether to wrap in a Card component
   */
  card?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Show a help link
   */
  helpLink?: string
  /**
   * Custom icon to override the default
   */
  icon?: ReactNode
  /**
   * Icon size
   */
  iconSize?: 'sm' | 'md' | 'lg'
  /**
   * Whether to show the severity badge
   */
  showBadge?: boolean
  /**
   * Whether the error is dismissible
   */
  dismissible?: boolean
  /**
   * Function to call when dismiss button is clicked
   */
  onDismiss?: () => void
}

/**
 * Displays error messages with appropriate visual treatments based on severity
 */
const ErrorMessage: FC<ErrorMessageProps> = ({
  title,
  message,
  details,
  severity = 'error',
  retryText = 'Try again',
  onRetry,
  alternativeActionText,
  onAlternativeAction,
  card = true,
  className = '',
  helpLink,
  icon,
  iconSize = 'md',
  showBadge = true,
  dismissible = false,
  onDismiss
}) => {
  // Get default title based on severity if none provided
  const getDefaultTitle = () => {
    switch (severity) {
      case 'critical':
        return 'Critical Error'
      case 'error':
        return 'Error'
      case 'warning':
        return 'Warning'
      case 'info':
        return 'Information'
      default:
        return 'Error'
    }
  }

  // Get icon based on severity
  const getIcon = () => {
    if (icon) return icon

    switch (severity) {
      case 'critical':
        return <XCircleIcon className={getIconSizeClass()} />
      case 'error':
        return <ExclamationCircleIcon className={getIconSizeClass()} />
      case 'warning':
        return <ExclamationTriangleIcon className={getIconSizeClass()} />
      case 'info':
        return <InformationCircleIcon className={getIconSizeClass()} />
      default:
        return <QuestionMarkCircleIcon className={getIconSizeClass()} />
    }
  }

  // Get icon size class
  const getIconSizeClass = () => {
    switch (iconSize) {
      case 'sm':
        return 'h-8 w-8'
      case 'md':
        return 'h-10 w-10'
      case 'lg':
        return 'h-14 w-14'
      default:
        return 'h-10 w-10'
    }
  }

  // Get color based on severity
  const getColor = () => {
    switch (severity) {
      case 'critical':
        return 'rose'
      case 'error':
        return 'red'
      case 'warning':
        return 'amber'
      case 'info':
        return 'blue'
      default:
        return 'red'
    }
  }

  // Get background color based on severity
  const getBgColor = () => {
    switch (severity) {
      case 'critical':
        return 'bg-error-50'
      case 'error':
        return 'bg-error-50'
      case 'warning':
        return 'bg-warning-50'
      case 'info':
        return 'bg-primary-50'
      default:
        return 'bg-error-50'
    }
  }

  // Get border color based on severity
  const getBorderColor = () => {
    switch (severity) {
      case 'critical':
        return 'border-error-300'
      case 'error':
        return 'border-error-200'
      case 'warning':
        return 'border-warning-200'
      case 'info':
        return 'border-primary-200'
      default:
        return 'border-error-200'
    }
  }

  // Get icon color based on severity
  const getIconColor = () => {
    switch (severity) {
      case 'critical':
        return 'text-error-500'
      case 'error':
        return 'text-error-500'
      case 'warning':
        return 'text-warning-500'
      case 'info':
        return 'text-primary-500'
      default:
        return 'text-error-500'
    }
  }

  const defaultTitle = title || getDefaultTitle()
  const color = getColor()
  const bgColor = getBgColor()
  const borderColor = getBorderColor()
  const iconColor = getIconColor()

  // Render the error content
  const renderErrorContent = () => (
    <div className={`p-4 ${bgColor} rounded-lg ${borderColor} border`}>
      <div className="flex">
        <div className={`shrink-0 ${iconColor}`}>
          {getIcon()}
        </div>
        <div className="ml-3 w-full">
          <div className="flex items-center justify-between">
            <Flex className="items-center space-x-2">
              <Title className="text-lg font-medium">{defaultTitle}</Title>
              {showBadge && (
                <Badge color={color} size="sm">
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Badge>
              )}
            </Flex>
            {dismissible && onDismiss && (
              <button
                type="button"
                className="inline-flex rounded-md bg-transparent text-neutral-400 hover:text-neutral-500 focus:outline-none"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <XCircleIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <Text className="mt-2">{message}</Text>
          
          {details && (
            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-neutral-200">
              <Text className="text-xs font-mono break-all whitespace-pre-wrap">{details}</Text>
            </div>
          )}
          
          {(onRetry || onAlternativeAction || helpLink) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  icon={ArrowPathIcon} 
                  color={color}
                  size="xs"
                >
                  {retryText}
                </Button>
              )}
              
              {onAlternativeAction && alternativeActionText && (
                <Button 
                  onClick={onAlternativeAction} 
                  variant="secondary" 
                  size="xs"
                >
                  {alternativeActionText}
                </Button>
              )}
              
              {helpLink && (
                <a 
                  href={helpLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 text-xs flex items-center hover:underline ml-2"
                >
                  <QuestionMarkCircleIcon className="h-4 w-4 mr-1" />
                  Help documentation
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Wrap in card if needed
  if (card) {
    return (
      <Card className={`p-0 overflow-hidden ${className}`}>
        {renderErrorContent()}
      </Card>
    )
  }
  
  // Otherwise return just the error content
  return <div className={className}>{renderErrorContent()}</div>
}

export default ErrorMessage 