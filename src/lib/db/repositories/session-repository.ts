import { BaseRepository } from '../base-repository';
import { Session } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for Session entity
 */
export class SessionRepository extends BaseRepository<Session> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('sessions', dbConnection);
  }

  /**
   * Find all sessions for an agent
   * @param agentId Agent ID
   * @returns Array of sessions
   */
  public findByAgentId(agentId: number): Session[] {
    return this.dbUtils.queryMany<Session>(
      `SELECT * FROM ${this.tableName} WHERE agent_id = @agentId ORDER BY start_time DESC`,
      { agentId }
    );
  }

  /**
   * Get active sessions (where end_time is null)
   * @returns Array of active sessions
   */
  public getActiveSessions(): Session[] {
    return this.dbUtils.queryMany<Session>(
      `SELECT * FROM ${this.tableName} WHERE end_time IS NULL ORDER BY start_time DESC`
    );
  }

  /**
   * Get active sessions for an agent
   * @param agentId Agent ID
   * @returns Array of active sessions
   */
  public getActiveSessionsForAgent(agentId: number): Session[] {
    return this.dbUtils.queryMany<Session>(
      `SELECT * FROM ${this.tableName} WHERE agent_id = @agentId AND end_time IS NULL ORDER BY start_time DESC`,
      { agentId }
    );
  }

  /**
   * Get sessions with conversation count
   * @param limit Maximum number of sessions to return
   * @param offset Offset for pagination
   * @returns Array of sessions with conversation count
   */
  public getSessionsWithConversationCount(limit: number = 50, offset: number = 0): Array<Session & { conversation_count: number }> {
    return this.dbUtils.queryMany<Session & { conversation_count: number }>(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM conversations c WHERE c.session_id = s.id) as conversation_count
      FROM ${this.tableName} s
      ORDER BY s.start_time DESC
      LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get sessions with event count
   * @param limit Maximum number of sessions to return
   * @param offset Offset for pagination
   * @returns Array of sessions with event count
   */
  public getSessionsWithEventCount(limit: number = 50, offset: number = 0): Array<Session & { event_count: number }> {
    return this.dbUtils.queryMany<Session & { event_count: number }>(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.id) as event_count
      FROM ${this.tableName} s
      ORDER BY s.start_time DESC
      LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * End a session (set end_time to current timestamp)
   * @param sessionId Session ID
   * @returns Number of rows updated
   */
  public endSession(sessionId: number): number {
    return this.dbUtils.update(
      `UPDATE ${this.tableName}
       SET end_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = @sessionId AND end_time IS NULL`,
      { sessionId }
    );
  }

  /**
   * Get session duration in milliseconds
   * @param sessionId Session ID
   * @returns Duration in milliseconds or null if session is still active
   */
  public getSessionDuration(sessionId: number): number | null {
    const result = this.dbUtils.queryOne<{ duration_ms: number | null }>(
      `SELECT 
        CASE 
          WHEN end_time IS NULL THEN NULL
          ELSE ROUND((julianday(end_time) - julianday(start_time)) * 86400000)
        END as duration_ms
      FROM ${this.tableName}
      WHERE id = @sessionId`,
      { sessionId }
    );
    
    return result !== null ? result.duration_ms : null;
  }

  /**
   * Get sessions with agent information
   * @param limit Maximum number of sessions to return
   * @param offset Offset for pagination
   * @returns Array of sessions with agent information
   */
  public getSessionsWithAgentInfo(limit: number = 50, offset: number = 0): Array<Session & { agent_name: string, agent_id_str: string }> {
    return this.dbUtils.queryMany<Session & { agent_name: string, agent_id_str: string }>(
      `SELECT s.*, a.name as agent_name, a.agent_id as agent_id_str
      FROM ${this.tableName} s
      JOIN agents a ON s.agent_id = a.id
      ORDER BY s.start_time DESC
      LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }
} 