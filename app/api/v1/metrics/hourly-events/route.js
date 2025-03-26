import { NextResponse } from 'next/server';

export async function GET() {
  const mockApiUrl = process.env.NEXT_PUBLIC_MOCK_API_URL || 'http://localhost:8080';
  
  try {
    const response = await fetch(`${mockApiUrl}/api/v1/metrics/hourly-events`);
    
    if (!response.ok) {
      console.error('Error fetching hourly events from mock API:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch hourly events data' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying request to mock API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 