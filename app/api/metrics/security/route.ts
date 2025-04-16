import { NextResponse } from 'next/server';
import { fetchAPI, buildQueryParams } from '../../../lib/api';
import { SECURITY, METRICS } from '../../../lib/api-endpoints';

// Define types to match the API response
type SecurityMetricsResponse = {
  total: number;
  critical: number;
  bySeverity: Array<{name: string; count: number}>;
  trend: Array<{date: string; count: number}>;
  byAlertLevel?: Array<{name: string; count: number}>;
};

export async function GET(request: Request) {
  try {
    // Extract any query parameters that might be needed
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || '7d';
    
    // Build query parameters for the real API call
    const params: Record<string, any> = {
      time_range: timeRange
    };
    
    // Call the real backend API
    const endpoint = `${SECURITY.SEVERITY}${buildQueryParams(params)}`;
    const securityMetrics = await fetchAPI<SecurityMetricsResponse>(endpoint);
    
    // Return the response directly as it should already match the expected format
    return NextResponse.json(securityMetrics);
  } catch (error: any) {
    console.error('Error fetching security metrics from backend API:', error);
    return NextResponse.json(
      { 
        total: 0,
        critical: 0,
        bySeverity: [],
        trend: [],
        error: `Failed to fetch security metrics: ${error.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 