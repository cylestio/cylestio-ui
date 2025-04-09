import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, buildQueryParams } from '../../lib/api';
import { TELEMETRY } from '../../lib/api-endpoints';

// Define types to match the API response
type PaginationData = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

type EventsResponse = {
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
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
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
      status: status !== 'all' ? status : undefined,
      event_type: type !== 'all' ? type : undefined,
      agent_id: agentId !== 'all' ? agentId : undefined,
      from_time: from || undefined,
      to_time: to || undefined,
      sort_by: sort || 'timestamp',
      sort_dir: order || 'desc'
    };
    
    // Call the real backend API
    const endpoint = `${TELEMETRY.EVENTS}${buildQueryParams(params)}`;
    const response = await fetchAPI<EventsResponse>(endpoint);
    
    // Map response to expected format if needed
    const mappedResponse = {
      events: response.items || [],
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
    console.error('Error fetching events from backend API:', error);
    return NextResponse.json(
      { 
        events: [],
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalPages: 0,
          totalItems: 0
        },
        error: `Failed to fetch events: ${error.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 