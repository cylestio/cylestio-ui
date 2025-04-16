import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, buildQueryParams } from '../../../lib/api';
import { SECURITY } from '../../../lib/api-endpoints';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('time_range') || '30d';
    
    // Build query parameters
    const params: Record<string, any> = {
      time_range: timeRange
    };
    
    // Call the real backend API
    const endpoint = `${SECURITY.ALERTS_STATS}${buildQueryParams(params)}`;
    const response = await fetchAPI(endpoint);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching alerts stats from backend API:', error);
    // Get the time range again to ensure it's available in the error handler
    const timeRange = request.nextUrl.searchParams.get('time_range') || '30d';
    
    return NextResponse.json(
      { 
        count: 0,
        by_severity: {},
        by_type: {},
        time_range: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
          description: `Last ${timeRange}`
        },
        error: `Failed to fetch alerts stats: ${error.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 