import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, buildQueryParams } from '../../lib/api';
import { SECURITY } from '../../lib/api-endpoints';

// Define types to match the API response
type PaginationData = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

type AlertsResponse = {
  alerts: any[];
  pagination?: PaginationData;
  meta?: {
    timestamp: string;
  };
};

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '25';
    const search = searchParams.get('search') || '';
    const severity = searchParams.get('severity') || '';
    const category = searchParams.get('category') || '';
    const agentId = searchParams.get('agentId') || '';
    const timeRange = searchParams.get('time_range') || '7d';
    
    // Build query parameters for the real API call
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
      search,
      severity: severity !== 'all' ? severity : undefined,
      category: category !== 'all' ? category : undefined,
      agent_id: agentId !== 'all' ? agentId : undefined,
      time_range: timeRange
    };
    
    // Call the real backend API
    const endpoint = `${SECURITY.ALERTS}${buildQueryParams(params)}`;
    const response = await fetchAPI<AlertsResponse>(endpoint);
    
    // Map response to expected format
    const mappedResponse = {
      alerts: response.alerts || [],
      pagination: response.pagination ? {
        currentPage: response.pagination.page || 1,
        pageSize: response.pagination.page_size || Number(pageSize),
        totalPages: response.pagination.total_pages || 1,
        totalItems: response.pagination.total || 0
      } : {
        currentPage: 1,
        pageSize: Number(pageSize),
        totalPages: 1,
        totalItems: 0
      },
      meta: response.meta || {
        timestamp: new Date().toISOString()
      }
    };
    
    return NextResponse.json(mappedResponse);
  } catch (error: any) {
    console.error('Error fetching alerts from backend API:', error);
    return NextResponse.json(
      { 
        alerts: [],
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalPages: 0,
          totalItems: 0
        },
        error: `Failed to fetch alerts: ${error.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}