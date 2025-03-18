import { BaseRepository } from '../base-repository';
import { PerformanceMetric } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for PerformanceMetric entity
 */
export class PerformanceMetricRepository extends BaseRepository<PerformanceMetric> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('performance_metrics', dbConnection);
  }

  /**
   * Find performance metric by event ID
   * @param eventId Event ID
   * @returns Performance metric or null if not found
   */
  public findByEventId(eventId: number): PerformanceMetric | null {
    return this.dbUtils.queryOne<PerformanceMetric>(
      `SELECT * FROM ${this.tableName} WHERE event_id = @eventId`,
      { eventId }
    );
  }

  /**
   * Find performance metrics by metric type
   * @param metricType Metric type
   * @param limit Maximum number of performance metrics to return
   * @param offset Offset for pagination
   * @returns Array of performance metrics
   */
  public findByMetricType(metricType: string, limit: number = 50, offset: number = 0): PerformanceMetric[] {
    return this.dbUtils.queryMany<PerformanceMetric>(
      `SELECT * FROM ${this.tableName} 
       WHERE metric_type = @metricType 
       ORDER BY id DESC
       LIMIT @limit OFFSET @offset`,
      { metricType, limit, offset }
    );
  }

  /**
   * Get performance metrics with event details
   * @param limit Maximum number of performance metrics to return
   * @param offset Offset for pagination
   * @returns Array of performance metrics with event details
   */
  public getPerformanceMetricsWithEventDetails(
    limit: number = 50, 
    offset: number = 0
  ): Array<PerformanceMetric & { 
    agent_id: number, 
    session_id: number | null, 
    conversation_id: number | null, 
    timestamp: string
  }> {
    return this.dbUtils.queryMany<PerformanceMetric & { 
      agent_id: number, 
      session_id: number | null, 
      conversation_id: number | null, 
      timestamp: string
    }>(
      `SELECT pm.*, e.agent_id, e.session_id, e.conversation_id, e.timestamp
       FROM ${this.tableName} pm
       JOIN events e ON pm.event_id = e.id
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { limit, offset }
    );
  }

  /**
   * Get performance metrics for agent
   * @param agentId Agent ID
   * @param limit Maximum number of performance metrics to return
   * @param offset Offset for pagination
   * @returns Array of performance metrics
   */
  public getPerformanceMetricsForAgent(agentId: number, limit: number = 50, offset: number = 0): PerformanceMetric[] {
    return this.dbUtils.queryMany<PerformanceMetric>(
      `SELECT pm.* 
       FROM ${this.tableName} pm
       JOIN events e ON pm.event_id = e.id
       WHERE e.agent_id = @agentId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { agentId, limit, offset }
    );
  }

  /**
   * Get performance metrics for session
   * @param sessionId Session ID
   * @param limit Maximum number of performance metrics to return
   * @param offset Offset for pagination
   * @returns Array of performance metrics
   */
  public getPerformanceMetricsForSession(sessionId: number, limit: number = 50, offset: number = 0): PerformanceMetric[] {
    return this.dbUtils.queryMany<PerformanceMetric>(
      `SELECT pm.* 
       FROM ${this.tableName} pm
       JOIN events e ON pm.event_id = e.id
       WHERE e.session_id = @sessionId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { sessionId, limit, offset }
    );
  }

  /**
   * Get performance metrics for conversation
   * @param conversationId Conversation ID
   * @param limit Maximum number of performance metrics to return
   * @param offset Offset for pagination
   * @returns Array of performance metrics
   */
  public getPerformanceMetricsForConversation(conversationId: number, limit: number = 50, offset: number = 0): PerformanceMetric[] {
    return this.dbUtils.queryMany<PerformanceMetric>(
      `SELECT pm.* 
       FROM ${this.tableName} pm
       JOIN events e ON pm.event_id = e.id
       WHERE e.conversation_id = @conversationId
       ORDER BY e.timestamp DESC
       LIMIT @limit OFFSET @offset`,
      { conversationId, limit, offset }
    );
  }

  /**
   * Get average metric value by type
   * @param metricType Metric type
   * @param agentId Optional agent ID to filter by
   * @returns Average metric value
   */
  public getAverageMetricByType(metricType: string, agentId?: number): number {
    const query = agentId
      ? `SELECT AVG(pm.value) as avg_value
         FROM ${this.tableName} pm
         JOIN events e ON pm.event_id = e.id
         WHERE pm.metric_type = @metricType AND e.agent_id = @agentId`
      : `SELECT AVG(value) as avg_value
         FROM ${this.tableName}
         WHERE metric_type = @metricType`;
    
    const params = agentId ? { metricType, agentId } : { metricType };
    
    const result = this.dbUtils.queryOne<{ avg_value: number }>(query, params);
    
    return result !== null ? result.avg_value : 0;
  }

  /**
   * Get metric statistics by type
   * @returns Array of metric statistics by type
   */
  public getMetricStatisticsByType(): Array<{ 
    metric_type: string, 
    count: number, 
    min_value: number, 
    max_value: number, 
    avg_value: number 
  }> {
    return this.dbUtils.queryMany<{ 
      metric_type: string, 
      count: number, 
      min_value: number, 
      max_value: number, 
      avg_value: number 
    }>(
      `SELECT 
        metric_type,
        COUNT(*) as count,
        MIN(value) as min_value,
        MAX(value) as max_value,
        AVG(value) as avg_value
       FROM ${this.tableName}
       GROUP BY metric_type
       ORDER BY count DESC`
    );
  }

  /**
   * Get metric values over time
   * @param metricType Metric type
   * @param timeframe Timeframe in hours (e.g., 24 for last 24 hours)
   * @param agentId Optional agent ID to filter by
   * @returns Array of metric values over time
   */
  public getMetricValuesOverTime(
    metricType: string, 
    timeframe: number = 24, 
    agentId?: number
  ): Array<{ timestamp: string, value: number }> {
    const whereClause = agentId
      ? `pm.metric_type = @metricType AND e.agent_id = @agentId AND e.timestamp > datetime('now', '-' || @timeframe || ' hours')`
      : `pm.metric_type = @metricType AND e.timestamp > datetime('now', '-' || @timeframe || ' hours')`;
    
    const params = agentId 
      ? { metricType, timeframe, agentId } 
      : { metricType, timeframe };
    
    return this.dbUtils.queryMany<{ timestamp: string, value: number }>(
      `SELECT e.timestamp, pm.value
       FROM ${this.tableName} pm
       JOIN events e ON pm.event_id = e.id
       WHERE ${whereClause}
       ORDER BY e.timestamp ASC`,
      params
    );
  }
} 