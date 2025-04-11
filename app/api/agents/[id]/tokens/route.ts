import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI } from '../../../../../src/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const searchParams = new URLSearchParams(request.nextUrl.search);
    const queryString = searchParams.toString();
    
    // Forward the request to the real backend API
    const apiUrl = `/agents/${agentId}/tokens${queryString ? `?${queryString}` : ''}`;
    const tokensData = await fetchAPI(apiUrl);
    
    return NextResponse.json(tokensData);
  } catch (error: any) {
    console.error('Error fetching token usage data:', error);
    return NextResponse.json(
      { error: error.error || 'Failed to fetch token usage data' },
      { status: error.status || 500 }
    );
  }
} 