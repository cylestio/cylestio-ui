/**
 * Test script to verify the database connection is working correctly
 */

import path from 'path';
import fs from 'fs';
import { getDatabase } from './index';
import { DbUtils } from './utils';

/**
 * Run a basic database connection test
 */
export async function testDatabaseConnection(): Promise<void> {
  try {
    console.log('Testing database connection...');

    // Get the default database path
    const homedir = require('os').homedir();
    const defaultDbPath = path.join(
      homedir,
      'Library/Application Support/cylestio-monitor',
      'cylestio_monitor.db'
    );

    console.log('Default database path:', defaultDbPath);

    // Check if database directory exists, if not create it
    const dbDir = path.dirname(defaultDbPath);
    if (!fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Check if database file exists
    const dbExists = fs.existsSync(defaultDbPath);
    console.log(`Database file exists: ${dbExists}`);
    
    // Connect to the database
    const db = getDatabase();
    console.log('Database connection initialized:', db.isInitialized());
    console.log('Connected to database at:', db.getDbPath());

    // Create DbUtils instance
    const dbUtils = new DbUtils(db);

    // Get a list of all tables in the database
    const tables = dbUtils.queryMany<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    console.log('Tables in database:');
    if (tables.length === 0) {
      console.log('  No tables found');
      
      // If no tables exist, the database might be new
      if (!dbExists) {
        console.log('This appears to be a new database. Running basic structure test...');
        
        // Create a test table
        dbUtils.query(
          `CREATE TABLE IF NOT EXISTS test_connection (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            test_message TEXT
          )`
        );
        
        // Insert a test record
        const id = dbUtils.insert(
          'INSERT INTO test_connection (test_message) VALUES (@message)',
          { message: 'Connection test successful!' }
        );
        
        console.log(`Created test record with ID: ${id}`);
        
        // Read back the test record
        const testRecord = dbUtils.queryOne(
          'SELECT * FROM test_connection WHERE id = @id',
          { id }
        );
        
        console.log('Test record:', testRecord);
      }
    } else {
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
        // Get the schema for each table
        const schema = dbUtils.getTableSchema(table.name);
        console.log(`    Columns: ${schema.map(col => col.name).join(', ')}`);
        
        // Count records in each table
        const count = dbUtils.queryOne<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${table.name}`
        );
        console.log(`    Record count: ${count?.count || 0}`);
      });
    }

    // Close connection
    db.close();
    console.log('Database connection closed');
    console.log('Connection test completed successfully');
  } catch (error) {
    console.error('Error testing database connection:', error);
  }
}

// Uncomment to run the test directly
// testDatabaseConnection().catch(console.error); 