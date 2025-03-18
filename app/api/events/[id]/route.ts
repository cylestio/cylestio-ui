import { NextRequest, NextResponse } from 'next/server';
import { DbConnection } from '../../../../src/lib/db/connection';
import { DbUtils } from '../../../../src/lib/db/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Fetching event details for ID: ${id}`);

    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    // Check if the events table exists first
    const tableCheck = dbUtils.queryOne(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='events'
    `);
    
    if (!tableCheck) {
      console.error('Events table does not exist');
      return NextResponse.json(
        { error: 'Events table does not exist in the database' },
        { status: 404 }
      );
    }
    
    // Query the event by ID
    const event = dbUtils.queryOne(`
      SELECT * FROM events WHERE id = ?
    `, [id]);
    
    if (!event) {
      console.error(`Event with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log(`Successfully retrieved event: ${JSON.stringify(event)}`);
    
    // Process any JSON data that might be stored as strings
    if (event.data && typeof event.data === 'string') {
      try {
        event.data = JSON.parse(event.data);
      } catch (e) {
        // Keep as string if it's not valid JSON
        console.warn(`Failed to parse event data as JSON: ${e}`);
      }
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event details:', error);
    return NextResponse.json(
      { error: `Failed to fetch event details: ${error.message}` },
      { status: 500 }
    );
  }
} 