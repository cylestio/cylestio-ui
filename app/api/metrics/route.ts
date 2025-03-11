import { NextResponse } from 'next/server';
import { 
  getTotalRequestCount, 
  getAverageLlmResponseTime, 
  getBlockedAndSuspiciousRequestCounts 
} from '../../lib/db';

export async function GET() {
  try {
    // Fetch data from the database
    const [totalRequests, avgResponseTime, securityCounts] = await Promise.all([
      getTotalRequestCount(),
      getAverageLlmResponseTime(),
      getBlockedAndSuspiciousRequestCounts()
    ]);

    // Return the metrics
    return NextResponse.json({
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      blockedRequests: securityCounts.blocked,
      suspiciousRequests: securityCounts.suspicious
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 