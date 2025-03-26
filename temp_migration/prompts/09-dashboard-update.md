# Task: Update Dashboard Page To Use API Services

## Context
The main dashboard page is a central hub that shows summary metrics, recent events, alerts, and agent statuses. As part of our migration from direct database access to the REST API, we need to update this page to fetch data using our new API services instead of database repositories.

## Requirements

1. Replace all database repository calls with API service calls
2. Implement loading states for each dashboard widget
3. Add proper error handling and fallbacks
4. Optimize data fetching for performance
5. Implement appropriate time range filtering

## Detailed Steps

1. Identify all database repository calls in the dashboard page
2. Replace each repository call with the appropriate API service call
3. Add loading states for each dashboard widget
4. Implement error handling for API failures
5. Configure time ranges for metrics and data

## Technical Details

### Files to Update

- `app/page.tsx` - Main dashboard page
- Any dashboard-specific components in `app/components/dashboard/`

### Current Implementation

The current implementation likely uses various repository classes directly:

```typescript
// Example from app/page.tsx
import { 
  AgentRepository, 
  EventRepository, 
  SecurityAlertRepository 
} from '@/src/lib/db/repositories';

export default function DashboardPage() {
  const agentRepo = new AgentRepository();
  const eventRepo = new EventRepository();
  const alertRepo = new SecurityAlertRepository();
  
  const activeAgents = agentRepo.getMostActiveAgents(5);
  const recentEvents = eventRepo.findNewestEvents(10);
  const criticalAlerts = alertRepo.findBySeverity('critical', 5);
  
  // Calculate metrics directly from database results
  const totalAgents = agentRepo.count();
  const todayEvents = eventRepo.countByTimeRange(startOfDay, now);
  
  return (
    <div>
      <h1>Dashboard</h1>
      <MetricsSummary 
        totalAgents={totalAgents}
        todayEvents={todayEvents}
        // other metrics
      />
      <RecentActivity events={recentEvents} />
      <AlertsWidget alerts={criticalAlerts} />
      <ActiveAgentsWidget agents={activeAgents} />
    </div>
  );
}
```

### Target Implementation

The new implementation should use our API services and handle loading/error states:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  agentsService, 
  eventsService, 
  alertsService,
  metricsService 
} from '@/app/lib/api/services';
import { DashboardMetrics } from '@/app/components/dashboard/dashboard-metrics';
import { RecentActivity } from '@/app/components/dashboard/recent-activity';
import { AlertsWidget } from '@/app/components/dashboard/alerts-widget';
import { ActiveAgentsWidget } from '@/app/components/dashboard/active-agents-widget';
import { ErrorDisplay } from '@/app/components/ui/error-display';
import { useTimeRange } from '@/app/hooks/useTimeRange';

