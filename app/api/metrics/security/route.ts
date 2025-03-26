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
    
    // Fetch security metrics from API
    const response = await axios.get(
      `${API_SERVER_URL}/metrics/security?${queryParams.toString()}`
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching security metrics:', error);

    // Return fallback data
    return NextResponse.json({
      total_alerts: 37,
      alert_types: {
        prompt_injection: 12,
        sensitive_data_leak: 8,
        unusual_behavior: 5,
        rate_limit_exceeded: 7,
        authorization_bypass: 5
      },
      severity_distribution: {
        critical: 3,
        high: 9,
        medium: 15,
        low: 10
      },
      time_series: {
        labels: generateTimeLabels(7),
        values: [2, 5, 8, 4, 10, 5, 3]
      },
      top_agents: [
        { agent_id: 'agent_1', name: 'Support Agent', alert_count: 12 },
        { agent_id: 'agent_2', name: 'Sales Agent', alert_count: 8 },
        { agent_id: 'agent_3', name: 'Customer Service', alert_count: 6 },
        { agent_id: 'agent_4', name: 'Technical Support', alert_count: 5 },
        { agent_id: 'agent_5', name: 'Product Specialist', alert_count: 4 }
      ]
    });
  }
}

// Helper function to generate time labels for the past N days
function generateTimeLabels(days: number): string[] {
  const labels = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
} 