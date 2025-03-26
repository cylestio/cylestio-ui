import { NextRequest, NextResponse } from 'next/server';

// Generate mock hourly event data
function generateHourlyEventData() {
  const data = [];
  const now = new Date();
  const hourlyLabels = [];

  // Generate hourly labels for the last 24 hours
  for (let i = 23; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(now.getHours() - i);
    hourlyLabels.push(
      `${date.getHours().toString().padStart(2, '0')}:00`
    );
  }

  // Generate random data for each hour
  hourlyLabels.forEach(hour => {
    data.push({
      hour,
      total: Math.floor(Math.random() * 50) + 30,
      llm_requests: Math.floor(Math.random() * 20) + 10,
      tool_calls: Math.floor(Math.random() * 10) + 5,
      user_messages: Math.floor(Math.random() * 15) + 5,
    });
  });

  return data;
}

export async function GET(request: NextRequest) {
  try {
    // Generate mock hourly event data
    const hourlyData = generateHourlyEventData();

    return NextResponse.json({
      hourly_events: hourlyData,
      total: hourlyData.reduce((sum, item) => sum + item.total, 0)
    });
  } catch (error) {
    console.error('Error generating hourly event data:', error);
    return NextResponse.json(
      { error: 'Failed to generate hourly event data' },
      { status: 500 }
    );
  }
} 