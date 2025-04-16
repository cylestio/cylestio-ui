import { NextResponse } from 'next/server';
import { fetchAPI } from '../../../lib/api';
import { AGENTS } from '../../../lib/api-endpoints';

// Helper function to determine if an agent is active based on its last activity
const isAgentActive = (agent: any): boolean => {
  try {
    // Use status field first if it's explicitly "active"
    if (agent.status === 'active') return true;
    
    const lastActive = new Date(agent.updated_at);
    const now = new Date();
    const thresholdHours = 24; // Default to 24 hours
    const threshold = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000);
    
    return lastActive >= threshold;
  } catch (err) {
    return false; // Default to inactive if there's an error
  }
};

// Helper to generate relative dates (past)
const getRelativeDate = (daysAgo: number, hoursAgo = 0, minutesAgo = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

// Cache API responses to minimize repeated processing
const responseCache = new Map<string, {response: any, timestamp: number}>();
const CACHE_TTL = 5000; // 5 seconds in milliseconds

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const cacheKey = searchParams.toString();
    
    // Check cache first
    const now = Date.now();
    const cachedResult = responseCache.get(cacheKey);
    if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
      return NextResponse.json(cachedResult.response);
    }
    
    // Extract query parameters for the API call
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('page_size') || '10';
    const status = searchParams.get('status');
    const agentType = searchParams.get('agent_type');
    const searchTerm = searchParams.get('search');
    const sortBy = searchParams.get('sort_by');
    const sortDir = searchParams.get('sort_dir');
    
    // Build query parameters for the real API call
    const apiParams = new URLSearchParams();
    if (page) apiParams.set('page', page);
    if (pageSize) apiParams.set('page_size', pageSize);
    if (status) apiParams.set('status', status);
    if (agentType) apiParams.set('agent_type', agentType);
    if (searchTerm) apiParams.set('search', searchTerm);
    if (sortBy) apiParams.set('sort_by', sortBy);
    if (sortDir) apiParams.set('sort_dir', sortDir);
    
    // Call the real backend API
    const endpoint = `${AGENTS.LIST}?${apiParams.toString()}`;
    const response = await fetchAPI(endpoint);
    
    // Cache the response
    responseCache.set(cacheKey, {
      response,
      timestamp: now
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching agents from backend API:', error);
    return NextResponse.json(
      { 
        items: [],
        pagination: {
          page: 1,
          page_size: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
} 