import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI } from '../../../../src/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const searchParams = new URLSearchParams(request.nextUrl.search);
    const queryString = searchParams.toString();
    
    // Forward the request to the real backend API
    const apiUrl = `/agents/${agentId}${queryString ? `?${queryString}` : ''}`;
    const agentData = await fetchAPI(apiUrl);
    
    return NextResponse.json(agentData);
  } catch (error: any) {
    console.error('Error fetching agent details:', error);
    return NextResponse.json(
      { error: error.error || 'Failed to fetch agent details' },
      { status: error.status || 500 }
    );
  }
} 