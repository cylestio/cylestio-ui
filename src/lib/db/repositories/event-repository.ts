import { BaseRepository } from '../base-repository';
import { Event, EventType, EventChannel, EventLevel } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for Event entity
 */
export class EventRepository extends BaseRepository<Event> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('events', dbConnection);
  }

  /**
   * Find events by agent ID
   * @param agentId Agent ID
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  public findByAgentId(agentId: number, limit: number = 50, offset: number = 0): Event[] {
    return this.dbUtils.queryMany<Event>(
      `SELECT * FROM ${this.tableName} 
       WHERE agent_id = @agentId 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { agentId, limit, offset }
    );
  }

  /**
   * Find events by session ID
   * @param sessionId Session ID
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  public findBySessionId(sessionId: number, limit: number = 50, offset: number = 0): Event[] {
    return this.dbUtils.queryMany<Event>(
      `SELECT * FROM ${this.tableName} 
       WHERE session_id = @sessionId 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { sessionId, limit, offset }
    );
  }

  /**
   * Find events by conversation ID
   * @param conversationId Conversation ID
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  public findByConversationId(conversationId: number, limit: number = 50, offset: number = 0): Event[] {
    return this.dbUtils.queryMany<Event>(
      `SELECT * FROM ${this.tableName} 
       WHERE conversation_id = @conversationId 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { conversationId, limit, offset }
    );
  }

  /**
   * Find events by type
   * @param eventType Event type
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  public findByEventType(eventType: EventType, limit: number = 50, offset: number = 0): Event[] {
    return this.dbUtils.queryMany<Event>(
      `SELECT * FROM ${this.tableName} 
       WHERE event_type = @eventType 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { eventType, limit, offset }
    );
  }

  /**
   * Find events by channel
   * @param channel Event channel
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  public findByChannel(channel: EventChannel, limit: number = 50, offset: number = 0): Event[] {
    return this.dbUtils.queryMany<Event>(
      `SELECT * FROM ${this.tableName} 
       WHERE channel = @channel 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { channel, limit, offset }
    );
  }

  /**
   * Find events by level
   * @param level Event level
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  public findByLevel(level: EventLevel, limit: number = 50, offset: number = 0): Event[] {
    return this.dbUtils.queryMany<Event>(
      `SELECT * FROM ${this.tableName} 
       WHERE level = @level 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { level, limit, offset }
    );
  }

  /**
   * Find events in a time range
   * @param startTime Start timestamp (ISO string)
   * @param endTime End timestamp (ISO string)
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  public findByTimeRange(
    startTime: string, 
    endTime: string, 
    limit: number = 50, 
    offset: number = 0
  ): Event[] {
    return this.dbUtils.queryMany<Event>(
      `SELECT * FROM ${this.tableName} 
       WHERE timestamp BETWEEN @startTime AND @endTime 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { startTime, endTime, limit, offset }
    );
  }

  /**
   * Get event count by agent ID
   * @param agentId Agent ID
   * @returns Count of events
   */
  public getEventCountByAgent(agentId: number): number {
    const result = this.dbUtils.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE agent_id = @agentId`,
      { agentId }
    );
    
    return result !== null ? result.count : 0;
  }

  /**
   * Get event count by session ID
   * @param sessionId Session ID
   * @returns Count of events
   */
  public getEventCountBySession(sessionId: number): number {
    const result = this.dbUtils.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE session_id = @sessionId`,
      { sessionId }
    );
    
    return result !== null ? result.count : 0;
  }

  /**
   * Get event count by conversation ID
   * @param conversationId Conversation ID
   * @returns Count of events
   */
  public getEventCountByConversation(conversationId: number): number {
    const result = this.dbUtils.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE conversation_id = @conversationId`,
      { conversationId }
    );
    
    return result !== null ? result.count : 0;
  }

  /**
   * Get events with LLM call details
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events with LLM call details
   */
  public getEventsWithLLMCallDetails(
    limit: number = 50, 
    offset: number = 0
  ): Array<Event & { model: string, tokens_in: number | null, tokens_out: number | null, duration_ms: number | null }> {
    return this.dbUtils.queryMany<Event & { model: string, tokens_in: number | null, tokens_out: number | null, duration_ms: number | null }>(
      `SELECT e.*, l.model, l.tokens_in, l.tokens_out, l.duration_ms
       FROM ${this.tableName} e
       JOIN llm_calls l ON e.id = l.event_id
       WHERE e.event_type IN ('${EventType.LLM_REQUEST}', '${EventType.LLM_RESPONSE}')
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get events with tool call details
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of events with tool call details
   */
  public getEventsWithToolCallDetails(
    limit: number = 50, 
    offset: number = 0
  ): Array<Event & { tool_name: string, success: boolean, duration_ms: number | null }> {
    return this.dbUtils.queryMany<Event & { tool_name: string, success: boolean, duration_ms: number | null }>(
      `SELECT e.*, t.tool_name, t.success, t.duration_ms
       FROM ${this.tableName} e
       JOIN tool_calls t ON e.id = t.event_id
       WHERE e.event_type IN ('${EventType.TOOL_CALL}', '${EventType.TOOL_RESPONSE}')
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get event count by type for a specific agent
   * @param agentId Agent ID
   * @returns Map of event types to counts
   */
  public getEventCountByTypeForAgent(agentId: number): Record<EventType, number> {
    const results = this.dbUtils.queryMany<{ event_type: EventType, count: number }>(
      `SELECT event_type, COUNT(*) as count 
       FROM ${this.tableName} 
       WHERE agent_id = @agentId 
       GROUP BY event_type`,
      { agentId }
    );
    
    return results.reduce((acc, { event_type, count }) => {
      acc[event_type] = count;
      return acc;
    }, {} as Record<EventType, number>);
  }
} 