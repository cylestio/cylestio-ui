# Database Connection Layer

This module provides a database connection layer for the Cylestio Monitor dashboard. It's designed to provide reliable connections to the SQLite database, along with type safety and a repository pattern for data access.

## Features

- Singleton database connection to ensure consistent access
- TypeScript interfaces for all database tables
- Repository pattern for entity-specific data access
- Error handling for database connection issues
- Utility functions for common database operations
- Transaction support

## Usage

### Basic Connection

```typescript
import { getDatabase } from '@cylestio/ui-dashboard/lib/db';

// Get the database connection
const db = getDatabase();

// Check if connected successfully
if (db.isInitialized()) {
  console.log('Connected to database at:', db.getDbPath());
} else {
  console.error('Failed to connect to database');
}
```

### Using the Utils Class

```typescript
import { DbUtils, getDatabase } from '@cylestio/ui-dashboard/lib/db';

// Create utils with the database connection
const dbUtils = new DbUtils(getDatabase());

// Execute a query
const agents = dbUtils.queryMany('SELECT * FROM agents LIMIT 10');

// Execute a query with parameters
const agent = dbUtils.queryOne(
  'SELECT * FROM agents WHERE agent_id = @agentId',
  { agentId: 'agent-123' }
);

// Run operations in a transaction
dbUtils.transaction(() => {
  // Queries run in this callback will be part of the transaction
  dbUtils.insert('INSERT INTO events (agent_id, event_type) VALUES (@id, @type)', 
    { id: 1, type: 'AGENT_START' }
  );
  dbUtils.update('UPDATE agents SET last_seen = CURRENT_TIMESTAMP WHERE id = @id', 
    { id: 1 }
  );
});
```

### Creating a Repository

```typescript
import { BaseRepository } from '@cylestio/ui-dashboard/lib/db';
import { Agent } from '@cylestio/ui-dashboard/types/database';

class AgentRepository extends BaseRepository<Agent> {
  constructor() {
    super('agents');
  }

  // Custom method to find by agent_id
  findByAgentId(agentId: string): Agent | null {
    return this.dbUtils.queryOne<Agent>(
      'SELECT * FROM agents WHERE agent_id = @agentId',
      { agentId }
    );
  }

  // Get recently active agents
  getRecentlyActive(limit = 10): Agent[] {
    return this.dbUtils.queryMany<Agent>(
      'SELECT * FROM agents ORDER BY last_seen DESC LIMIT @limit',
      { limit }
    );
  }
}

// Use the repository
const agentRepo = new AgentRepository();
const recentAgents = agentRepo.getRecentlyActive(5);
```

## Configuration

The database connection can be configured with the following options:

```typescript
import { getDatabase } from '@cylestio/ui-dashboard/lib/db';

const db = getDatabase({
  // Custom path to the database file
  dbPath: '/path/to/custom/database.db',
  
  // Enable verbose logging
  verbose: true,
  
  // Disable WAL journal mode
  useWAL: false,
  
  // Don't throw errors on connection issues
  throwErrors: false
});
```

## Structure

- `connection.ts` - Database connection singleton
- `utils.ts` - Database utility functions
- `base-repository.ts` - Base repository pattern implementation
- `examples.ts` - Example usage (for reference)
- `index.ts` - Module exports

## Next Steps

This database connection layer is the foundation for the repository implementations, which will build specialized methods for accessing the different entities in the Cylestio Monitor system. 