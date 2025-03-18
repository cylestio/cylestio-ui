import { BaseRepository } from '../base-repository';
import { ToolCall, EventType } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for ToolCall entity
 */
export class ToolCallRepository extends BaseRepository<ToolCall> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('tool_calls', dbConnection);
  }

  /**
   * Find tool call by event ID
   * @param eventId Event ID
   * @returns Tool call or null if not found
   */
  public findByEventId(eventId: number): ToolCall | null {
    return this.dbUtils.queryOne<ToolCall>(
      `SELECT * FROM ${this.tableName} WHERE event_id = @eventId`,
      { eventId }
    );
  }

  /**
   * Find tool calls by tool name
   * @param toolName Tool name
   * @param limit Maximum number of tool calls to return
   * @param offset Offset for pagination
   * @returns Array of tool calls
   */
  public findByToolName(toolName: string, limit: number = 50, offset: number = 0): ToolCall[] {
    return this.dbUtils.queryMany<ToolCall>(
      `SELECT * FROM ${this.tableName} 
       WHERE tool_name = @toolName 
       ORDER BY id DESC
       LIMIT @limit OFFSET @offset`,
      { toolName, limit, offset }
    );
  }

  /**
   * Find tool calls by success status
   * @param success Success status
   * @param limit Maximum number of tool calls to return
   * @param offset Offset for pagination
   * @returns Array of tool calls
   */
  public findBySuccess(success: boolean, limit: number = 50, offset: number = 0): ToolCall[] {
    return this.dbUtils.queryMany<ToolCall>(
      `SELECT * FROM ${this.tableName} 
       WHERE success = @success 
       ORDER BY id DESC
       LIMIT @limit OFFSET @offset`,
      { success, limit, offset }
    );
  }

  /**
   * Get tool calls with event details
   * @param limit Maximum number of tool calls to return
   * @param offset Offset for pagination
   * @returns Array of tool calls with event details
   */
  public getToolCallsWithEventDetails(
    limit: number = 50, 
    offset: number = 0
  ): Array<ToolCall & { 
    agent_id: number, 
    session_id: number, 
    conversation_id: number, 
    timestamp: string, 
    event_type: EventType 
  }> {
    return this.dbUtils.queryMany<ToolCall & { 
      agent_id: number, 
      session_id: number, 
      conversation_id: number, 
      timestamp: string, 
      event_type: EventType 
    }>(
      `SELECT t.*, e.agent_id, e.session_id, e.conversation_id, e.timestamp, e.event_type
       FROM ${this.tableName} t
       JOIN events e ON t.event_id = e.id
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get tool calls for agent
   * @param agentId Agent ID
   * @param limit Maximum number of tool calls to return
   * @param offset Offset for pagination
   * @returns Array of tool calls
   */
  public getToolCallsForAgent(agentId: number, limit: number = 50, offset: number = 0): ToolCall[] {
    return this.dbUtils.queryMany<ToolCall>(
      `SELECT t.* 
       FROM ${this.tableName} t
       JOIN events e ON t.event_id = e.id
       WHERE e.agent_id = @agentId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { agentId, limit, offset }
    );
  }

  /**
   * Get tool calls for session
   * @param sessionId Session ID
   * @param limit Maximum number of tool calls to return
   * @param offset Offset for pagination
   * @returns Array of tool calls
   */
  public getToolCallsForSession(sessionId: number, limit: number = 50, offset: number = 0): ToolCall[] {
    return this.dbUtils.queryMany<ToolCall>(
      `SELECT t.* 
       FROM ${this.tableName} t
       JOIN events e ON t.event_id = e.id
       WHERE e.session_id = @sessionId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { sessionId, limit, offset }
    );
  }

  /**
   * Get tool calls for conversation
   * @param conversationId Conversation ID
   * @param limit Maximum number of tool calls to return
   * @param offset Offset for pagination
   * @returns Array of tool calls
   */
  public getToolCallsForConversation(conversationId: number, limit: number = 50, offset: number = 0): ToolCall[] {
    return this.dbUtils.queryMany<ToolCall>(
      `SELECT t.* 
       FROM ${this.tableName} t
       JOIN events e ON t.event_id = e.id
       WHERE e.conversation_id = @conversationId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { conversationId, limit, offset }
    );
  }

  /**
   * Get tool usage statistics
   * @returns Array of tool usage statistics
   */
  public getToolUsageStatistics(): Array<{ 
    tool_name: string, 
    call_count: number, 
    success_count: number, 
    error_count: number,
    success_rate: number,
    avg_duration_ms: number
  }> {
    return this.dbUtils.queryMany<{ 
      tool_name: string, 
      call_count: number, 
      success_count: number, 
      error_count: number,
      success_rate: number,
      avg_duration_ms: number
    }>(
      `SELECT 
        tool_name,
        COUNT(*) as call_count,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count,
        CAST(SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as success_rate,
        AVG(IFNULL(duration_ms, 0)) as avg_duration_ms
       FROM ${this.tableName}
       GROUP BY tool_name
       ORDER BY call_count DESC`
    );
  }

  /**
   * Get tool calls with errors
   * @param limit Maximum number of tool calls to return
   * @param offset Offset for pagination
   * @returns Array of failed tool calls with event details
   */
  public getToolCallsWithErrors(
    limit: number = 50, 
    offset: number = 0
  ): Array<ToolCall & { 
    agent_id: number, 
    session_id: number | null, 
    conversation_id: number | null, 
    timestamp: string
  }> {
    return this.dbUtils.queryMany<ToolCall & { 
      agent_id: number, 
      session_id: number | null, 
      conversation_id: number | null, 
      timestamp: string
    }>(
      `SELECT t.*, e.agent_id, e.session_id, e.conversation_id, e.timestamp
       FROM ${this.tableName} t
       JOIN events e ON t.event_id = e.id
       WHERE t.success = 0
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }
} 