#!/usr/bin/env node

/**
 * Script to test the database connection
 * 
 * Run with: 
 * npm run test:db:connection
 * 
 * or directly:
 * node scripts/test-db-connection.js
 */

require('ts-node').register({
  transpileOnly: true,
  project: 'tsconfig.json',
});

const path = require('path');
const fs = require('fs');
const os = require('os');
const Database = require('better-sqlite3');

/**
 * Test the database connection directly
 */
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');

    // Get the default database path
    const homedir = os.homedir();
    const defaultDbPath = path.join(
      homedir,
      'Library/Application Support/cylestio-monitor',
      'cylestio_monitor.db'
    );

    console.log('Default database path:', defaultDbPath);

    // Ensure directory exists
    const dbDir = path.dirname(defaultDbPath);
    if (!fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Check if database file exists
    const dbExists = fs.existsSync(defaultDbPath);
    console.log(`Database file exists: ${dbExists}`);
    
    // Connect to the database
    const db = new Database(defaultDbPath, {
      verbose: console.log,
    });

    console.log('Database connection established');

    // Set WAL journal mode for better performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');

    // Get list of tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    
    console.log('Tables in database:');
    if (tables.length === 0) {
      console.log('  No tables found');
      
      // Create a test table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS test_connection (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          test_message TEXT
        )
      `).run();
      
      // Insert a test record
      const insertResult = db.prepare('INSERT INTO test_connection (test_message) VALUES (?)').run('Connection test successful!');
      const id = insertResult.lastInsertRowid;
      
      console.log(`Created test record with ID: ${id}`);
      
      // Read back the test record
      const testRecord = db.prepare('SELECT * FROM test_connection WHERE id = ?').get(id);
      console.log('Test record:', testRecord);
    } else {
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
        
        // Get table schema
        const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
        console.log(`    Columns: ${schema.map(col => col.name).join(', ')}`);
        
        // Count records
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        console.log(`    Record count: ${count ? count.count : 0}`);
      });
    }

    // Close connection
    db.close();
    console.log('Database connection closed');
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection(); 