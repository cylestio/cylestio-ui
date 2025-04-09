import { NextRequest, NextResponse } from 'next/server';
import { DbConnection } from '../../../../src/lib/db/connection';
import { DbUtils } from '../../../../src/lib/db/utils';
import { AgentRepository } from '../../../../src/lib/db/repositories/agent-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = parseInt(params.id);
    if (isNaN(agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    const dbConnection = DbConnection.getInstance();
    const agentRepository = new AgentRepository(dbConnection);
    const dbUtils = new DbUtils(dbConnection);
    
    let agent = null;
    let metrics = {
      total_sessions: 0,
      total_conversations: 0,
      total_events: 0,
      llm_calls: 0,
      tool_calls: 0,
      security_alerts: 0
    };
    let recentEvents = [];
    let responseTimeData = [];
    let eventTypeDistribution = [];
    
    try {
      // Check if the agents table exists and what columns it has
      const tableInfo = dbUtils.queryMany(`PRAGMA table_info(agents)`);
      const columnNames = tableInfo.map(col => col.name);
      
      // Build a dynamic query based on existing columns
      let query = 'SELECT id';
      
      // Add columns that exist in the schema
      if (columnNames.includes('name')) query += ', name';
      if (columnNames.includes('agent_id')) query += ', agent_id';
      if (columnNames.includes('status')) query += ', status';
      if (columnNames.includes('type')) query += ', type';
      if (columnNames.includes('category')) query += ', category';
      if (columnNames.includes('last_active')) query += ', last_active';
      if (columnNames.includes('created_at')) query += ', created_at';
      if (columnNames.includes('description')) query += ', description';
      if (columnNames.includes('version')) query += ', version';
      if (columnNames.includes('event_count')) query += ', event_count';
      
      query += ' FROM agents WHERE id = @agentId';
      
      // Try to get agent details with columns that exist
      agent = dbUtils.queryOne(query, { agentId });
      
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      
      // Ensure agent has all needed properties
      agent = {
        id: agent.id,
        name: agent.name || 'Unnamed Agent',
        status: agent.status || 'inactive',
        type: agent.type || agent.category || '-',
        last_active: agent.last_active || agent.created_at || new Date().toISOString(),
        event_count: agent.event_count || 0,
        description: agent.description || '',
        version: agent.version || '1.0',
        ...agent // Keep any additional fields
      };
      
      // Check if the events table exists
      const eventsTableInfo = dbUtils.queryMany(`PRAGMA table_info(events)`);
      if (eventsTableInfo.length > 0) {
        // Get agent metrics if events table exists
        try {
          metrics = agentRepository.getAgentMetrics(agentId);
        } catch (err) {
          console.error('Error getting agent metrics:', err);
          // Unable to get metrics, will use empty metrics object defined above
        }
        
        // Get recent events if possible
        try {
          // Build a dynamic query for events
          const eventColumns = eventsTableInfo.map(col => col.name);
          let eventsQuery = 'SELECT id';
          
          if (eventColumns.includes('timestamp')) eventsQuery += ', timestamp';
          if (eventColumns.includes('event_type')) eventsQuery += ', event_type';
          if (eventColumns.includes('agent_id')) eventsQuery += ', agent_id';
          if (eventColumns.includes('session_id')) eventsQuery += ', session_id';
          if (eventColumns.includes('conversation_id')) eventsQuery += ', conversation_id';
          if (eventColumns.includes('status')) eventsQuery += ', status';
          
          eventsQuery += ' FROM events WHERE agent_id = @agentId ORDER BY ';
          eventsQuery += eventColumns.includes('timestamp') ? 'timestamp' : 'id';
          eventsQuery += ' DESC LIMIT 10';
          
          recentEvents = dbUtils.queryMany(eventsQuery, { agentId });
          
          // Get response time data
          if (eventColumns.includes('timestamp') && eventColumns.includes('duration_ms')) {
            responseTimeData = dbUtils.queryMany(`
              SELECT 
                strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                AVG(duration_ms) as avg_response_time
              FROM events
              WHERE agent_id = @agentId AND duration_ms IS NOT NULL
              GROUP BY hour
              ORDER BY hour DESC
              LIMIT 24
            `, { agentId });
          }
          
          // Get event type distribution
          if (eventColumns.includes('event_type')) {
            eventTypeDistribution = dbUtils.queryMany(`
              SELECT 
                event_type as type,
                COUNT(*) as count
              FROM events
              WHERE agent_id = @agentId
              GROUP BY event_type
              ORDER BY count DESC
            `, { agentId });
          }
        } catch (err) {
          console.error('Error getting event data:', err);
          // Will use empty arrays defined above
        }
      }
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      return NextResponse.json(
        { error: 'Agent not found or database error' },
        { status: 404 }
      );
    }
    
    const response = {
      agent,
      metrics,
      recentEvents,
      responseTimeData,
      eventTypeDistribution
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching agent details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent details' },
      { status: 500 }
    );
  }
} 