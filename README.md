# @cylestio/ui-dashboard

[![npm version](https://badge.fury.io/js/%40cylestio%2Fui-dashboard.svg)](https://www.npmjs.com/package/@cylestio/ui-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Minimal dashboard for monitoring AI agent activities and events.

## Installation

```bash
npm install @cylestio/ui-dashboard
```

## Quick Start

```jsx
import { AgentTable, EventTable } from '@cylestio/ui-dashboard';

function Dashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agent Monitoring</h1>
      <AgentTable />
      <EventTable />
    </div>
  );
}
```

## Features

- **Agent Monitoring**: View all registered AI agents and their status
- **Event Logging**: Track events and activities from your AI agents
- **Simplified Design**: Clean, minimal interface focused on essential information
- **SQLite Integration**: Connect to a local SQLite database for data storage

## Database Schema

The dashboard expects a SQLite database with the following tables:

### Agents Table
```sql
CREATE TABLE agents (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_active TEXT NOT NULL,
  type TEXT NOT NULL
);
```

### Events Table
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  agent_id INTEGER,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);
```

## Requirements

- React 17+
- Next.js 13+
- Node.js 16+

## License

[MIT](LICENSE) © Cylestio
