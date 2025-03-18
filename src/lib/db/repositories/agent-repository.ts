import { BaseRepository } from '../base-repository';
import { Agent, EventType } from '../../../types/database';
import { DbConnection } from '../connection';

/**
 * Repository for Agent entity
 */
export class AgentRepository extends BaseRepository<Agent> {
  /**
   * Constructor
   * @param dbConnection Database connection instance
   */
  constructor(dbConnection: DbConnection = DbConnection.getInstance()) {
    super('agents', dbConnection);
  }

  /**
   * Find agent by agent_id
   * @param agentId Unique agent identifier
   * @returns Agent or null if not found
   */
  public findByAgentId(agentId: string): Agent | null {
    return this.dbUtils.queryOne<Agent>(
      `SELECT * FROM ${this.tableName} WHERE agent_id = @agentId`,
      { agentId }
    );
  }

  /**
   * Get all agents with their active status
   * @returns Array of agents with active status
   */
  public getAllWithStatus(): Array<Agent & { active: boolean, last_active: string | null }> {
    return this.dbUtils.queryMany<Agent & { active: boolean, last_active: string | null }>(
      `SELECT a.*, 
        (SELECT COUNT(*) > 0 FROM sessions s WHERE s.agent_id = a.id AND s.end_time IS NULL) as active,
        (SELECT MAX(e.timestamp) FROM events e WHERE e.agent_id = a.id) as last_active
      FROM ${this.tableName} a
      ORDER BY a.last_seen DESC`
    );
  }

  /**
   * Get summary metrics for an agent
   * @param agentId Agent ID
   * @returns Summary metrics
   */
  public getAgentMetrics(agentId: number): {
    total_sessions: number;
    total_conversations: number;
    total_events: number;
    llm_calls: number;
    tool_calls: number;
    security_alerts: number;
  } | null {
    return this.dbUtils.queryOne<{
      total_sessions: number;
      total_conversations: number;
      total_events: number;
      llm_calls: number;
      tool_calls: number;
      security_alerts: number;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM sessions WHERE agent_id = @agentId) as total_sessions,
        (SELECT COUNT(*) FROM conversations c 
          JOIN sessions s ON c.session_id = s.id 
          WHERE s.agent_id = @agentId) as total_conversations,
        (SELECT COUNT(*) FROM events WHERE agent_id = @agentId) as total_events,
        (SELECT COUNT(*) FROM events WHERE agent_id = @agentId 
          AND (event_type = '${EventType.LLM_REQUEST}' OR event_type = '${EventType.LLM_RESPONSE}')) as llm_calls,
        (SELECT COUNT(*) FROM events WHERE agent_id = @agentId 
          AND (event_type = '${EventType.TOOL_CALL}' OR event_type = '${EventType.TOOL_RESPONSE}')) as tool_calls,
        (SELECT COUNT(*) FROM events e 
          JOIN security_alerts sa ON e.id = sa.event_id
          WHERE e.agent_id = @agentId) as security_alerts`,
      { agentId }
    );
  }

  /**
   * Get agents sorted by activity (most recent activity first)
   * @param limit Maximum number of agents to return
   * @returns Array of agents sorted by activity
   */
  public getMostActiveAgents(limit: number = 10): Agent[] {
    return this.dbUtils.queryMany<Agent>(
      `SELECT a.* FROM ${this.tableName} a
       ORDER BY (
         SELECT COUNT(*) FROM events e 
         WHERE e.agent_id = a.id 
         AND e.timestamp > datetime('now', '-24 hours')
       ) DESC
       LIMIT @limit`,
      { limit }
    );
  }

  /**
   * Update agent's last seen timestamp
   * @param agentId Agent ID
   * @returns Number of rows updated
   */
  public updateLastSeen(agentId: number): number {
    return this.dbUtils.update(
      `UPDATE ${this.tableName}
       SET last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = @agentId`,
      { agentId }
    );
  }
} 