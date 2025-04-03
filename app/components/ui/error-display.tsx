'use client'

import React from 'react';
import { Card, Title, Text, Button } from '@tremor/react';
import { EnhancedApiError } from '@/lib/api/client';
import { RefreshCw, AlertTriangle, XCircle, Info } from 'lucide-react';

interface ErrorDisplayProps {
  error: EnhancedApiError | Error | string;
  title?: string;
  onRetry?: () => void;
  onClear?: () => void;
  withDetails?: boolean;
  className?: string;
  showFallbackUI?: boolean;
}

export function ErrorDisplay({
  error,
  title = 'Error',
  onRetry,
  onClear,
  withDetails = false,
  className = '',
  showFallbackUI = false
}: ErrorDisplayProps) {
  // Extract error message
  const errorMessage = typeof error === 'string' 
    ? error 
    : 'message' in error 
      ? error.message 
      : 'An unexpected error occurred';
  
  // Get status code if available (for API errors)
  const statusCode = typeof error === 'object' && 'statusCode' in error 
    ? error.statusCode 
    : undefined;
  
  // Check if 404 error (missing endpoint)
  const is404 = statusCode === 404;
  
  // Determine severity type
  const getSeverityColor = () => {
    if (is404) return 'yellow';
    if (statusCode && statusCode >= 500) return 'red';
    if (statusCode && statusCode >= 400) return 'orange';
    return 'red';
  };

  // Determine appropriate icon
  const Icon = is404 ? Info : AlertTriangle;
  
  // For 404 errors, provide a more helpful message
  const displayMessage = is404 
    ? 'This feature is not available in the current API. The endpoint may not be implemented yet.'
    : errorMessage;
  
  // Short title based on error type
  const shortTitle = is404 ? 'Feature Unavailable' : title;

  // Simple card display for all error types
  return (
    <Card className={`p-4 ${className}`}>
      <div className={`${showFallbackUI ? 'text-center p-6' : 'p-2'}`}>
        <div className="flex items-center mb-2">
          <Icon className={`h-5 w-5 mr-2 text-${getSeverityColor()}-500`} />
          <Title className="text-base">{shortTitle}</Title>
        </div>
        
        <Text className="mb-4">{displayMessage}</Text>
        
        {withDetails && typeof error === 'object' && 'statusCode' in error && (
          <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 overflow-auto max-h-32">
            {JSON.stringify({
              code: error.errorCode || 'UNKNOWN',
              status: error.statusCode,
              url: error.requestUrl,
              method: error.requestMethod,
              timestamp: error.timestamp
            }, null, 2)}
          </div>
        )}
        
        <div className="flex gap-2 mt-2">
          {onRetry && (
            <Button size="xs" onClick={onRetry} icon={RefreshCw} variant="secondary">
              Try Again
            </Button>
          )}
          {onClear && (
            <Button size="xs" onClick={onClear} icon={XCircle} variant="light">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
} 