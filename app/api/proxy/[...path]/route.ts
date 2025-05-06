import { NextRequest, NextResponse } from 'next/server';
import config from '../../../../config';

// Use centralized configuration
const API_SERVER_URL = config.api.serverUrl;

// Log that the proxy route is loaded with the configured API URL
console.log(`API proxy initialized with API_SERVER_URL: ${API_SERVER_URL}`);

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'PATCH');
}

/**
 * Helper function to proxy requests to the real API server
 */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Get the search parameters
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    
    // Construct the full path
    const path = `/${pathSegments.join('/')}${queryString}`;
    
    // Construct the URL for the API server
    const url = `${API_SERVER_URL}${path}`;
    
    console.log(`Proxying ${method} request to: ${url}`);
    
    // Get headers from the original request (excluding host)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.append(key, value);
      }
    });
    
    // Get body if it exists
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
    }
    
    // Make the request to the API server
    const response = await fetch(url, {
      method,
      headers,
      body,
    });
    
    console.log(`Received response from API server for ${url}: ${response.status} ${response.statusText}`);
    
    // Get the response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.append(key, value);
    });
    
    // Get the response body
    const responseBody = await response.arrayBuffer();
    
    // Create the response
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Error proxying request to ${pathSegments.join('/')}:`, error);
    return NextResponse.json(
      { error: 'Failed to proxy request to API server' },
      { status: 500 }
    );
  }
} 