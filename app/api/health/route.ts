import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import os from 'os';

// API server URL
const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:8000';

// Error checking timeout
const CONNECTION_TIMEOUT = 5000; // 5 seconds

// Define types for API status
interface ApiErrorStatus {
  status: string;
  responseTime: number | null;
  error: string | null;
}

interface ApiSuccessStatus extends ApiErrorStatus {
  data?: Record<string, any>;
}

type ApiStatus = ApiSuccessStatus | ApiErrorStatus;

/**
 * GET handler for the /api/health endpoint
 * Returns detailed health information about the system
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get system information
    const systemInfo = {
      os: {
        type: os.type(),
        platform: os.platform(),
        release: os.release(),
        uptime: os.uptime(),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
        },
        cpus: os.cpus().length,
        loadAvg: os.loadavg(),
      },
      process: {
        version: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        env: process.env.NODE_ENV
      },
      ui: {
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'development'
      }
    };
    
    // Check API server status
    let apiStatus: ApiStatus = {
      status: 'unknown',
      responseTime: null,
      error: null
    };
    
    try {
      const apiStartTime = Date.now();
      const response = await axios.get(`${API_SERVER_URL}/`, {
        timeout: CONNECTION_TIMEOUT
      });
      
      apiStatus = {
        status: response.status === 200 ? 'ok' : 'error',
        responseTime: Date.now() - apiStartTime,
        error: null,
        data: response.data
      };
    } catch (error) {
      apiStatus = {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Prepare the complete health data
    const healthData = {
      status: apiStatus.status === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      api: {
        url: API_SERVER_URL,
        ...apiStatus
      },
      system: systemInfo
    };
    
    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Error checking health:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
} 