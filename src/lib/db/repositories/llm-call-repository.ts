import { BaseRepository } from '../base-repository';
import { LLMCall, EventType } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for LLMCall entity
 */
export class LLMCallRepository extends BaseRepository<LLMCall> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('llm_calls', dbConnection);
  }

  /**
   * Find LLM call by event ID
   * @param eventId Event ID
   * @returns LLM call or null if not found
   */
  public findByEventId(eventId: number): LLMCall | null {
    return this.dbUtils.queryOne<LLMCall>(
      `SELECT * FROM ${this.tableName} WHERE event_id = @eventId`,
      { eventId }
    );
  }

  /**
   * Find LLM calls by model
   * @param model Model name
   * @param limit Maximum number of LLM calls to return
   * @param offset Offset for pagination
   * @returns Array of LLM calls
   */
  public findByModel(model: string, limit: number = 50, offset: number = 0): LLMCall[] {
    return this.dbUtils.queryMany<LLMCall>(
      `SELECT * FROM ${this.tableName} 
       WHERE model = @model 
       ORDER BY id DESC
       LIMIT @limit OFFSET @offset`,
      { model, limit, offset }
    );
  }

  /**
   * Get LLM calls with event details
   * @param limit Maximum number of LLM calls to return
   * @param offset Offset for pagination
   * @returns Array of LLM calls with event details
   */
  public getLLMCallsWithEventDetails(
    limit: number = 50, 
    offset: number = 0
  ): Array<LLMCall & { 
    agent_id: number, 
    session_id: number, 
    conversation_id: number, 
    timestamp: string, 
    event_type: EventType 
  }> {
    return this.dbUtils.queryMany<LLMCall & { 
      agent_id: number, 
      session_id: number, 
      conversation_id: number, 
      timestamp: string, 
      event_type: EventType 
    }>(
      `SELECT l.*, e.agent_id, e.session_id, e.conversation_id, e.timestamp, e.event_type
       FROM ${this.tableName} l
       JOIN events e ON l.event_id = e.id
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get LLM calls for agent
   * @param agentId Agent ID
   * @param limit Maximum number of LLM calls to return
   * @param offset Offset for pagination
   * @returns Array of LLM calls
   */
  public getLLMCallsForAgent(agentId: number, limit: number = 50, offset: number = 0): LLMCall[] {
    return this.dbUtils.queryMany<LLMCall>(
      `SELECT l.* 
       FROM ${this.tableName} l
       JOIN events e ON l.event_id = e.id
       WHERE e.agent_id = @agentId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { agentId, limit, offset }
    );
  }

  /**
   * Get LLM calls for session
   * @param sessionId Session ID
   * @param limit Maximum number of LLM calls to return
   * @param offset Offset for pagination
   * @returns Array of LLM calls
   */
  public getLLMCallsForSession(sessionId: number, limit: number = 50, offset: number = 0): LLMCall[] {
    return this.dbUtils.queryMany<LLMCall>(
      `SELECT l.* 
       FROM ${this.tableName} l
       JOIN events e ON l.event_id = e.id
       WHERE e.session_id = @sessionId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { sessionId, limit, offset }
    );
  }

  /**
   * Get LLM calls for conversation
   * @param conversationId Conversation ID
   * @param limit Maximum number of LLM calls to return
   * @param offset Offset for pagination
   * @returns Array of LLM calls
   */
  public getLLMCallsForConversation(conversationId: number, limit: number = 50, offset: number = 0): LLMCall[] {
    return this.dbUtils.queryMany<LLMCall>(
      `SELECT l.* 
       FROM ${this.tableName} l
       JOIN events e ON l.event_id = e.id
       WHERE e.conversation_id = @conversationId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { conversationId, limit, offset }
    );
  }

  /**
   * Get total tokens used by agent
   * @param agentId Agent ID
   * @returns Object with total tokens in, out, and cost
   */
  public getTotalTokensUsedByAgent(agentId: number): { 
    total_tokens_in: number, 
    total_tokens_out: number, 
    total_cost: number 
  } {
    const result = this.dbUtils.queryOne<{ 
      total_tokens_in: number, 
      total_tokens_out: number, 
      total_cost: number 
    }>(
      `SELECT 
        SUM(IFNULL(l.tokens_in, 0)) as total_tokens_in,
        SUM(IFNULL(l.tokens_out, 0)) as total_tokens_out,
        SUM(IFNULL(l.cost, 0)) as total_cost
       FROM ${this.tableName} l
       JOIN events e ON l.event_id = e.id
       WHERE e.agent_id = @agentId`,
      { agentId }
    );
    
    return result || { total_tokens_in: 0, total_tokens_out: 0, total_cost: 0 };
  }

  /**
   * Get model usage statistics
   * @returns Array of model usage statistics
   */
  public getModelUsageStatistics(): Array<{ 
    model: string, 
    call_count: number, 
    total_tokens_in: number, 
    total_tokens_out: number, 
    total_cost: number,
    avg_tokens_in: number,
    avg_tokens_out: number,
    avg_duration_ms: number
  }> {
    return this.dbUtils.queryMany<{ 
      model: string, 
      call_count: number, 
      total_tokens_in: number, 
      total_tokens_out: number, 
      total_cost: number,
      avg_tokens_in: number,
      avg_tokens_out: number,
      avg_duration_ms: number
    }>(
      `SELECT 
        model,
        COUNT(*) as call_count,
        SUM(IFNULL(tokens_in, 0)) as total_tokens_in,
        SUM(IFNULL(tokens_out, 0)) as total_tokens_out,
        SUM(IFNULL(cost, 0)) as total_cost,
        AVG(IFNULL(tokens_in, 0)) as avg_tokens_in,
        AVG(IFNULL(tokens_out, 0)) as avg_tokens_out,
        AVG(IFNULL(duration_ms, 0)) as avg_duration_ms
       FROM ${this.tableName}
       GROUP BY model
       ORDER BY call_count DESC`
    );
  }
} 