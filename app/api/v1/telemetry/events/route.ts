import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI } from '../../../../../src/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URLSearchParams(request.nextUrl.search);
    
    // If event_ids is specified, rename it to ids which is what the backend expects
    const eventIds = searchParams.get('event_ids');
    if (eventIds) {
      // Remove event_ids and add ids parameter
      searchParams.delete('event_ids');
      searchParams.append('ids', eventIds);
    }
    
    const queryString = searchParams.toString();
    
    // Forward the request to the real backend API
    const apiPath = `/v1/telemetry/events${queryString ? `?${queryString}` : ''}`;
    const eventsData = await fetchAPI(apiPath);
    
    return NextResponse.json(eventsData);
  } catch (error: any) {
    console.error('Error fetching events data:', error);
    return NextResponse.json(
      { error: error.error || 'Failed to fetch events data' },
      { status: error.status || 500 }
    );
  }
} 