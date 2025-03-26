import React from 'react';
import { Card, Text, Button, Flex } from '@tremor/react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: any;
  title?: string;
  onRetry?: () => void;
  onClear?: () => void;
}

export default function ErrorDisplay({ 
  error, 
  title = 'An error occurred', 
  onRetry, 
  onClear 
}: ErrorDisplayProps) {
  // Extract error message from different error formats
  const getErrorMessage = () => {
    if (!error) return 'Unknown error';
    
    if (typeof error === 'string') return error;
    
    if (error.message) return error.message;
    
    if (typeof error === 'object') {
      // Convert object to string if it has a toString method
      if (error.toString && error.toString() !== '[object Object]') {
        return error.toString();
      }
      
      // Otherwise try to stringify it
      try {
        return JSON.stringify(error);
      } catch (e) {
        return 'Could not parse error details';
      }
    }
    
    return 'Unknown error';
  };
  
  const errorMessage = getErrorMessage();
  
  return (
    <Card className="p-4 border-l-4 border-red-500 bg-red-50">
      <Flex>
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <Text className="font-semibold text-red-700">{title}</Text>
            <Text className="text-red-600 mt-1">{errorMessage}</Text>
            
            {error.detail && (
              <details className="mt-2">
                <summary className="text-sm text-red-700 cursor-pointer">Show details</summary>
                <div className="mt-2 p-2 bg-white rounded text-xs font-mono overflow-auto max-h-32">
                  {typeof error.detail === 'string' 
                    ? error.detail 
                    : JSON.stringify(error.detail, null, 2)
                  }
                </div>
              </details>
            )}
          </div>
        </div>
        
        {(onRetry || onClear) && (
          <Flex className="gap-2">
            {onRetry && (
              <Button
                size="xs"
                variant="secondary"
                icon={RefreshCw}
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
            
            {onClear && (
              <Button
                size="xs"
                variant="light"
                icon={X}
                onClick={onClear}
              >
                Dismiss
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
} 