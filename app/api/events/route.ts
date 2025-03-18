import { NextResponse } from 'next/server';
import { DbConnection } from '../../../src/lib/db/connection';
import { DbUtils } from '../../../src/lib/db/utils';

export async function GET() {
  try {
    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    let events = [];
    let total = 0;
    
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
      
      // Check if required columns exist
      const hasTimestamp = columns.includes('timestamp');
      const hasType = columns.includes('type');
      const hasId = columns.includes('id');
      
      if (!hasId) {
        throw new Error('Events table is missing id column');
      }
      
      // Build a safe query based on available columns
      const selectColumns = ['id'];
      if (hasTimestamp) selectColumns.push('timestamp');
      if (hasType) selectColumns.push('type');
      
      // Add other columns if they exist
      if (columns.includes('agent_id')) selectColumns.push('agent_id');
      if (columns.includes('agent_name')) selectColumns.push('agent_name');
      if (columns.includes('description')) selectColumns.push('description');
      if (columns.includes('status')) selectColumns.push('status');
      
      // Try to query the database with available columns
      events = dbUtils.queryMany(`
        SELECT ${selectColumns.join(', ')} FROM events
        ORDER BY id DESC
        LIMIT 100
      `);
      
      // Ensure all expected properties exist with defaults
      events = events.map((event: any) => ({
        id: event.id || 0,
        timestamp: event.timestamp || new Date().toISOString(),
        type: event.type || 'unknown',
        agent_id: event.agent_id || 0,
        agent_name: event.agent_name || 'Unknown Agent',
        description: event.description || 'No description',
        status: event.status || 'unknown'
      }));
      
      // Get total count if possible
      try {
        const countResult = dbUtils.queryOne(`
          SELECT COUNT(*) as total FROM events
        `);
        total = countResult?.total || events.length;
      } catch (countError) {
        console.error('Error counting events:', countError);
        total = events.length;
      }
    } catch (dbError) {
      console.error('Database query failed, using fallback data:', dbError);
      // Use mock data if the table doesn't exist or has schema issues
      events = [];
      total = 0;
    }
    
    return NextResponse.json({
      events,
      total
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', events: [], total: 0 },
      { status: 500 }
    );
  }
} 