export default function DashboardPage() {
  // Time range state (e.g., last 24 hours by default)
  const timeRange = useTimeRange({ defaultRange: '24h' });
  
  // State for each data section
  const [agents, setAgents] = useState([]);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({
    totalAgents: 0,
    activeAgents: 0,
    todayEvents: 0,
    totalAlerts: 0
  });
  
  // Loading states
  const [loading, setLoading] = useState({
    agents: true,
    events: true,
    alerts: true,
    metrics: true
  });
  
  // Error states
  const [errors, setErrors] = useState({
    agents: null,
    events: null,
    alerts: null,
    metrics: null
  });
  
  // Fetch agents data
  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(prev => ({ ...prev, agents: true }));
        const response = await agentsService.getAll();
        setAgents(response.items);
        setErrors(prev => ({ ...prev, agents: null }));
      } catch (err) {
        setErrors(prev => ({ ...prev, agents: err }));
      } finally {
        setLoading(prev => ({ ...prev, agents: false }));
      }
    }
    
    fetchAgents();
  }, []);
  
  // Fetch events data with time range
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(prev => ({ ...prev, events: true }));
        const response = await eventsService.getAll({
          start_time: timeRange.startTime,
          end_time: timeRange.endTime,
          page_size: 10
        });
        setEvents(response.items);
        setErrors(prev => ({ ...prev, events: null }));
      } catch (err) {
        setErrors(prev => ({ ...prev, events: err }));
      } finally {
        setLoading(prev => ({ ...prev, events: false }));
      }
    }
    
    fetchEvents();
  }, [timeRange.startTime, timeRange.endTime]);
  
  // Fetch alerts data with time range
  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(prev => ({ ...prev, alerts: true }));
        const response = await alertsService.getAll({
          start_time: timeRange.startTime,
          end_time: timeRange.endTime,
          severity: 'critical',
          page_size: 5
        });
        setAlerts(response.items);
        setErrors(prev => ({ ...prev, alerts: null }));
      } catch (err) {
        setErrors(prev => ({ ...prev, alerts: err }));
      } finally {
        setLoading(prev => ({ ...prev, alerts: false }));
      }
    }
    
    fetchAlerts();
  }, [timeRange.startTime, timeRange.endTime]);
  
  // Fetch metrics data with time range
  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(prev => ({ ...prev, metrics: true }));
        
        // Get agent count
        const agentsResponse = await agentsService.getAll();
        
        // Get token usage metrics
        const tokenMetrics = await metricsService.tokenUsage.getTotal({
          start_time: timeRange.startTime,
          end_time: timeRange.endTime
        });
        
        // Get alerts count
        const alertsResponse = await alertsService.getAll({
          start_time: timeRange.startTime,
          end_time: timeRange.endTime
        });
        
        setMetrics({
          totalAgents: agentsResponse.total,
          activeAgents: agentsResponse.items.filter(a => a.active).length,
          tokenUsage: tokenMetrics.total,
          totalAlerts: alertsResponse.total
        });
        
        setErrors(prev => ({ ...prev, metrics: null }));
      } catch (err) {
        setErrors(prev => ({ ...prev, metrics: err }));
      } finally {
        setLoading(prev => ({ ...prev, metrics: false }));
      }
    }
    
    fetchMetrics();
  }, [timeRange.startTime, timeRange.endTime]);
  
  return (
    <div className="dashboard">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {/* Time range selector */}
        <select 
          value={timeRange.range} 
          onChange={e => timeRange.setRange(e.target.value)}
          className="border rounded p-2"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      
      {/* Dashboard metrics summary */}
      <DashboardMetrics 
        metrics={metrics}
        isLoading={loading.metrics}
        error={errors.metrics}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Recent activity widget */}
        <RecentActivity 
          events={events}
          isLoading={loading.events}
          error={errors.events}
        />
        
        {/* Active agents widget */}
        <ActiveAgentsWidget 
          agents={agents}
          isLoading={loading.agents}
          error={errors.agents}
        />
        
        {/* Alerts widget */}
        <AlertsWidget 
          alerts={alerts}
          isLoading={loading.alerts}
          error={errors.alerts}
        />
      </div>
    </div>
  );
}
```

Alternatively, using our custom hooks for more concise code:

```typescript
'use client';

import { 
  agentsService, 
  eventsService, 
  alertsService,
  metricsService 
} from '@/app/lib/api/services';
import { DashboardMetrics } from '@/app/components/dashboard/dashboard-metrics';
import { RecentActivity } from '@/app/components/dashboard/recent-activity';
import { AlertsWidget } from '@/app/components/dashboard/alerts-widget';
import { ActiveAgentsWidget } from '@/app/components/dashboard/active-agents-widget';
import { useApiRequest } from '@/app/hooks/useApiRequest';
import { useTimeRange } from '@/app/hooks/useTimeRange';

