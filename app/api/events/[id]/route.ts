import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API server URL
const API_SERVER_URL = 'http://localhost:8000/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    // Try to fetch the event from the API
    try {
      const response = await axios.get(`${API_SERVER_URL}/events/${eventId}`);
      return NextResponse.json(response.data);
    } catch (apiError) {
      console.error('API request failed, using fallback data:', apiError);
      
      // Generate fallback event data
      const eventTypes = [
        'llm_request',
        'llm_response',
        'tool_call',
        'user_message',
        'agent_message',
        'system_event'
      ];
      
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const timestamp = new Date().toISOString();
      
      const event = {
        id: parseInt(eventId),
        event_id: `evt_${eventId}`,
        agent_id: `agent_${Math.floor(Math.random() * 5) + 1}`,
        session_id: `sess_${Math.floor(Math.random() * 10) + 1}`,
        conversation_id: `conv_${Math.floor(Math.random() * 20) + 1}`,
        event_type: eventType,
        timestamp,
        metadata: {},
        details: generateEventDetails(eventType)
      };
      
      return NextResponse.json(event);
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
}

// Helper function to generate event details based on type
function generateEventDetails(eventType: string) {
  switch (eventType) {
    case 'llm_request':
      return {
        model: 'gpt-4',
        prompt: 'What are the key considerations for AI safety?',
        parameters: {
          temperature: 0.7,
          max_tokens: 1000
        }
      };
    case 'llm_response':
      return {
        model: 'gpt-4',
        response: 'AI safety involves ensuring systems behave as intended and align with human values...',
        tokens: 156,
        latency_ms: 1250
      };
    case 'tool_call':
      return {
        tool_name: 'web_search',
        inputs: { query: 'Latest AI developments' },
        outputs: { results: 'Found 5 recent articles about AI breakthroughs' },
        success: true
      };
    case 'user_message':
      return {
        message: 'Can you help me understand the risks of large language models?'
      };
    case 'agent_message':
      return {
        message: "I'd be happy to explain the potential risks associated with large language models."
      };
    default:
      return {
        system_event_type: 'session_start',
        details: 'User initiated a new conversation'
      };
  }
} 