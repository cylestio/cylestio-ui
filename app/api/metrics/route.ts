import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API server URL
const API_SERVER_URL = 'http://localhost:8000/api/v1';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');
    
    // Build query parameters for the API
    const queryParams = new URLSearchParams();
    if (agentId) queryParams.append('agent_id', agentId);
    if (startTime) queryParams.append('start_time', startTime);
    if (endTime) queryParams.append('end_time', endTime);
    
    // Fetch metrics from API
    const response = await axios.get(
      `${API_SERVER_URL}/metrics?${queryParams.toString()}`
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching metrics:', error);

    // Return proper error response
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch metrics from API server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 