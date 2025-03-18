import { BaseRepository } from '../base-repository';
import { SecurityAlert, AlertSeverity } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for SecurityAlert entity
 */
export class SecurityAlertRepository extends BaseRepository<SecurityAlert> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('security_alerts', dbConnection);
  }

  /**
   * Find security alert by event ID
   * @param eventId Event ID
   * @returns Security alert or null if not found
   */
  public findByEventId(eventId: number): SecurityAlert | null {
    return this.dbUtils.queryOne<SecurityAlert>(
      `SELECT * FROM ${this.tableName} WHERE event_id = @eventId`,
      { eventId }
    );
  }

  /**
   * Find security alerts by alert type
   * @param alertType Alert type
   * @param limit Maximum number of security alerts to return
   * @param offset Offset for pagination
   * @returns Array of security alerts
   */
  public findByAlertType(alertType: string, limit: number = 50, offset: number = 0): SecurityAlert[] {
    return this.dbUtils.queryMany<SecurityAlert>(
      `SELECT * FROM ${this.tableName} 
       WHERE alert_type = @alertType 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { alertType, limit, offset }
    );
  }

  /**
   * Find security alerts by severity
   * @param severity Alert severity
   * @param limit Maximum number of security alerts to return
   * @param offset Offset for pagination
   * @returns Array of security alerts
   */
  public findBySeverity(severity: AlertSeverity, limit: number = 50, offset: number = 0): SecurityAlert[] {
    return this.dbUtils.queryMany<SecurityAlert>(
      `SELECT * FROM ${this.tableName} 
       WHERE severity = @severity 
       ORDER BY timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { severity, limit, offset }
    );
  }

  /**
   * Get security alerts with event details
   * @param limit Maximum number of security alerts to return
   * @param offset Offset for pagination
   * @returns Array of security alerts with event details
   */
  public getSecurityAlertsWithEventDetails(
    limit: number = 50, 
    offset: number = 0
  ): Array<SecurityAlert & { 
    agent_id: number, 
    session_id: number | null, 
    conversation_id: number | null, 
    event_type: string,
    channel: string
  }> {
    return this.dbUtils.queryMany<SecurityAlert & { 
      agent_id: number, 
      session_id: number | null, 
      conversation_id: number | null, 
      event_type: string,
      channel: string
    }>(
      `SELECT sa.*, e.agent_id, e.session_id, e.conversation_id, e.event_type, e.channel
       FROM ${this.tableName} sa
       JOIN events e ON sa.event_id = e.id
       ORDER BY sa.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get security alerts for agent
   * @param agentId Agent ID
   * @param limit Maximum number of security alerts to return
   * @param offset Offset for pagination
   * @returns Array of security alerts
   */
  public getSecurityAlertsForAgent(agentId: number, limit: number = 50, offset: number = 0): SecurityAlert[] {
    return this.dbUtils.queryMany<SecurityAlert>(
      `SELECT sa.* 
       FROM ${this.tableName} sa
       JOIN events e ON sa.event_id = e.id
       WHERE e.agent_id = @agentId
       ORDER BY sa.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { agentId, limit, offset }
    );
  }

  /**
   * Get security alerts for session
   * @param sessionId Session ID
   * @param limit Maximum number of security alerts to return
   * @param offset Offset for pagination
   * @returns Array of security alerts
   */
  public getSecurityAlertsForSession(sessionId: number, limit: number = 50, offset: number = 0): SecurityAlert[] {
    return this.dbUtils.queryMany<SecurityAlert>(
      `SELECT sa.* 
       FROM ${this.tableName} sa
       JOIN events e ON sa.event_id = e.id
       WHERE e.session_id = @sessionId
       ORDER BY sa.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { sessionId, limit, offset }
    );
  }

  /**
   * Get security alerts for conversation
   * @param conversationId Conversation ID
   * @param limit Maximum number of security alerts to return
   * @param offset Offset for pagination
   * @returns Array of security alerts
   */
  public getSecurityAlertsForConversation(conversationId: number, limit: number = 50, offset: number = 0): SecurityAlert[] {
    return this.dbUtils.queryMany<SecurityAlert>(
      `SELECT sa.* 
       FROM ${this.tableName} sa
       JOIN events e ON sa.event_id = e.id
       WHERE e.conversation_id = @conversationId
       ORDER BY sa.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { conversationId, limit, offset }
    );
  }

  /**
   * Get security alert statistics
   * @returns Object with alert statistics
   */
  public getSecurityAlertStatistics(): { 
    total_alerts: number,
    by_severity: Record<AlertSeverity, number>,
    by_type: Record<string, number>,
  } {
    const totalResult = this.dbUtils.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    
    const bySeverityResults = this.dbUtils.queryMany<{ severity: AlertSeverity, count: number }>(
      `SELECT severity, COUNT(*) as count FROM ${this.tableName} GROUP BY severity`
    );
    
    const byTypeResults = this.dbUtils.queryMany<{ alert_type: string, count: number }>(
      `SELECT alert_type, COUNT(*) as count FROM ${this.tableName} GROUP BY alert_type`
    );
    
    const bySeverity = bySeverityResults.reduce((acc, { severity, count }) => {
      acc[severity] = count;
      return acc;
    }, {} as Record<AlertSeverity, number>);
    
    const byType = byTypeResults.reduce((acc, { alert_type, count }) => {
      acc[alert_type] = count;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total_alerts: totalResult?.count || 0,
      by_severity: bySeverity,
      by_type: byType
    };
  }

  /**
   * Get recent security alerts with agent info
   * @param limit Maximum number of security alerts to return
   * @returns Array of security alerts with agent info
   */
  public getRecentSecurityAlertsWithAgentInfo(limit: number = 10): Array<SecurityAlert & { 
    agent_id: number,
    agent_name: string, 
    agent_id_str: string 
  }> {
    return this.dbUtils.queryMany<SecurityAlert & { 
      agent_id: number,
      agent_name: string, 
      agent_id_str: string 
    }>(
      `SELECT sa.*, e.agent_id, a.name as agent_name, a.agent_id as agent_id_str
       FROM ${this.tableName} sa
       JOIN events e ON sa.event_id = e.id
       JOIN agents a ON e.agent_id = a.id
       ORDER BY sa.timestamp DESC
       LIMIT @limit`,
      { limit }
    );
  }
} 