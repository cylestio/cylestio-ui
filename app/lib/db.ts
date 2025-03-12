import Database from 'better-sqlite3';
import path from 'path';

// Define types for our database results
interface RequestCount {
  count: number;
}

interface ResponseTime {
  avg: number;
}

interface SecurityCounts {
  blocked: number;
  suspicious: number;
}

interface EventCount {
  minute: string;
  count: number;
}

interface EventLevel {
  level: string;
  count: number;
}

interface AlertCount {
  date: string;
  count: number;
}

// Initialize database connection
const dbPath = path.join(process.cwd(), '..', 'cylestio.db');
const db = new Database(dbPath, { readonly: true });

// Prepare statements for better performance
const totalRequestsStmt = db.prepare<EmptyObject, RequestCount>('SELECT COUNT(*) as count FROM requests');
const avgResponseTimeStmt = db.prepare<EmptyObject, ResponseTime>('SELECT AVG(response_time) as avg FROM requests WHERE timestamp > datetime("now", "-1 hour")');
const securityCountsStmt = db.prepare<EmptyObject, SecurityCounts>(`
  SELECT 
    SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
    SUM(CASE WHEN status = 'suspicious' THEN 1 ELSE 0 END) as suspicious
  FROM requests 
  WHERE timestamp > datetime("now", "-24 hours")
`);
const eventsPerMinuteStmt = db.prepare<EmptyObject, EventCount>(`
  SELECT 
    strftime('%H:%M', timestamp) as minute,
    COUNT(*) as count
  FROM requests
  WHERE timestamp > datetime("now", "-15 minutes")
  GROUP BY minute
  ORDER BY minute DESC
  LIMIT 15
`);
const eventCountsByLevelStmt = db.prepare<EmptyObject, EventLevel>(`
  SELECT 
    level,
    COUNT(*) as count
  FROM events
  WHERE timestamp > datetime("now", "-24 hours")
  GROUP BY level
`);
const alertsOverTimeStmt = db.prepare<EmptyObject, AlertCount>(`
  SELECT 
    date(timestamp) as date,
    COUNT(*) as count
  FROM alerts
  WHERE timestamp > datetime("now", "-7 days")
  GROUP BY date
  ORDER BY date DESC
`);

// Type for empty parameters
type EmptyObject = Record<string, never>;

export async function getTotalRequestCount(): Promise<number> {
  try {
    const result = totalRequestsStmt.get({});
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting total request count:', error);
    return 0;
  }
}

export async function getAverageLlmResponseTime(): Promise<number> {
  try {
    const result = avgResponseTimeStmt.get({});
    return Math.round(result?.avg || 0);
  } catch (error) {
    console.error('Error getting average response time:', error);
    return 0;
  }
}

export async function getBlockedAndSuspiciousRequestCounts(): Promise<SecurityCounts> {
  try {
    const result = securityCountsStmt.get({});
    return {
      blocked: result?.blocked || 0,
      suspicious: result?.suspicious || 0
    };
  } catch (error) {
    console.error('Error getting security counts:', error);
    return { blocked: 0, suspicious: 0 };
  }
}

export async function getEventsPerMinute(): Promise<EventCount[]> {
  try {
    return eventsPerMinuteStmt.all({}) as EventCount[];
  } catch (error) {
    console.error('Error getting events per minute:', error);
    return [];
  }
}

export async function getEventCountsByLevel(): Promise<EventLevel[]> {
  try {
    return eventCountsByLevelStmt.all({}) as EventLevel[];
  } catch (error) {
    console.error('Error getting event counts by level:', error);
    return [];
  }
}

export async function getAlertsOverTime(days: number = 7): Promise<AlertCount[]> {
  try {
    const stmt = db.prepare<EmptyObject, AlertCount>(`
      SELECT 
        date(timestamp) as date,
        COUNT(*) as count
      FROM alerts
      WHERE timestamp > datetime("now", "-${days} days")
      GROUP BY date
      ORDER BY date DESC
    `);
    return stmt.all({}) as AlertCount[];
  } catch (error) {
    console.error('Error getting alerts over time:', error);
    return [];
  }
}

// Clean up database connection when the process exits
process.on('exit', () => {
  db.close();
}); 