export default function DashboardPage() {
  const timeRange = useTimeRange({ defaultRange: '24h' });
  
  // Data fetching with hooks
  const { 
    data: agentsData, 
    loading: agentsLoading,
    error: agentsError
  } = useApiRequest(() => agentsService.getAll());
  
  const { 
    data: eventsData, 
    loading: eventsLoading,
    error: eventsError
  } = useApiRequest(() => eventsService.getAll({
    start_time: timeRange.startTime,
    end_time: timeRange.endTime,
    page_size: 10
  }), { dependencies: [timeRange.startTime, timeRange.endTime] });
  
  const { 
    data: alertsData, 
    loading: alertsLoading,
    error: alertsError
  } = useApiRequest(() => alertsService.getAll({
    start_time: timeRange.startTime,
    end_time: timeRange.endTime,
    severity: 'critical',
    page_size: 5
  }), { dependencies: [timeRange.startTime, timeRange.endTime] });
  
  const { 
    data: tokenMetrics, 
    loading: metricsLoading,
    error: metricsError
  } = useApiRequest(() => metricsService.tokenUsage.getTotal({
    start_time: timeRange.startTime,
    end_time: timeRange.endTime,
  }), { dependencies: [timeRange.startTime, timeRange.endTime] });
  
  // Derived metrics
  const metrics = {
    totalAgents: agentsData?.total || 0,
    activeAgents: agentsData?.items.filter(a => a.active).length || 0,
    tokenUsage: tokenMetrics?.total || 0,
    totalAlerts: alertsData?.total || 0
  };
  
  return (
    <div className="dashboard">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <select 
          value={timeRange.range} 
          onChange={e => timeRange.setRange(e.target.value)}
          className="border rounded p-2"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      
      <DashboardMetrics 
        metrics={metrics}
        isLoading={metricsLoading || agentsLoading}
        error={metricsError || agentsError}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <RecentActivity 
          events={eventsData?.items || []}
          isLoading={eventsLoading}
          error={eventsError}
        />
        
        <ActiveAgentsWidget 
          agents={agentsData?.items || []}
          isLoading={agentsLoading}
          error={agentsError}
        />
        
        <AlertsWidget 
          alerts={alertsData?.items || []}
          isLoading={alertsLoading}
          error={alertsError}
        />
      </div>
    </div>
  );
}
```

### Implementation Notes

1. **Time Range Filtering**: Add a time range selector to allow users to view data for different periods (24h, 7d, 30d, etc.).

2. **Optimized Data Fetching**: Consider using SWR or React Query for more advanced data fetching with caching, refetching, and background updates.

3. **Concurrent Requests**: Make API requests concurrently when possible for better performance.

4. **Progressive Enhancement**: Show data as it becomes available instead of waiting for all requests to complete.

5. **Fallback UI**: Implement fallback UI for each widget when data is loading or when errors occur.

## Deliverables

1. Updated `app/page.tsx` using the API services
2. Updated dashboard widget components in `app/components/dashboard/`
3. Time range selector implementation
4. Loading states and error handling for each widget

## References

- API Services: `app/lib/api/services/`
- UI Components: `app/components/ui/`
- Custom Hooks: `app/hooks/`
- TypeScript Interfaces: `app/types/api.ts` 

## Additional contenxt
All migration files and docs, as well as all development phases/prompts (this prompt is only one of them) can be found here in the directory "temp_migration"

## AlertsService Implementation Recommendations

When implementing the dashboard update, consider these specific recommendations for using the AlertsService:

1. **AlertsService Methods**: Replace `alertRepo.findBySeverity('critical', 5)` with `AlertsService.getCritical({ page_size: 5 })` which directly supports filtering by critical severity.

2. **Time Range Filtering**: The AlertsService supports time filtering with `start_time` and `end_time` parameters. Use the `getByTimeRange()` method or include these parameters in other methods:
   ```typescript
   await alertsService.getAll({
     start_time: timeRange.startTime,
     end_time: timeRange.endTime,
     severity: 'critical',
     page_size: 5
   });
   ```

3. **Date Handling**: The AlertsService automatically parses date fields (`timestamp` and `reviewed_at`) in responses, so you'll receive proper Date objects rather than strings.

4. **Pagination Support**: All list methods return paginated responses with `{ items, total, page, page_size }` structure. Use this data for pagination UI and count displays.

5. **Alert Type Definition**: Import and use the `AlertType` and `AlertSeverity` types from the service for type safety when filtering alerts:
   ```typescript
   import { AlertsService, AlertType, AlertSeverity } from '@/lib/api/services';
   ```

6. **Specialized Methods**: Besides `getCritical()`, consider using other specialized methods like `getUnreviewed()` or `getByAgentId()` if your dashboard needs to display these specific alert categories.

7. **Review Functionality**: The `markAsReviewed(alertId, reviewedBy)` method can be used if you want to implement a feature for users to acknowledge alerts directly from the dashboard.

8. **Error Handling**: Make sure to catch errors when calling AlertsService methods as shown in the example implementations above. The service is designed to propagate API errors for proper handling in the UI.