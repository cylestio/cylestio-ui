import { DbUtils } from './utils';
import { DbConnection } from './connection';
import { BaseRecord } from '../../types/database';

/**
 * Options for repository operations
 */
export interface RepositoryOptions {
  /**
   * Whether to execute the operation in a transaction
   * @default false
   */
  transaction?: boolean;
}

/**
 * Base repository class for database operations
 * To be extended by entity-specific repositories
 */
export abstract class BaseRepository<T extends BaseRecord> {
  protected dbUtils: DbUtils;
  protected tableName: string;

  /**
   * Constructor
   * @param tableName Name of the database table
   * @param dbConnection Database connection instance
   */
  constructor(tableName: string, dbConnection: DbConnection = DbConnection.getInstance()) {
    this.tableName = tableName;
    this.dbUtils = new DbUtils(dbConnection);
  }

  /**
   * Find all records
   * @param options Repository options
   * @returns Array of all records
   */
  public findAll(options: RepositoryOptions = {}): T[] {
    return this.dbUtils.queryMany<T>(
      `SELECT * FROM ${this.tableName}`,
      options.transaction ? { transaction: true } : {}
    );
  }

  /**
   * Find record by ID
   * @param id Record ID
   * @returns Record or null if not found
   */
  public findById(id: number): T | null {
    return this.dbUtils.queryOne<T>(
      `SELECT * FROM ${this.tableName} WHERE id = @id`,
      { id }
    );
  }

  /**
   * Find records by field value
   * @param field Field name
   * @param value Field value
   * @param options Repository options
   * @returns Array of matching records
   */
  public findByField(field: string, value: any, options: RepositoryOptions = {}): T[] {
    return this.dbUtils.queryMany<T>(
      `SELECT * FROM ${this.tableName} WHERE ${field} = @value`,
      { value }
    );
  }

  /**
   * Find records with IDs greater than the specified ID
   * @param id Record ID threshold
   * @param limit Maximum number of records to return
   * @returns Array of records with ID > specified ID
   */
  public findNewerThanId(id: number, limit: number = 100): T[] {
    return this.dbUtils.queryMany<T>(
      `SELECT * FROM ${this.tableName} WHERE id > @id ORDER BY id ASC LIMIT @limit`,
      { id, limit }
    );
  }

  /**
   * Find records based on a custom WHERE clause
   * @param whereClause SQL WHERE clause (without the 'WHERE' keyword)
   * @param params Parameters for the query
   * @param limit Maximum number of records to return
   * @returns Array of matching records
   */
  public findByCustomQuery(whereClause: string, params: Record<string, any> = {}, limit: number = 100): T[] {
    return this.dbUtils.queryMany<T>(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY id DESC LIMIT @limit`,
      { ...params, limit }
    );
  }

  /**
   * Create a new record
   * @param data Record data
   * @returns ID of the newly created record
   */
  public create(data: Partial<T>): number {
    const fields = Object.keys(data);
    const placeholders = fields.map(field => `@${field}`).join(', ');
    
    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;
    
    return this.dbUtils.insert(sql, data as Record<string, any>);
  }

  /**
   * Update a record
   * @param id Record ID
   * @param data Record data to update
   * @returns Number of records updated
   */
  public update(id: number, data: Partial<T>): number {
    const fields = Object.keys(data);
    const setClause = fields.map(field => `${field} = @${field}`).join(', ');
    
    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `;
    
    return this.dbUtils.update(sql, { ...data, id } as Record<string, any>);
  }

  /**
   * Delete a record
   * @param id Record ID
   * @returns Number of records deleted
   */
  public delete(id: number): number {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE id = @id
    `;
    
    return this.dbUtils.delete(sql, { id });
  }

  /**
   * Count records
   * @param whereClause Optional WHERE clause
   * @param params Optional parameters for the WHERE clause
   * @returns Number of records
   */
  public count(whereClause?: string, params?: Record<string, any>): number {
    const whereStatement = whereClause ? `WHERE ${whereClause}` : '';
    
    const result = this.dbUtils.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereStatement}`,
      params || {}
    );
    
    return result !== null ? result.count : 0;
  }

  /**
   * Check if table exists
   * @returns boolean indicating if the table exists
   */
  public tableExists(): boolean {
    return this.dbUtils.tableExists(this.tableName);
  }
} 