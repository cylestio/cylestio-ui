import { NextResponse } from 'next/server';
import { 
  getEventsPerMinute, 
  getEventCountsByLevel, 
  getAlertsOverTime 
} from '../../lib/db';

export async function GET() {
  try {
    // Fetch data from the database
    const [callsPerMinuteData, alertDistributionData, alertsOverTimeData] = await Promise.all([
      getEventsPerMinute(),
      getEventCountsByLevel(),
      getAlertsOverTime(7) // Last 7 days
    ]);

    // Transform the data for the charts
    const callsPerMinute = callsPerMinuteData.map(item => ({
      minute: item.minute.split(' ')[1], // Extract just the time part
      calls: item.count
    }));

    const alertDistribution = alertDistributionData.map(item => ({
      name: item.level.charAt(0).toUpperCase() + item.level.slice(1), // Capitalize first letter
      value: item.count
    }));

    const alertsOverTime = alertsOverTimeData.map(item => ({
      date: item.date,
      count: item.count
    }));

    // Return the chart data
    return NextResponse.json({
      callsPerMinute,
      alertDistribution,
      alertsOverTime
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
} 