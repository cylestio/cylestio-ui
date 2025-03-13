import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Define types for our database results
export interface Agent {
  id: number
  name: string
  status: string
  last_active: string
  type: string
}

export interface Event {
  id: number
  timestamp: string
  event_type: string
  level: string
  message: string
  agent_id: number
}

// Type for empty parameters
type EmptyObject = Record<string, never>

// Initialize database connection
let db: Database.Database
let getAgentsStmt: Database.Statement<EmptyObject, Agent>
let getEventsStmt: Database.Statement<EmptyObject, Event>

try {
  const dbPath = path.join(process.cwd(), '..', 'cylestio.db')

  // Check if database file exists
  if (fs.existsSync(dbPath)) {
    db = new Database(dbPath, { readonly: true })

    // Prepare statements for better performance
    getAgentsStmt = db.prepare<EmptyObject, Agent>(
      'SELECT id, name, status, last_active, type FROM agents ORDER BY last_active DESC LIMIT 100'
    )
    
    getEventsStmt = db.prepare<EmptyObject, Event>(
      'SELECT id, timestamp, event_type, level, message, agent_id FROM events ORDER BY timestamp DESC LIMIT 100'
    )

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

export async function getAgents(): Promise<Agent[]> {
  try {
    if (!db || !getAgentsStmt) {
      // Return mock data if database is not available
      return [
        { id: 1, name: 'Agent 1', status: 'active', last_active: new Date().toISOString(), type: 'assistant' },
        { id: 2, name: 'Agent 2', status: 'inactive', last_active: new Date().toISOString(), type: 'retrieval' },
        { id: 3, name: 'Agent 3', status: 'active', last_active: new Date().toISOString(), type: 'classifier' }
      ]
    }

    return getAgentsStmt.all({}) as Agent[]
  } catch (error) {
    console.error('Error getting agents:', error)
    return [
      { id: 1, name: 'Agent 1', status: 'active', last_active: new Date().toISOString(), type: 'assistant' },
      { id: 2, name: 'Agent 2', status: 'inactive', last_active: new Date().toISOString(), type: 'retrieval' },
      { id: 3, name: 'Agent 3', status: 'active', last_active: new Date().toISOString(), type: 'classifier' }
    ]
  }
}

export async function getEvents(): Promise<Event[]> {
  try {
    if (!db || !getEventsStmt) {
      // Return mock data if database is not available
      return [
        { id: 1, timestamp: new Date().toISOString(), event_type: 'request', level: 'info', message: 'Request processed successfully', agent_id: 1 },
        { id: 2, timestamp: new Date().toISOString(), event_type: 'response', level: 'warning', message: 'Slow response detected', agent_id: 2 },
        { id: 3, timestamp: new Date().toISOString(), event_type: 'error', level: 'error', message: 'Failed to connect to external API', agent_id: 1 }
      ]
    }

    return getEventsStmt.all({}) as Event[]
  } catch (error) {
    console.error('Error getting events:', error)
    return [
      { id: 1, timestamp: new Date().toISOString(), event_type: 'request', level: 'info', message: 'Request processed successfully', agent_id: 1 },
      { id: 2, timestamp: new Date().toISOString(), event_type: 'response', level: 'warning', message: 'Slow response detected', agent_id: 2 },
      { id: 3, timestamp: new Date().toISOString(), event_type: 'error', level: 'error', message: 'Failed to connect to external API', agent_id: 1 }
    ]
  }
}
