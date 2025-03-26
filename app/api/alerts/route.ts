import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API server URL
const API_SERVER_URL = 'http://localhost:8000/api/v1';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const severity = searchParams.get('severity');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '50');

    // Build query parameters for the API
    const queryParams = new URLSearchParams();
    if (agentId) queryParams.append('agent_id', agentId);
    if (severity) queryParams.append('severity', severity);
    if (startTime) queryParams.append('start_time', startTime);
    if (endTime) queryParams.append('end_time', endTime);
    queryParams.append('page', page.toString());
    queryParams.append('page_size', pageSize.toString());

    // Fetch alerts from API
    const response = await axios.get(
      `${API_SERVER_URL}/alerts?${queryParams.toString()}`
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching alerts:', error);

    // Return proper error response
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch alerts from API server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 