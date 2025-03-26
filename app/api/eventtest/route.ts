import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API server URL
const API_SERVER_URL = 'http://localhost:8000/api/v1';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '10');

    // Build query parameters for the API
    const queryParams = new URLSearchParams();
    if (agentId) queryParams.append('agent_id', agentId);
    queryParams.append('page', page.toString());
    queryParams.append('page_size', pageSize.toString());

    // Fetch test events from API
    const response = await axios.get(
      `${API_SERVER_URL}/eventtest?${queryParams.toString()}`
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching test events:', error);

    // Return fallback data
    const fallbackEvents = generateFallbackEvents(10);
    
    return NextResponse.json({
      items: fallbackEvents,
      total: fallbackEvents.length,
      page: 1,
      page_size: fallbackEvents.length
    });
  }
}

// Helper function to generate fallback events
function generateFallbackEvents(count: number) {
  const events = [];
  const eventTypes = [
    'llm_request',
    'llm_response',
    'user_message',
    'agent_message',
    'tool_call'
  ];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - i * 3600000).toISOString();
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    events.push({
      id: i + 1,
      event_id: `evt_${i + 1}`,
      agent_id: `agent_${Math.floor(Math.random() * 5) + 1}`,
      session_id: `session_${Math.floor(Math.random() * 10) + 1}`,
      conversation_id: `conv_${Math.floor(Math.random() * 20) + 1}`,
      timestamp,
      event_type: eventType,
      event_data: generateEventData(eventType)
    });
  }
  
  return events;
}

// Helper function to generate event data
function generateEventData(eventType: string): any {
  switch (eventType) {
    case 'llm_request':
      return {
        model: 'gpt-4',
        prompt: 'What are the potential risks of large language models?',
        temperature: 0.7,
        max_tokens: 1000
      };
    case 'llm_response':
      return {
        model: 'gpt-4',
        response: 'Large language models present several potential risks including bias amplification, misinformation generation, privacy concerns, and security vulnerabilities.',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 25,
          total_tokens: 35
        }
      };
    case 'user_message':
      return {
        message: 'Can you explain the risks of using LLMs?'
      };
    case 'agent_message':
      return {
        message: "I'd be happy to explain the potential risks associated with large language models."
      };
    case 'tool_call':
      return {
        tool_name: 'web_search',
        parameters: {
          query: 'large language model risks'
        },
        result: 'Search results about LLM risks and mitigation strategies'
      };
    default:
      return {
        data: 'Generic event data'
      };
  }
} 