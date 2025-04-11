import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, buildQueryParams } from '../../../lib/api';
import { SECURITY } from '../../../lib/api-endpoints';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('time_range') || '7d';
    
    // Build query parameters
    const params: Record<string, any> = {
      time_range: timeRange
    };
    
    // Call the real backend API
    const endpoint = `${SECURITY.ALERTS_OVERVIEW}${buildQueryParams(params)}`;
    const response = await fetchAPI(endpoint);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching alerts overview from backend API:', error);
    return NextResponse.json(
      { 
        metrics: {
          total_count: 0,
          by_severity: {},
          by_category: {},
          by_alert_level: {},
          by_llm_vendor: {}
        },
        time_series: [],
        recent_alerts: [],
        error: `Failed to fetch alerts overview: ${error.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 