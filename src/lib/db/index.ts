/**
 * Database module exports
 */

// Export connection module
export * from './connection';

// Export utils module 
export * from './utils';

// Export base repository
export * from './base-repository';

// Export repositories
export * from './repositories';

// Export data update service
export * from './data-update-service';

// Create a database instance function for convenience
import { DbConnection, DatabaseOptions } from './connection';

/**
 * Get the database connection
 * @param options Database connection options
 * @returns DbConnection instance
 */
export function getDatabase(options: DatabaseOptions = {}): DbConnection {
  return DbConnection.getInstance(options);
} 