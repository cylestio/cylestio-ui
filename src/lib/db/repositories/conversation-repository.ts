import { BaseRepository } from '../base-repository';
import { Conversation } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for Conversation entity
 */
export class ConversationRepository extends BaseRepository<Conversation> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('conversations', dbConnection);
  }

  /**
   * Find all conversations for a session
   * @param sessionId Session ID
   * @returns Array of conversations
   */
  public findBySessionId(sessionId: number): Conversation[] {
    return this.dbUtils.queryMany<Conversation>(
      `SELECT * FROM ${this.tableName} WHERE session_id = @sessionId ORDER BY start_time DESC`,
      { sessionId }
    );
  }

  /**
   * Get active conversations (where end_time is null)
   * @returns Array of active conversations
   */
  public getActiveConversations(): Conversation[] {
    return this.dbUtils.queryMany<Conversation>(
      `SELECT * FROM ${this.tableName} WHERE end_time IS NULL ORDER BY start_time DESC`
    );
  }

  /**
   * Get active conversations for a session
   * @param sessionId Session ID
   * @returns Array of active conversations
   */
  public getActiveConversationsForSession(sessionId: number): Conversation[] {
    return this.dbUtils.queryMany<Conversation>(
      `SELECT * FROM ${this.tableName} WHERE session_id = @sessionId AND end_time IS NULL ORDER BY start_time DESC`,
      { sessionId }
    );
  }

  /**
   * Get conversations with event count
   * @param limit Maximum number of conversations to return
   * @param offset Offset for pagination
   * @returns Array of conversations with event count
   */
  public getConversationsWithEventCount(limit: number = 50, offset: number = 0): Array<Conversation & { event_count: number }> {
    return this.dbUtils.queryMany<Conversation & { event_count: number }>(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM events e WHERE e.conversation_id = c.id) as event_count
      FROM ${this.tableName} c
      ORDER BY c.start_time DESC
      LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * End a conversation (set end_time to current timestamp)
   * @param conversationId Conversation ID
   * @returns Number of rows updated
   */
  public endConversation(conversationId: number): number {
    return this.dbUtils.update(
      `UPDATE ${this.tableName}
       SET end_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = @conversationId AND end_time IS NULL`,
      { conversationId }
    );
  }

  /**
   * Get conversation duration in milliseconds
   * @param conversationId Conversation ID
   * @returns Duration in milliseconds or null if conversation is still active
   */
  public getConversationDuration(conversationId: number): number | null {
    const result = this.dbUtils.queryOne<{ duration_ms: number | null }>(
      `SELECT 
        CASE 
          WHEN end_time IS NULL THEN NULL
          ELSE ROUND((julianday(end_time) - julianday(start_time)) * 86400000)
        END as duration_ms
      FROM ${this.tableName}
      WHERE id = @conversationId`,
      { conversationId }
    );
    
    return result !== null ? result.duration_ms : null;
  }

  /**
   * Get conversations with session and agent information
   * @param limit Maximum number of conversations to return
   * @param offset Offset for pagination
   * @returns Array of conversations with session and agent information
   */
  public getConversationsWithSessionAndAgentInfo(
    limit: number = 50, 
    offset: number = 0
  ): Array<Conversation & { agent_id: number, agent_name: string, agent_id_str: string }> {
    return this.dbUtils.queryMany<Conversation & { agent_id: number, agent_name: string, agent_id_str: string }>(
      `SELECT c.*, s.agent_id, a.name as agent_name, a.agent_id as agent_id_str
      FROM ${this.tableName} c
      JOIN sessions s ON c.session_id = s.id
      JOIN agents a ON s.agent_id = a.id
      ORDER BY c.start_time DESC
      LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get all conversations for an agent
   * @param agentId Agent ID
   * @param limit Maximum number of conversations to return
   * @param offset Offset for pagination
   * @returns Array of conversations
   */
  public getConversationsForAgent(agentId: number, limit: number = 50, offset: number = 0): Conversation[] {
    return this.dbUtils.queryMany<Conversation>(
      `SELECT c.* 
      FROM ${this.tableName} c
      JOIN sessions s ON c.session_id = s.id
      WHERE s.agent_id = @agentId
      ORDER BY c.start_time DESC
      LIMIT @limit OFFSET @offset`,
      { agentId, limit, offset }
    );
  }
} 