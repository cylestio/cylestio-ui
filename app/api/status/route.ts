import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API server URL - use environment variable with fallback
const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:8000';

// Error checking timeout
const CONNECTION_TIMEOUT = 5000; // 5 seconds

export async function GET(request: NextRequest) {
  try {
    // Check if API is connected by making a direct request with axios
    try {
      const response = await axios.get(`${API_SERVER_URL}/`, {
        timeout: CONNECTION_TIMEOUT
      });
      
      if (response.status === 200) {
        return NextResponse.json({ 
          status: 'connected',
          apiServer: API_SERVER_URL,
          apiStatus: response.data.status,
          service: response.data.service || 'Cylestio API',
          version: response.data.version || 'unknown',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (apiError) {
      // Capture detailed error information
      const errorDetails = apiError instanceof Error 
        ? { message: apiError.message, name: apiError.name } 
        : { message: 'Unknown error', name: 'UnknownError' };
      
      // Check if it's a timeout
      const isTimeout = errorDetails.message.includes('timeout') || 
                        errorDetails.name === 'AxiosError' && errorDetails.message.includes('ECONNABORTED');
      
      // Check if it's a connection refused error
      const isConnectionRefused = errorDetails.message.includes('ECONNREFUSED') ||
                                 errorDetails.message.includes('connect failed');
      
      // Format a more user-friendly error message
      let userMessage = errorDetails.message;
      if (isTimeout) {
        userMessage = `API server is not responding (timeout after ${CONNECTION_TIMEOUT/1000}s)`;
      } else if (isConnectionRefused) {
        userMessage = `Cannot connect to API server at ${API_SERVER_URL} - service may be down`;
      }
      
      // Log with useful debug information
      console.error('API connection check failed:', {
        ...errorDetails,
        url: API_SERVER_URL,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        status: 'disconnected', 
        error: userMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        apiServer: API_SERVER_URL
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Error checking API connection status:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to check connection',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'check') {
    // Perform a connection check and return detailed status
    try {
      const healthEndpoint = `${API_SERVER_URL}/health`;
      const rootEndpoint = `${API_SERVER_URL}/`;
      
      // Try to hit the health endpoint first, fall back to root
      try {
        const response = await axios.get(healthEndpoint, {
          timeout: CONNECTION_TIMEOUT
        });
        
        return NextResponse.json({ 
          status: 'connected',
          details: response.data,
          endpoint: 'health',
          timestamp: new Date().toISOString()
        });
      } catch (healthError) {
        // Fall back to root endpoint
        const response = await axios.get(rootEndpoint, {
          timeout: CONNECTION_TIMEOUT
        });
        
        return NextResponse.json({ 
          status: 'connected',
          details: response.data,
          endpoint: 'root',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTimeout = errorMessage.includes('timeout');
      
      return NextResponse.json({ 
        status: 'disconnected', 
        error: isTimeout ? 'API server timed out' : errorMessage,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  }
  
  return NextResponse.json(
    { error: 'Invalid action. Use "check" to test connectivity.' },
    { status: 400 }
  );
} 