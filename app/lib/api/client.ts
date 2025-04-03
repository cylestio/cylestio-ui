import axios, { AxiosError, AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig to include retryCount
declare module 'axios' {
  interface AxiosRequestConfig {
    retryCount?: number;
  }
}

// Check if we're using mock API from environment variables
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

// API configuration constants
export const API_BASE_URL = USE_MOCK_API 
  ? process.env.NEXT_PUBLIC_MOCK_API_URL || 'http://localhost:8080'
  : process.env.API_BASE_URL || 'http://localhost:8000';
  
export const API_VERSION = '/api/v1';
export const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '10000', 10);
export const MAX_RETRIES = 2;

// Log API configuration on startup
console.log('API Client Configuration:', {
  useMockApi: USE_MOCK_API,
  baseUrl: API_BASE_URL,
  version: API_VERSION,
  timeout: API_TIMEOUT
});

// Error response interface
export interface ApiErrorResponse {
  status: string;
  message: string;
  detail?: {
    errors?: Array<{
      field: string;
      message: string;
      type: string;
    }>;
  };
}

// Enhanced error response for clients
export interface EnhancedApiError {
  message: string;
  statusCode?: number;
  originalError: any;
  timestamp: string;
  requestUrl?: string;
  requestMethod?: string;
  errorCode?: string;
}

// Helper function to create a properly formatted API error
export function createEnhancedApiError(error: Error | string, statusCode?: number): EnhancedApiError {
  const message = typeof error === 'string' ? error : error.message || 'Unknown error';
  return {
    message: message || 'An unexpected error occurred',
    statusCode: statusCode || 500,
    originalError: error,
    timestamp: new Date().toISOString(),
    errorCode: 'CLIENT_ERROR'
  };
}

// Added for compatibility with older code
export function createApiError(error: Error | string, statusCode?: number): EnhancedApiError {
  console.warn('createApiError is deprecated, use createEnhancedApiError instead');
  return createEnhancedApiError(error, statusCode);
}

// Custom toString method to fix [object Object] in error displays
Object.defineProperty(Error.prototype, 'toJSON', {
  value: function() {
    const alt = {};
    Object.getOwnPropertyNames(this).forEach(function(key) {
      alt[key] = this[key];
    }, this);
    return alt;
  },
  configurable: true,
  writable: true
});

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor with retry logic
apiClient.interceptors.request.use(
  (config) => {
    // Add retry count to config if not present
    if (config.retryCount === undefined) {
      config.retryCount = 0;
    }
    
    // Ensure URL paths have trailing slashes for API endpoints
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?') && !config.url.includes('.')) {
      config.url = `${config.url}/`;
    }
    
    // Fix for double API version prefixing
    if (config.url && (config.url.startsWith('/api/v1/') || config.url.includes('/v1/'))) {
      // Remove any instances of duplicate /v1/ in the URL
      config.url = config.url.replace('/api/v1/v1/', '/api/v1/');
      config.url = config.url.replace('/v1/v1/', '/v1/');
      
      // If the URL already has /api/v1/ and we're adding it from the baseURL, strip one
      if (config.url.startsWith('/api/v1/') && config.baseURL?.includes('/api/v1')) {
        config.url = config.url.replace('/api/v1/', '/');
      }
    }
    
    // Log the request for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, { 
      params: config.params,
      data: config.data 
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(createEnhancedApiError(error));
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log the successful response
    console.log(`API Response (${response.status}): ${response.config.method?.toUpperCase()} ${response.config.url}`, { 
      data: response.data
    });
    
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as any;
    
    // Implement retry logic for network errors or 5xx errors
    if (config && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || 
        (error.response && error.response.status >= 500)) && config.retryCount < MAX_RETRIES) {
      
      // Increment retry count
      config.retryCount = config.retryCount + 1;
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, config.retryCount) * 1000;
      console.log(`Retrying request (${config.retryCount}/${MAX_RETRIES}) after ${delay}ms...`);
      
      return new Promise(resolve => {
        setTimeout(() => resolve(apiClient(config)), delay);
      });
    }
    
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    
    // Enhanced error logging with more details
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: {
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
        headers: error.config?.headers
      },
      data: error.response?.data,
      message: error.message,
      code: error.code,
      stack: error.stack,
      retryCount: config?.retryCount || 0
    });
    
    // Network errors get a user-friendly message
    if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error. Please check your connection to the API server.';
      errorCode = 'NETWORK_ERROR';
    }
    else if (error.response) {
      // The request was made and the server responded with an error
      const errorResponse = error.response.data;
      
      if (errorResponse && typeof errorResponse === 'object' && errorResponse.message) {
        errorMessage = errorResponse.message;
      } else if (error.response.statusText) {
        // Use status text if no error message is provided
        errorMessage = `${error.response.status} ${error.response.statusText}`;
      }
      
      // If we have detailed field errors, we can extract them
      if (errorResponse && typeof errorResponse === 'object' && 
          errorResponse.detail?.errors?.length) {
        const fieldErrors = errorResponse.detail.errors.map(err => 
          `${err.field}: ${err.message}`
        ).join(', ');
        
        errorMessage = `${errorMessage} (${fieldErrors})`;
      }
      
      errorCode = `HTTP_${error.response.status}`;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response received from server. Please check if the API server is running.';
      errorCode = 'NO_RESPONSE';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. API server may be overloaded.';
      errorCode = 'TIMEOUT';
    }
    
    const enhancedError: EnhancedApiError = {
      message: errorMessage,
      statusCode: error.response?.status,
      originalError: error,
      timestamp: new Date().toISOString(),
      requestUrl: error.config?.url,
      requestMethod: error.config?.method?.toUpperCase(),
      errorCode
    };
    
    // Add a toString method to prevent [object Object] in error displays
    Object.defineProperty(enhancedError, 'toString', {
      value: function() {
        return this.message;
      },
      enumerable: false
    });
    
    return Promise.reject(enhancedError);
  }
);

export default apiClient; 