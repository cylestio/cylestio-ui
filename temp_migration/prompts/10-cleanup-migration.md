# Task: Database Cleanup and Final Migration Tasks

## Context
We've migrated most of the Cylestio UI dashboard from direct database connections to the new REST API. Now we need to finalize the migration by removing all database-related code, updating configuration, and ensuring a clean codebase.

## Requirements

1. Remove all database connection code
2. Update configuration files
3. Clean up unused imports and dependencies
4. Update documentation
5. Add final tests for API integration

## Detailed Steps

1. Remove all database-related code:
   - Database connection code
   - Repository classes
   - Database utilities
   - Database configuration settings

2. Update configuration:
   - Environment variables
   - Default settings
   - Build configuration

3. Clean up package.json

4. Update documentation

5. Add integration tests

## Technical Details

### Files to Remove

- `src/lib/db/` - Full directory with all database-related code
- Database-specific types in `app/types/database.ts`

### Configuration Files to Update

- `.env.example` - Remove database settings, add API URL
- `next.config.js` - Update any relevant settings

### Dependencies to Remove

The following dependencies are no longer needed and should be removed from `package.json`:

- `better-sqlite3`
- Any other database-related packages

### Documentation to Update

- Project README.md
- Any specific database-related documentation

## Implementation Steps

### 1. Remove Database Code

After ensuring all components have been migrated to use the API services, you can safely remove the database code:

```bash
# Commands to execute
rm -rf src/lib/db
rm -rf app/types/database.ts
```

### 2. Update Environment Variables

Update the `.env.example` file:

```
# Before
DB_PATH=/path/to/database.db
DB_VERBOSE=false
DB_USE_WAL=true

# After
API_BASE_URL=http://localhost:8000/api/v1
API_TIMEOUT=30000
```

### 3. Update package.json

Remove unused dependencies:

```json
// Remove these dependencies
"better-sqlite3": "^8.0.0",
"sqlite3": "^5.0.0",
```

Add any new dependencies required for API communication:

```json
"axios": "^1.3.4",
```

### 4. Add API Status Checker

Create a utility to check if the API is available:

```typescript
// app/lib/api/status.ts
import { apiClient } from './client';

export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await apiClient.get('/');
    return response.data.status === 'ok';
  } catch (error) {
    return false;
  }
}
```

Add a status component to show API connection status:

```tsx
// app/components/ui/api-status.tsx
'use client';

import { useState, useEffect } from 'react';
import { checkApiStatus } from '@/app/lib/api/status';

export function ApiStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setChecking(true);
      try {
        const status = await checkApiStatus();
        setIsConnected(status);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  if (checking && isConnected === null) {
    return (
      <div className="text-xs text-gray-500 flex items-center">
        <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
        Checking API Connection...
      </div>
    );
  }

  return (
    <div className={`text-xs flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {isConnected ? 'API Connected' : 'API Disconnected'}
    </div>
  );
}
```

### 5. Add Integration Tests

Create tests to verify API integration:

```typescript
// tests/api-integration.test.ts
import { agentsService, eventsService, alertsService } from '@/app/lib/api/services';

describe('API Integration Tests', () => {
  test('Agents API service returns data', async () => {
    const response = await agentsService.getAll();
    expect(response).toBeDefined();
    expect(Array.isArray(response.items)).toBeTruthy();
  });

  test('Events API service returns data', async () => {
    const response = await eventsService.getAll();
    expect(response).toBeDefined();
    expect(Array.isArray(response.items)).toBeTruthy();
  });

  test('Alerts API service returns data', async () => {
    const response = await alertsService.getAll();
    expect(response).toBeDefined();
    expect(Array.isArray(response.items)).toBeTruthy();
  });
});
```

### 6. Update README.md

Update the project README to reflect the migration:

```markdown
# Cylestio UI Dashboard

## Architecture

The UI dashboard communicates with a Mini Local Server API, which provides standardized access to all monitoring data.

## Setup

1. Start the API server:
   ```
   npm run start-server
   ```

2. Start the UI in development mode:
   ```
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file with the following settings:

```
API_BASE_URL=http://localhost:8000/api/v1
API_TIMEOUT=30000
```
```

## Implementation Notes

1. **Incrementally Remove Code**: Remove database code incrementally as you migrate each component to ensure nothing breaks.

2. **Verify API Integration**: Before removing database code, verify that all API integrations are working correctly.

3. **Running Both Systems**: If needed, you can run both the database and API versions side by side during migration by only updating the components that have been migrated.

4. **Graceful Degradation**: Implement fallbacks in case the API is temporarily unavailable.

## Deliverables

1. Removal of all database-related code
2. Updated configuration files
3. Updated package.json without database dependencies
4. API status checker component
5. Integration tests for API services
6. Updated documentation

## References

- API Services: `app/lib/api/services/`
- UI Components: `app/components/ui/`
- Custom Hooks: `app/hooks/`
- TypeScript Interfaces: `app/types/api.ts`

## Additional Recommendations from OverviewDashboard Implementation

### Direct API Calls to Replace
- Replace the direct `fetch` calls in `OverviewDashboard.tsx` for hourly events and alert types with proper service methods in `EventsService` and `AlertsService`.

### Test Considerations
- Retain the custom test runner at `run-dashboard-tests.js` for running focused tests during and after migration.
- Keep the testing approach that combines mocked API services and mocked hooks for component testing.
- Consider creating a shared test utility for mocking API responses to maintain consistency across test files.

### Component Testing Strategy
- Continue using the `data-testid` pattern for test selection as implemented in the OverviewDashboard component.
- Maintain test coverage for error states and loading states for all API-consuming components.
- Follow the established pattern for testing time range filtering in components that use date filtering.

### Error Handling
- Apply the error handling pattern used in OverviewDashboard, which defaults to mock data when API calls fail.
- Ensure all components properly catch and handle API errors to prevent cascade failures.

### UI State Management
- Continue using the pattern of defaulting to empty arrays rather than null values to prevent runtime errors in components that map over API response data.

---

# Database Cleanup and Migration: Accomplished

## Summary
Successfully completed the migration from direct database connections to the new REST API architecture. All database-related code has been removed, configuration files updated, and API integration tests added.

## Completed Tasks

1. **Database Code Removal**
   - ✅ Removed entire `src/lib/db` directory with all database connection code
   - ✅ Removed database types file (`src/types/database.ts`)
   - ✅ Removed database-related scripts (`scripts/test-db-connection.js`, `scripts/create-indexes.js`)

2. **Configuration Updates**
   - ✅ Updated `.env.example` to replace database settings with API configuration
   - ✅ Removed sqlite3 configuration from `next.config.js`
   - ✅ Cleaned up `package.json`:
     - Removed database dependencies (`better-sqlite3`, `sqlite3`, `@types/better-sqlite3`)
     - Removed database test scripts
     - Updated test configuration to use API-focused testing

3. **API Integration**
   - ✅ Added API status checker utility (`app/lib/api/status.ts`)
   - ✅ Created API status component (`app/components/ui/api-status.tsx`)
   - ✅ Implemented API integration tests

4. **Documentation**
   - ✅ Updated README.md to reflect API-based architecture
   - ✅ Added environment setup documentation for API configuration
   - ✅ Updated testing information

5. **Verification**
   - ✅ Created comprehensive test suite to verify database code removal
   - ✅ Added tests for API status components and utilities
   - ✅ All tests passing

## Testing Results
All created tests are passing, confirming that:
- All database code has been completely removed
- API status components are working correctly
- No references to database connections remain in the codebase

The project is now fully migrated to the API-based architecture, with all documentation and tests updated accordingly.