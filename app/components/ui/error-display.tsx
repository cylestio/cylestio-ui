'use client'

import React from 'react';
import { FaExclamationTriangle, FaExclamation, FaInfoCircle } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';
import { EnhancedApiError } from '@/lib/api/client';

export interface ErrorDisplayProps {
  error: EnhancedApiError | Error | string;
  title?: string;
  onRetry?: () => void;
  onClear?: () => void;
  variant?: 'error' | 'warning' | 'info';
  withDetails?: boolean;
  className?: string;
}

export function ErrorDisplay({
  error,
  title,
  onRetry,
  onClear,
  variant = 'error',
  withDetails = true,
  className = '',
}: ErrorDisplayProps) {
  // Helper function to safely stringify errors
  const safeStringify = (obj: any): string => {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'string') return obj;
    if (obj instanceof Error) return obj.message || 'Unknown error';
    if (typeof obj === 'object') {
      // For EnhancedApiError objects
      if ('message' in obj) return obj.message;
      
      // For other objects
      try {
        return JSON.stringify(obj);
      } catch (e) {
        return 'Error object could not be stringified';
      }
    }
    return String(obj);
  };
  
  // Extract error details
  const errorMessage = safeStringify(error);
  
  const statusCode = error instanceof Error && 'statusCode' in error 
    ? (error as any).statusCode 
    : null;
  
  const errorCode = error instanceof Error && 'errorCode' in error 
    ? (error as any).errorCode 
    : (error instanceof Error && 'code' in error ? (error as any).code : null);
  
  const timestamp = error instanceof Error && 'timestamp' in error 
    ? (error as any).timestamp 
    : new Date().toLocaleString();

  // Determine variant styling
  const bgColor = 
    variant === 'error' ? 'bg-red-50' : 
    variant === 'warning' ? 'bg-amber-50' : 
    'bg-blue-50';
  
  const borderColor = 
    variant === 'error' ? 'border-red-200' : 
    variant === 'warning' ? 'border-amber-200' : 
    'border-blue-200';
  
  const textColor = 
    variant === 'error' ? 'text-red-700' : 
    variant === 'warning' ? 'text-amber-700' : 
    'text-blue-700';

  // Instead of using IconType, just specify which icon to use directly
  let IconComponent;
  if (variant === 'error') {
    IconComponent = FaExclamationTriangle;
  } else if (variant === 'warning') {
    IconComponent = FaExclamation;
  } else {
    IconComponent = FaInfoCircle;
  }

  return (
    <div className={`rounded-md ${bgColor} p-4 border ${borderColor} ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${textColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>
            {title || (variant === 'error' ? 'An unexpected error occurred' : 'Warning')}
          </h3>
          <div className="mt-2 text-sm text-gray-700">
            <div>{errorMessage}</div>
            
            {withDetails && statusCode && (
              <div className="mt-1 text-xs">Status: {statusCode}</div>
            )}
            
            {withDetails && errorCode && (
              <div className="mt-1 text-xs">Code: {errorCode}</div>
            )}
            
            {withDetails && (
              <div className="mt-1 text-xs">
                Time: {timestamp}
              </div>
            )}
          </div>

          {(onRetry || onClear) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <button
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-sm font-medium text-${variant === 'error' ? 'red' : variant === 'warning' ? 'amber' : 'blue'}-700 hover:bg-${variant === 'error' ? 'red' : variant === 'warning' ? 'amber' : 'blue'}-100 focus:outline-none focus:ring-2 focus:ring-${variant === 'error' ? 'red' : variant === 'warning' ? 'amber' : 'blue'}-500`}
                  onClick={onRetry}
                >
                  Retry
                </button>
              )}
              {onClear && (
                <button
                  type="button"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={onClear}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 