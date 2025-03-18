/**
 * This file contains example usage of the database layer.
 * It's for demonstration purposes only and can be used as a reference.
 */

import { getDatabase, DbUtils } from './index';
import { BaseRepository } from './base-repository';
import { Agent } from '../../types/database';

/**
 * Example repository for the Agent entity
 */
class AgentRepository extends BaseRepository<Agent> {
  constructor() {
    super('agents');
  }

  /**
   * Find an agent by its agent_id
   * @param agentId The agent identifier
   * @returns Agent or null if not found
   */
  findByAgentId(agentId: string): Agent | null {
    return this.dbUtils.queryOne<Agent>(
      'SELECT * FROM agents WHERE agent_id = @agentId',
      { agentId }
    );
  }

  /**
   * Get recently active agents
   * @param limit Maximum number of agents to return
   * @returns Array of recently active agents
   */
  getRecentlyActive(limit = 10): Agent[] {
    return this.dbUtils.queryMany<Agent>(
      'SELECT * FROM agents ORDER BY last_seen DESC LIMIT @limit',
      { limit }
    );
  }
}

/**
 * Examples of using the database connection
 */
export async function databaseExamples(): Promise<void> {
  try {
    // Get database connection
    const db = getDatabase();
    console.log('Connected to database at:', db.getDbPath());

    // Check if the connection is initialized
    if (!db.isInitialized()) {
      console.error('Database connection failed to initialize');
      return;
    }

    // Create an instance of DbUtils
    const dbUtils = new DbUtils(db);

    // Check if the agents table exists
    const agentsTableExists = dbUtils.tableExists('agents');
    console.log('Agents table exists:', agentsTableExists);

    if (agentsTableExists) {
      // Get the schema of the agents table
      const agentsSchema = dbUtils.getTableSchema('agents');
      console.log('Agents table schema:', agentsSchema);

      // Create an agent repository
      const agentRepo = new AgentRepository();

      // Count the number of agents
      const agentCount = agentRepo.count();
      console.log('Number of agents:', agentCount);

      // Get recently active agents
      const recentAgents = agentRepo.getRecentlyActive(5);
      console.log('Recently active agents:', recentAgents);
    }

    // Close the database connection (not actually needed with singleton)
    db.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error in database examples:', error);
  }
}

// Uncomment to run the examples
// databaseExamples().catch(console.error); 