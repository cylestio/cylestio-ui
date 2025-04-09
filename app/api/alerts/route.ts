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
  items: any[];
  pagination: PaginationData;
  meta: {
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
    const alertType = searchParams.get('type') || '';
    const agentId = searchParams.get('agentId') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const sort = searchParams.get('sort') || 'timestamp';
    const order = searchParams.get('order') || 'desc';
    
    // Build query parameters for the real API call
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
      search,
      severity: severity !== 'all' ? severity : undefined,
      alert_type: alertType !== 'all' ? alertType : undefined,
      agent_id: agentId !== 'all' ? agentId : undefined,
      from_time: from || undefined,
      to_time: to || undefined,
      sort_by: sort || 'timestamp',
      sort_dir: order || 'desc'
    };
    
    // Call the real backend API
    const endpoint = `${SECURITY.ALERTS}${buildQueryParams(params)}`;
    const response = await fetchAPI<AlertsResponse>(endpoint);
    
    // Map response to expected format if needed
    const mappedResponse = {
      alerts: response.items || [],
      pagination: {
        currentPage: response.pagination?.page || 1,
        pageSize: response.pagination?.page_size || Number(pageSize),
        totalPages: response.pagination?.total_pages || 1,
        totalItems: response.pagination?.total || 0
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