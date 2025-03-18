import { DbConnection } from './connection';
import Database from 'better-sqlite3';

/**
 * Database query options
 */
export interface QueryOptions {
  /**
   * Parameters for prepared statements
   */
  params?: Record<string, any>;
  /**
   * Whether to return the first result only
   * @default false
   */
  first?: boolean;
  /**
   * Whether to execute the query as a transaction
   * @default false
   */
  transaction?: boolean;
}

/**
 * Class with database utility functions
 */
export class DbUtils {
  private db: Database.Database;

  /**
   * Constructor
   * @param dbConnection DbConnection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    this.db = dbConnection.getDb();
  }

  /**
   * Execute a SELECT query
   * @param sql SQL query string
   * @param options Query options
   * @returns Query results
   */
  public query<T = any>(sql: string, options: QueryOptions = {}): T | T[] | null {
    try {
      const stmt = this.db.prepare(sql);
      let result: any[];

      if (options.transaction) {
        result = this.db.transaction(() => {
          return stmt.all(options.params || {});
        })();
      } else {
        result = stmt.all(options.params || {});
      }

      if (options.first) {
        return result.length > 0 ? (result[0] as T) : null;
      }

      return result as T[];
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * Execute a SELECT query and return a single result
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Single result or null if not found
   */
  public queryOne<T = any>(sql: string, params: Record<string, any> = {}): T | null {
    const result = this.query<T>(sql, { params, first: true });
    // This ensures the result is either T or null, not T[]
    return result as (T | null);
  }

  /**
   * Execute a SELECT query and return multiple results
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Array of results
   */
  public queryMany<T = any>(sql: string, params: Record<string, any> = {}): T[] {
    const result = this.query<T>(sql, { params });
    return Array.isArray(result) ? result : [];
  }

  /**
   * Execute an INSERT query
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Last inserted row ID
   */
  public insert(sql: string, params: Record<string, any> = {}): number {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);
      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error executing insert:', error);
      throw error;
    }
  }

  /**
   * Execute an UPDATE query
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Number of rows modified
   */
  public update(sql: string, params: Record<string, any> = {}): number {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);
      return result.changes;
    } catch (error) {
      console.error('Error executing update:', error);
      throw error;
    }
  }

  /**
   * Execute a DELETE query
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Number of rows deleted
   */
  public delete(sql: string, params: Record<string, any> = {}): number {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);
      return result.changes;
    } catch (error) {
      console.error('Error executing delete:', error);
      throw error;
    }
  }

  /**
   * Execute a batch of queries in a transaction
   * @param callback Function that executes queries
   * @returns Result of the callback
   */
  public transaction<T>(callback: () => T): T {
    return this.db.transaction(callback)();
  }

  /**
   * Check if a table exists in the database
   * @param tableName Table name to check
   * @returns boolean indicating if the table exists
   */
  public tableExists(tableName: string): boolean {
    const result = this.queryOne<{ count: number }>(
      'SELECT count(*) as count FROM sqlite_master WHERE type = "table" AND name = @name',
      { name: tableName }
    );
    
    return result !== null && result.count > 0;
  }

  /**
   * Get schema information for a table
   * @param tableName Table name
   * @returns Array of column information
   */
  public getTableSchema(tableName: string): Record<string, any>[] {
    return this.queryMany<Record<string, any>>(
      'PRAGMA table_info(@name)',
      { name: tableName }
    );
  }
} 