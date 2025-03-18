import { NextRequest, NextResponse } from 'next/server';
import { DbConnection } from '../../../src/lib/db/connection';
import { DbUtils } from '../../../src/lib/db/utils';

let connectionStatus = true;

export async function GET() {
  try {
    // If we've manually set the connection status to disconnected,
    // return disconnected without checking the actual DB
    if (!connectionStatus) {
      return NextResponse.json({ status: 'disconnected' }, { status: 503 });
    }
    
    // Check if DB is connected by running a simple query
    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    try {
      // Run a simple query to check connection
      dbUtils.queryOne('SELECT 1 as connected');
      return NextResponse.json({ status: 'connected' });
    } catch (dbError) {
      console.error('Database connection check failed:', dbError);
      return NextResponse.json({ status: 'disconnected' }, { status: 503 });
    }
  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json(
      { status: 'disconnected', error: 'Failed to check connection' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'connect') {
    connectionStatus = true;
    // In a real app, you would actually reconnect to the DB here
    return NextResponse.json({ status: 'connected' });
  } else if (action === 'disconnect') {
    connectionStatus = false;
    // In a real app, you would actually disconnect from the DB here
    return NextResponse.json({ status: 'disconnected' });
  }
  
  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
} 