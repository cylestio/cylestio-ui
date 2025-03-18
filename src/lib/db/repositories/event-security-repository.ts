import { BaseRepository } from '../base-repository';
import { EventSecurity, AlertLevel } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for EventSecurity entity
 */
export class EventSecurityRepository extends BaseRepository<EventSecurity> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('event_security', dbConnection);
  }

  /**
   * Find event security by event ID
   * @param eventId Event ID
   * @returns Event security or null if not found
   */
  public findByEventId(eventId: number): EventSecurity | null {
    return this.dbUtils.queryOne<EventSecurity>(
      `SELECT * FROM ${this.tableName} WHERE event_id = @eventId`,
      { eventId }
    );
  }

  /**
   * Find event security records by alert level
   * @param alertLevel Alert level
   * @param limit Maximum number of event security records to return
   * @param offset Offset for pagination
   * @returns Array of event security records
   */
  public findByAlertLevel(alertLevel: AlertLevel, limit: number = 50, offset: number = 0): EventSecurity[] {
    return this.dbUtils.queryMany<EventSecurity>(
      `SELECT * FROM ${this.tableName} 
       WHERE alert_level = @alertLevel 
       ORDER BY id DESC
       LIMIT @limit OFFSET @offset`,
      { alertLevel, limit, offset }
    );
  }

  /**
   * Get event security records with event details
   * @param limit Maximum number of event security records to return
   * @param offset Offset for pagination
   * @returns Array of event security records with event details
   */
  public getEventSecurityWithEventDetails(
    limit: number = 50, 
    offset: number = 0
  ): Array<EventSecurity & { 
    agent_id: number, 
    session_id: number | null, 
    conversation_id: number | null, 
    event_type: string,
    timestamp: string
  }> {
    return this.dbUtils.queryMany<EventSecurity & { 
      agent_id: number, 
      session_id: number | null, 
      conversation_id: number | null, 
      event_type: string,
      timestamp: string
    }>(
      `SELECT es.*, e.agent_id, e.session_id, e.conversation_id, e.event_type, e.timestamp
       FROM ${this.tableName} es
       JOIN events e ON es.event_id = e.id
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get event security records for agent
   * @param agentId Agent ID
   * @param limit Maximum number of event security records to return
   * @param offset Offset for pagination
   * @returns Array of event security records
   */
  public getEventSecurityForAgent(agentId: number, limit: number = 50, offset: number = 0): EventSecurity[] {
    return this.dbUtils.queryMany<EventSecurity>(
      `SELECT es.* 
       FROM ${this.tableName} es
       JOIN events e ON es.event_id = e.id
       WHERE e.agent_id = @agentId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { agentId, limit, offset }
    );
  }

  /**
   * Get event security records for session
   * @param sessionId Session ID
   * @param limit Maximum number of event security records to return
   * @param offset Offset for pagination
   * @returns Array of event security records
   */
  public getEventSecurityForSession(sessionId: number, limit: number = 50, offset: number = 0): EventSecurity[] {
    return this.dbUtils.queryMany<EventSecurity>(
      `SELECT es.* 
       FROM ${this.tableName} es
       JOIN events e ON es.event_id = e.id
       WHERE e.session_id = @sessionId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { sessionId, limit, offset }
    );
  }

  /**
   * Get event security records for conversation
   * @param conversationId Conversation ID
   * @param limit Maximum number of event security records to return
   * @param offset Offset for pagination
   * @returns Array of event security records
   */
  public getEventSecurityForConversation(conversationId: number, limit: number = 50, offset: number = 0): EventSecurity[] {
    return this.dbUtils.queryMany<EventSecurity>(
      `SELECT es.* 
       FROM ${this.tableName} es
       JOIN events e ON es.event_id = e.id
       WHERE e.conversation_id = @conversationId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { conversationId, limit, offset }
    );
  }

  /**
   * Get events with security concerns
   * @param minAlertLevel Minimum alert level to consider
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Array of event security records with event details
   */
  public getEventsWithSecurityConcerns(
    minAlertLevel: AlertLevel = AlertLevel.SUSPICIOUS, 
    limit: number = 50, 
    offset: number = 0
  ): Array<EventSecurity & { 
    agent_id: number, 
    agent_name: string,
    event_type: string,
    timestamp: string,
    data: Record<string, any> | null
  }> {
    return this.dbUtils.queryMany<EventSecurity & { 
      agent_id: number, 
      agent_name: string,
      event_type: string,
      timestamp: string,
      data: Record<string, any> | null
    }>(
      `SELECT es.*, e.agent_id, a.name as agent_name, e.event_type, e.timestamp, e.data
       FROM ${this.tableName} es
       JOIN events e ON es.event_id = e.id
       JOIN agents a ON e.agent_id = a.id
       WHERE es.alert_level >= @minAlertLevel
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { minAlertLevel, limit, offset }
    );
  }

  /**
   * Get security statistics by agent
   * @returns Array of agent security statistics
   */
  public getSecurityStatisticsByAgent(): Array<{ 
    agent_id: number, 
    agent_name: string, 
    total: number, 
    suspicious: number, 
    dangerous: number 
  }> {
    return this.dbUtils.queryMany<{ 
      agent_id: number, 
      agent_name: string, 
      total: number, 
      suspicious: number, 
      dangerous: number 
    }>(
      `SELECT 
        e.agent_id,
        a.name as agent_name,
        COUNT(*) as total,
        SUM(CASE WHEN es.alert_level = '${AlertLevel.SUSPICIOUS}' THEN 1 ELSE 0 END) as suspicious,
        SUM(CASE WHEN es.alert_level = '${AlertLevel.DANGEROUS}' THEN 1 ELSE 0 END) as dangerous
       FROM ${this.tableName} es
       JOIN events e ON es.event_id = e.id
       JOIN agents a ON e.agent_id = a.id
       WHERE es.alert_level != '${AlertLevel.NONE}'
       GROUP BY e.agent_id, a.name
       ORDER BY total DESC`
    );
  }
} 