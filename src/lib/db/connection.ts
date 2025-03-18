import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface DatabaseOptions {
  /**
   * Path to the SQLite database file
   * Defaults to "~/Library/Application Support/cylestio-monitor/cylestio_monitor.db"
   */
  dbPath?: string;
  /**
   * Whether to enable verbose logging
   * @default false
   */
  verbose?: boolean;
  /**
   * Whether to set WAL journal mode
   * @default true
   */
  useWAL?: boolean;
  /**
   * Whether to throw errors if database connection fails
   * @default true
   */
  throwErrors?: boolean;
}

/**
 * Database connection singleton
 * @class DbConnection
 */
export class DbConnection {
  private static instance: DbConnection | null = null;
  private db: Database.Database | null = null;
  private readonly options: Required<DatabaseOptions>;
  private readonly defaultDbPath: string;

  /**
   * Private constructor to enforce singleton pattern
   * @param options Database connection options
   */
  private constructor(options: DatabaseOptions = {}) {
    this.defaultDbPath = path.join(
      os.homedir(),
      'Library/Application Support/cylestio-monitor',
      'cylestio_monitor.db'
    );

    this.options = {
      dbPath: options.dbPath ?? this.defaultDbPath,
      verbose: options.verbose ?? false,
      useWAL: options.useWAL ?? true,
      throwErrors: options.throwErrors ?? true,
    };

    this.initializeConnection();
  }

  /**
   * Get singleton instance of DbConnection
   * @param options Database connection options
   * @returns DbConnection instance
   */
  public static getInstance(options: DatabaseOptions = {}): DbConnection {
    if (!DbConnection.instance) {
      DbConnection.instance = new DbConnection(options);
    }
    return DbConnection.instance;
  }

  /**
   * Reset the singleton instance (for testing purposes)
   */
  public static resetInstance(): void {
    if (DbConnection.instance) {
      DbConnection.instance.close();
      DbConnection.instance = null;
    }
  }

  /**
   * Initialize the database connection
   */
  private initializeConnection(): void {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.options.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Open database connection
      this.db = new Database(this.options.dbPath, {
        verbose: this.options.verbose ? console.log : undefined,
      });

      // Set WAL journal mode for better performance
      if (this.options.useWAL) {
        this.db.pragma('journal_mode = WAL');
      }

      // Set synchronous mode for better crash recovery
      this.db.pragma('synchronous = NORMAL');

      // Enable foreign key constraints
      this.db.pragma('foreign_keys = ON');
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      if (this.options.throwErrors) {
        throw error;
      }
    }
  }

  /**
   * Get the database instance
   * @returns Database instance
   */
  public getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database connection not initialized');
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Check if the database connection is initialized
   * @returns boolean indicating if the connection is initialized
   */
  public isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Get the database path
   * @returns string path to the database file
   */
  public getDbPath(): string {
    return this.options.dbPath;
  }
} 