import { NextResponse } from 'next/server';
import axios from 'axios';

// API server URL
const API_SERVER_URL = 'http://localhost:8000/api/v1';

export async function GET() {
  try {
    // Fetch agents from the API server - add trailing slash
    const response = await axios.get(`${API_SERVER_URL}/agents/`);
    
    // Return the original API response data without translation
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching agents:', error);
    
    // Return a proper error response instead of fallback data
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to fetch agents from API server',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 