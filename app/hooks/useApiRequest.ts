import { useState, useEffect, useCallback, DependencyList } from 'react';
import { ApiError } from '@/types/api';
import { EnhancedApiError } from '@/lib/api/client';

interface UseApiRequestOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: EnhancedApiError) => void;
  dependencies?: DependencyList;
  errorLogLevel?: 'error' | 'warn' | 'info' | 'none';
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseApiRequestReturn<T> {
  data: T | null;
  loading: boolean;
  error: EnhancedApiError | null;
  execute: (force?: boolean) => Promise<T | void>;
  reset: () => void;
  retryCount: number;
  isRetrying: boolean;
}

export function useApiRequest<T>(
  requestFn: () => Promise<T>,
  options: UseApiRequestOptions<T> = {}
): UseApiRequestReturn<T> {
  const { 
    immediate = true, 
    onSuccess, 
    onError, 
    dependencies = [],
    errorLogLevel = 'error',
    autoRetry = true,
    maxRetries = 2,
    retryDelay = 2000
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<EnhancedApiError | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  
  const execute = useCallback(async (force = false) => {
    // Don't execute if already loading and not forced
    if (loading && !force) return;
    
    setLoading(true);
    if (!isRetrying) {
      setError(null);
    }
    
    try {
      const result = await requestFn();
      setData(result);
      setError(null);
      setRetryCount(0);
      setIsRetrying(false);
      onSuccess?.(result);
      return result;
    } catch (err) {
      // Log the error based on the configured level
      if (errorLogLevel !== 'none') {
        const method = errorLogLevel === 'error' 
          ? console.error 
          : errorLogLevel === 'warn' 
            ? console.warn 
            : console.info;
        
        method('API Request Error:', err);
      }
      
      // Convert error to enhanced API error format if it isn't already
      const enhancedError: EnhancedApiError = 
        (err as any).timestamp 
          ? (err as EnhancedApiError) 
          : {
              message: err instanceof Error ? err.message : 'Unknown error',
              originalError: err,
              timestamp: new Date().toISOString(),
              errorCode: 'CLIENT_ERROR'
            };
      
      setError(enhancedError);
      onError?.(enhancedError);
      
      // Implement auto-retry logic for specific errors only if enabled
      const shouldRetry = autoRetry && 
                         retryCount < maxRetries && 
                         (enhancedError.errorCode === 'NETWORK_ERROR' || 
                          enhancedError.errorCode === 'NO_RESPONSE' ||
                          enhancedError.errorCode === 'TIMEOUT' ||
                          (enhancedError.statusCode && enhancedError.statusCode >= 500));
      
      if (shouldRetry) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        // Exponential backoff for retries
        const backoffDelay = retryDelay * Math.pow(2, retryCount);
        console.log(`Auto-retrying API request in ${backoffDelay}ms (${retryCount + 1}/${maxRetries})...`);
        
        setTimeout(() => {
          execute(true);
        }, backoffDelay);
      } else {
        setIsRetrying(false);
      }
      
      throw enhancedError;
    } finally {
      if (!isRetrying) {
        setLoading(false);
      }
    }
  }, [requestFn, onSuccess, onError, errorLogLevel, loading, isRetrying, retryCount, maxRetries, retryDelay, autoRetry]);
  
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);
  
  // Reset state when dependencies change
  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  
  // Execute on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);
  
  return { 
    data, 
    loading, 
    error, 
    execute, 
    reset, 
    retryCount,
    isRetrying
  };
} 