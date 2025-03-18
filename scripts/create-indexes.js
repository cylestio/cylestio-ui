// Script to create basic indexes on the SQLite database

const path = require('path');
const fs = require('fs');
const os = require('os');
const Database = require('better-sqlite3');

// Get the database path
const dbPath = process.env.DB_PATH || path.join(
  os.homedir(),
  'Library/Application Support/cylestio-monitor',
  'cylestio_monitor.db'
);

// Check if the database exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at path: ${dbPath}`);
  console.error('Use DB_PATH environment variable to specify a different location.');
  process.exit(1);
}

console.log(`Using database at: ${dbPath}`);

// Connect to the database
const db = new Database(dbPath);

// Create basic indexes
try {
  // Check which tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map((t) => t.name);
  console.log(`Found tables: ${tableNames.join(', ')}`);
  
  // Create basic indexes for common tables
  if (tableNames.includes('security_alerts')) {
    console.log('Creating indexes for security_alerts table...');
    db.prepare('CREATE INDEX IF NOT EXISTS idx_security_alerts_timestamp ON security_alerts(timestamp)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_security_alerts_event_id ON security_alerts(event_id)').run();
  }
  
  if (tableNames.includes('events')) {
    console.log('Creating indexes for events table...');
    db.prepare('CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_events_agent_id ON events(agent_id)').run();
  }
  
  console.log('Basic indexes created successfully');
} catch (error) {
  console.error('Error creating indexes:', error);
} finally {
  // Close the database connection
  db.close();
} 