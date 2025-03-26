# Cylestio UI: Database to API Migration

This repository contains documentation and prompts to guide the migration from direct database access to the new Mini Local Server API for the Cylestio UI dashboard.

## Migration Overview

We're transitioning from a direct database connection approach to a REST API-based architecture. This change improves:

1. Security: Database access is abstracted behind the API
2. Maintainability: UI only needs to focus on presentation
3. Scalability: API can be scaled independently of the UI
4. Standardization: Consistent data access patterns

## Migration Strategy

The migration is broken down into smaller, manageable tasks that can be worked on incrementally:

1. **Foundation Setup**: API client infrastructure and shared utilities
2. **Data Models**: TypeScript interfaces for API data
3. **UI Components**: Reusable components for API interaction
4. **Service Modules**: Service implementations for each API endpoint
5. **Component Migration**: Migrating UI components one by one
6. **Cleanup**: Removing database code and finalizing the migration

## Development Workflow

For each task:

1. Read the prompt in `prompts/` directory
2. Implement the required changes
3. Test your implementation
4. Move to the next task

## Directory Structure

```
temp_migration/
├── docs/
│   ├── mini-server-api.md         # API documentation
│   └── migration-strategy.md      # Overall migration strategy
├── prompts/
│   ├── 01-api-client-setup.md     # Task 1: API client infrastructure
│   ├── 02-api-interfaces.md       # Task 2: TypeScript interfaces
│   ├── 03-common-components.md    # Task 3: Common UI components
│   ├── 04-agent-service.md        # Task 4: Agents API service
│   ├── 05-agents-page.md          # Task 5: Agents page conversion
│   ├── 06-events-service.md       # Task 6: Events API service
│   ├── 07-metrics-service.md      # Task 7: Metrics API service
│   ├── 08-alerts-service.md       # Task 8: Alerts API service
│   ├── 09-dashboard-update.md     # Task 9: Dashboard page conversion
│   └── 10-cleanup-migration.md    # Task 10: Final cleanup
└── README.md                      # This file
```

## Getting Started

1. Start with the API documentation in `docs/mini-server-api.md` to understand the available endpoints
2. Review the migration strategy in `docs/migration-strategy.md`
3. Begin with Task 1 in `prompts/01-api-client-setup.md` and work through each task sequentially

## Important Notes

- The mini local server should be running at `http://localhost:8000`
- API documentation is available at `http://localhost:8000/docs`
- Some UI features may need adaptation if not directly supported by the API
- Consider using the custom hooks provided for cleaner code

## Completion Criteria

The migration is complete when:

1. All database code has been removed
2. All components are using API services
3. UI includes proper loading states and error handling
4. Integration tests pass
5. Documentation is updated

## Additional Resources

If you need more details on specific aspects of the migration, check the following resources:

- API Documentation: `docs/mini-server-api.md`
- Migration Strategy: `docs/migration-strategy.md`
- Current Database Schema: `db_references/` directory in the main repo 