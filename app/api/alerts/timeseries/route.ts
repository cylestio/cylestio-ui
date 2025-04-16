import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, buildQueryParams } from '../../../lib/api';
import { SECURITY } from '../../../lib/api-endpoints';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('time_range') || '7d';
    const interval = searchParams.get('interval') || 'day';
    
    // Build query parameters
    const params: Record<string, any> = {
      time_range: timeRange,
      interval: interval
    };
    
    // Call the real backend API
    const endpoint = `${SECURITY.ALERTS_TIMESERIES}${buildQueryParams(params)}`;
    const response = await fetchAPI(endpoint);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching alerts timeseries from backend API:', error);
    return NextResponse.json(
      { 
        data: [],
        meta: {
          time_range: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
            description: 'Last 7d'
          },
          interval: 'day'
        },
        error: `Failed to fetch alerts timeseries: ${error.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 