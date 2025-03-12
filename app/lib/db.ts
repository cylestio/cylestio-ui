import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Define types for our database results
interface RequestCount {
  count: number
}

interface ResponseTime {
  avg: number
}

interface SecurityCounts {
  blocked: number
  suspicious: number
}

interface EventCount {
  minute: string
  count: number
}

interface EventLevel {
  level: string
  count: number
}

interface AlertCount {
  date: string
  count: number
}

// Type for empty parameters
type EmptyObject = Record<string, never>

// Initialize database connection
let db: Database.Database
let totalRequestsStmt: Database.Statement<EmptyObject, RequestCount>
let avgResponseTimeStmt: Database.Statement<EmptyObject, ResponseTime>
let securityCountsStmt: Database.Statement<EmptyObject, SecurityCounts>
let eventsPerMinuteStmt: Database.Statement<EmptyObject, EventCount>
let eventCountsByLevelStmt: Database.Statement<EmptyObject, EventLevel>

try {
  const dbPath = path.join(process.cwd(), '..', 'cylestio.db')

  // Check if database file exists
  if (fs.existsSync(dbPath)) {
    db = new Database(dbPath, { readonly: true })

    // Prepare statements for better performance
    totalRequestsStmt = db.prepare<EmptyObject, RequestCount>(
      'SELECT COUNT(*) as count FROM requests'
    )
    avgResponseTimeStmt = db.prepare<EmptyObject, ResponseTime>(
      'SELECT AVG(response_time) as avg FROM requests WHERE timestamp > datetime("now", "-1 hour")'
    )
    securityCountsStmt = db.prepare<EmptyObject, SecurityCounts>(`
      SELECT 
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN status = 'suspicious' THEN 1 ELSE 0 END) as suspicious
      FROM requests 
      WHERE timestamp > datetime("now", "-24 hours")
    `)
    eventsPerMinuteStmt = db.prepare<EmptyObject, EventCount>(`
      SELECT 
        strftime('%H:%M', timestamp) as minute,
        COUNT(*) as count
      FROM requests
      WHERE timestamp > datetime("now", "-15 minutes")
      GROUP BY minute
      ORDER BY minute DESC
      LIMIT 15
    `)
    eventCountsByLevelStmt = db.prepare<EmptyObject, EventLevel>(`
      SELECT 
        level,
        COUNT(*) as count
      FROM events
      WHERE timestamp > datetime("now", "-24 hours")
      GROUP BY level
    `)

    // Clean up database connection when the process exits
    process.on('exit', () => {
      db.close()
    })
  } else {
    console.warn('Database file not found. Using mock data.')
  }
} catch (error) {
  console.error('Error initializing database:', error)
}

export async function getTotalRequestCount(): Promise<number> {
  try {
    if (!db || !totalRequestsStmt) return 1254 // Mock data

    const result = totalRequestsStmt.get({})
    return result?.count || 0
  } catch (error) {
    console.error('Error getting total request count:', error)
    return 1254 // Mock data
  }
}

export async function getAverageLlmResponseTime(): Promise<number> {
  try {
    if (!db || !avgResponseTimeStmt) return 320 // Mock data

    const result = avgResponseTimeStmt.get({})
    return Math.round(result?.avg || 0)
  } catch (error) {
    console.error('Error getting average response time:', error)
    return 320 // Mock data
  }
}

export async function getBlockedAndSuspiciousRequestCounts(): Promise<SecurityCounts> {
  try {
    if (!db || !securityCountsStmt) {
      return { blocked: 12, suspicious: 48 } // Mock data
    }

    const result = securityCountsStmt.get({})
    return {
      blocked: result?.blocked || 0,
      suspicious: result?.suspicious || 0,
    }
  } catch (error) {
    console.error('Error getting security counts:', error)
    return { blocked: 12, suspicious: 48 } // Mock data
  }
}

export async function getEventsPerMinute(): Promise<EventCount[]> {
  try {
    if (!db || !eventsPerMinuteStmt) {
      // Return mock data
      return Array.from({ length: 15 }, (_, i) => ({
        minute: `12:${String(i).padStart(2, '0')}`,
        count: 40 + Math.floor(Math.random() * 30),
      }))
    }

    return eventsPerMinuteStmt.all({}) as EventCount[]
  } catch (error) {
    console.error('Error getting events per minute:', error)
    // Return mock data
    return Array.from({ length: 15 }, (_, i) => ({
      minute: `12:${String(i).padStart(2, '0')}`,
      count: 40 + Math.floor(Math.random() * 30),
    }))
  }
}

export async function getEventCountsByLevel(): Promise<EventLevel[]> {
  try {
    if (!db || !eventCountsByLevelStmt) {
      // Return mock data
      return [
        { level: 'info', count: 456 },
        { level: 'warning', count: 48 },
        { level: 'error', count: 12 },
      ]
    }

    return eventCountsByLevelStmt.all({}) as EventLevel[]
  } catch (error) {
    console.error('Error getting event counts by level:', error)
    // Return mock data
    return [
      { level: 'info', count: 456 },
      { level: 'warning', count: 48 },
      { level: 'error', count: 12 },
    ]
  }
}

export async function getAlertsOverTime(days: number = 7): Promise<AlertCount[]> {
  try {
    if (!db) {
      // Return mock data
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return {
          date: date.toISOString().split('T')[0],
          count: 2 + Math.floor(Math.random() * 8),
        }
      })
    }

    const query = `
      SELECT 
        date(timestamp) as date,
        COUNT(*) as count
      FROM alerts
      WHERE timestamp > datetime("now", "-${days} days")
      GROUP BY date(timestamp)
      ORDER BY date(timestamp)
    `
    return db.prepare<EmptyObject, AlertCount>(query).all({}) as AlertCount[]
  } catch (error) {
    console.error('Error getting alerts over time:', error)
    // Return mock data
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        count: 2 + Math.floor(Math.random() * 8),
      }
    })
  }
}
