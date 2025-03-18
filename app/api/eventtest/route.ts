import { NextRequest, NextResponse } from 'next/server';
import { DbConnection } from '../../../src/lib/db/connection';
import { DbUtils } from '../../../src/lib/db/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('id');
    
    console.log(`Running event test with ID: ${eventId}`);
    
    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    // First check what tables exist
    const tables = dbUtils.queryMany(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);
    
    console.log("Available tables:", tables.map((t: any) => t.name));
    
    // If events table exists, check its schema
    const eventsTable = tables.find((t: any) => t.name === 'events');
    let eventsColumns: any[] = [];
    
    if (eventsTable) {
      eventsColumns = dbUtils.queryMany(`
        PRAGMA table_info(events)
      `);
      console.log("Events table columns:", eventsColumns.map((c: any) => c.name));
    }
    
    // If security_alerts table exists, check its schema
    const alertsTable = tables.find((t: any) => t.name === 'security_alerts');
    let alertsColumns: any[] = [];
    let relatedEvents: any[] = [];
    
    if (alertsTable) {
      alertsColumns = dbUtils.queryMany(`
        PRAGMA table_info(security_alerts)
      `);
      console.log("Security alerts table columns:", alertsColumns.map((c: any) => c.name));
      
      // Get some sample events that are associated with security alerts
      relatedEvents = dbUtils.queryMany(`
        SELECT event_id FROM security_alerts LIMIT 5
      `);
      
      console.log("Sample security alert event IDs:", relatedEvents.map((r: any) => r.event_id));
      
      // If a specific event ID was provided, look it up
      if (eventId && eventsTable) {
        const event = dbUtils.queryOne(`
          SELECT * FROM events WHERE id = ?
        `, [eventId]);
        
        return NextResponse.json({
          tables: tables.map((t: any) => t.name),
          eventsColumns: eventsColumns.map((c: any) => c.name),
          alertsColumns: alertsColumns.map((c: any) => c.name),
          testEvent: event,
          relatedEvents: relatedEvents.map((r: any) => r.event_id)
        });
      }
    }
    
    return NextResponse.json({
      tables: tables.map((t: any) => t.name),
      eventsColumns: eventsColumns.map((c: any) => c.name),
      alertsColumns: alertsColumns.map((c: any) => c.name),
      relatedEvents: relatedEvents.map((r: any) => r.event_id)
    });
    
  } catch (error) {
    console.error('Error in event test endpoint:', error);
    return NextResponse.json(
      { error: `Test failed: ${error.message}` },
      { status: 500 }
    );
  }
} 