import { NextResponse } from 'next/server';

// Interface for event count by minute
interface EventCount {
  minute: string;
  count: number;
}

// Interface for event level distribution
interface EventLevel {
  name: string;
  value: number;
}

// Interface for alert counts by date
interface AlertCount {
  date: string;
  count: number;
}

// Mock data generator functions
function generateEventsPerMinute(): EventCount[] {
  // Return mock data for the last 15 minutes
  return Array.from({ length: 15 }, (_, i) => ({
    minute: `12:${String(i).padStart(2, '0')}`,
    count: 40 + Math.floor(Math.random() * 30),
  }));
}

function generateEventCountsByLevel(): EventLevel[] {
  // Return mock data
  return [
    { name: 'Info', value: 456 },
    { name: 'Warning', value: 48 },
    { name: 'Error', value: 12 },
  ];
}

function generateAlertsOverTime(days: number = 7): AlertCount[] {
  // Return mock data for the last 7 days
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      count: 2 + Math.floor(Math.random() * 8),
    };
  }).reverse(); // Reverse to get chronological order
}

export async function GET() {
  try {
    // Generate mock data
    const callsPerMinute = generateEventsPerMinute().map(item => ({
      minute: item.minute,
      calls: item.count
    }));

    const alertDistribution = generateEventCountsByLevel();

    const alertsOverTime = generateAlertsOverTime(7);

    // Return the chart data
    return NextResponse.json({
      callsPerMinute,
      alertDistribution,
      alertsOverTime
    });
  } catch (error) {
    console.error('Error generating chart data:', error);
    return NextResponse.json(
      { error: 'Failed to generate chart data' },
      { status: 500 }
    );
  }
} 