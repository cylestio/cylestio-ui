import { NextRequest, NextResponse } from 'next/server';
import { DbConnection } from '../../../../src/lib/db/connection';
import { DbUtils } from '../../../../src/lib/db/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    let event = null;
    
    try {
      // Check if the events table exists first
      const tableCheck = dbUtils.queryOne(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='events'
      `);
      
      if (!tableCheck) {
        throw new Error('Events table does not exist');
      }
      
      // Check what columns are available in the events table
      const columnsCheck = dbUtils.queryMany(`
        PRAGMA table_info(events)
      `);
      
      // Get column names
      const columns = columnsCheck.map((col: any) => col.name);
      
      // Determine event type column name
      const typeColumn = columns.includes('type') ? 'type' : 
                        columns.includes('event_type') ? 'event_type' : '';
                        
      // Build a query with all available columns
      const selectColumns = ['id'];
      if (columns.includes('timestamp')) selectColumns.push('timestamp');
      if (typeColumn) selectColumns.push(`${typeColumn} as type`);
      if (columns.includes('agent_id')) selectColumns.push('agent_id');
      if (columns.includes('agent_name')) selectColumns.push('agent_name');
      if (columns.includes('session_id')) selectColumns.push('session_id');
      if (columns.includes('conversation_id')) selectColumns.push('conversation_id');
      if (columns.includes('description')) selectColumns.push('description as details');
      if (columns.includes('details')) selectColumns.push('details');
      if (columns.includes('status')) selectColumns.push('status');
      
      if (columns.includes('duration') || columns.includes('duration_ms')) {
        const durationCol = columns.includes('duration') ? 'duration' : 'duration_ms';
        selectColumns.push(`${durationCol} as duration`);
      }
      
      if (columns.includes('data') || columns.includes('payload') || columns.includes('content')) {
        const dataCol = columns.includes('data') ? 'data' : 
                       columns.includes('payload') ? 'payload' : 'content';
        selectColumns.push(`${dataCol} as data`);
      }
      
      // Try to get detailed event by id
      event = dbUtils.queryOne(`
        SELECT ${selectColumns.join(', ')} FROM events
        WHERE id = @eventId
      `, { eventId });
      
      // If no event found, return 404
      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
      
      // Process JSON data if needed
      if (event.data && typeof event.data === 'string') {
        try {
          event.data = JSON.parse(event.data);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
      
      // Try to fetch related events from same conversation or session
      let relatedEvents = [];
      if (event.conversation_id && columns.includes('conversation_id')) {
        relatedEvents = dbUtils.queryMany(`
          SELECT id, ${typeColumn} as type, timestamp
          FROM events
          WHERE conversation_id = @conversationId AND id != @eventId
          ORDER BY timestamp DESC
          LIMIT 5
        `, { 
          conversationId: event.conversation_id,
          eventId: event.id
        });
      } else if (event.session_id && columns.includes('session_id')) {
        relatedEvents = dbUtils.queryMany(`
          SELECT id, ${typeColumn} as type, timestamp
          FROM events
          WHERE session_id = @sessionId AND id != @eventId
          ORDER BY timestamp DESC
          LIMIT 5
        `, { 
          sessionId: event.session_id,
          eventId: event.id
        });
      }
      
      // Add related events to response
      return NextResponse.json({
        event,
        relatedEvents
      });
      
    } catch (dbError) {
      console.error('Database query failed, using fallback data:', dbError);
      
      // Generate a mock event for demonstration
      const types = ['llm_request', 'llm_response', 'tool_call', 'tool_response', 'user_message', 'agent_message', 'api_call', 'security_alert'];
      const statuses = ['success', 'error', 'warning', 'info'];
      const typeIndex = eventId % types.length;
      const statusIndex = Math.floor(eventId / 2) % statuses.length;
      
      const type = types[typeIndex];
      const status = statuses[statusIndex];
      const agent_id = (eventId % 5) + 1;
      
      let details = '';
      let data = null;
      
      // Generate appropriate details and data based on type
      if (type === 'llm_request') {
        details = 'Request to OpenAI API';
        data = {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1000,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Tell me about AI safety.' }
          ]
        };
      } else if (type === 'llm_response') {
        details = 'Response from OpenAI API';
        data = {
          content: 'AI safety refers to the research field focused on ensuring that artificial intelligence systems remain safe and aligned with human values...',
          model: 'gpt-4',
          usage: { prompt_tokens: 20, completion_tokens: 150, total_tokens: 170 }
        };
      } else if (type === 'tool_call') {
        details = 'Calling external tool';
        data = {
          tool_name: 'web_search',
          input: { query: 'latest AI developments' }
        };
      } else if (type === 'api_call') {
        details = status === 'error' ? 'Failed API call to external service' : 'Successful API call';
        data = {
          method: 'GET',
          url: 'https://api.example.com/data',
          headers: { 'Content-Type': 'application/json' },
          status_code: status === 'error' ? 500 : 200
        };
      }
      
      const now = new Date();
      now.setMinutes(now.getMinutes() - eventId);
      
      event = {
        id: eventId,
        timestamp: now.toISOString(),
        type,
        status,
        agent_id,
        agent_name: `Agent #${agent_id}`,
        session_id: Math.floor(eventId / 10) + 1,
        conversation_id: Math.floor(eventId / 5) + 1,
        duration: Math.floor(Math.random() * 1000) + 50,
        details,
        data
      };
      
      // Mock related events
      const relatedEvents = Array(3).fill(null).map((_, i) => {
        const relId = eventId + i + 1;
        const relType = types[(typeIndex + i + 1) % types.length];
        const relDate = new Date(now);
        relDate.setSeconds(relDate.getSeconds() + (i+1) * 30);
        
        return {
          id: relId,
          type: relType,
          timestamp: relDate.toISOString()
        };
      });
      
      return NextResponse.json({
        event,
        relatedEvents
      });
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
} 