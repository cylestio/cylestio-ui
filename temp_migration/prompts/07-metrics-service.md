# Task: Implement Metrics API Service

## Context
As part of our migration from direct database access to the REST API, we need to implement the Metrics API service. This service will provide access to various monitoring metrics like token usage, response times, and other performance indicators through the API.

## Requirements

1. Create a Metrics API service module
2. Implement methods for all metrics-related endpoints
3. Support time range filtering
4. Support agent-specific metrics

## Detailed Steps

1. Create a new file: `app/lib/api/services/metrics.ts`
2. Implement service methods for common metrics:
   - Token usage metrics
   - Response time metrics
   - Other performance metrics
3. Add support for filtering by time range and agent ID

## Technical Details

The Metrics API service should use our centralized API client to make requests to the following endpoints:

- `GET /v1/metrics/token_usage/total` - Get total token usage metrics
- `GET /v1/metrics/token_usage/by_agent` - Get token usage metrics per agent
- `GET /v1/metrics/response_time/average` - Get average response time metrics
- `GET /v1/metrics/response_time/by_model` - Get response time metrics per model

All metrics endpoints support these common parameters:
- `agent_id` - Filter by agent ID
- `start_time` - Start of time range
- `end_time` - End of time range

Here's the expected response structure for the token usage endpoint:

```json
{
  "total": 1542632,
  "prompt_tokens": 978450,
  "completion_tokens": 564182,
  "by_model": {
    "gpt-4": {
      "total": 842632,
      "prompt_tokens": 478450,
      "completion_tokens": 364182
    },
    "gpt-3.5-turbo": {
      "total": 700000,
      "prompt_tokens": 500000,
      "completion_tokens": 200000
    }
  }
}
```

And for the response time endpoint:

```json
{
  "average_ms": 356,
  "min_ms": 120,
  "max_ms": 2450,
  "median_ms": 320,
  "p95_ms": 875,
  "p99_ms": 1320,
  "by_model": {
    "gpt-4": {
      "average_ms": 512,
      "min_ms": 250,
      "max_ms": 2450
    },
    "gpt-3.5-turbo": {
      "average_ms": 245,
      "min_ms": 120,
      "max_ms": 950
    }
  }
}
```

## Implementation Example

Here's a starting point for the metrics service:

```typescript
import { apiClient } from '../client';
import { TokenUsageMetrics, ResponseTimeMetrics } from '@/app/types/api';

export interface MetricsServiceParams {
  agent_id?: string;
  start_time?: Date | string;
  end_time?: Date | string;
}

export const metricsService = {
  tokenUsage: {
    /**
     * Get total token usage metrics
     */
    async getTotal(params: MetricsServiceParams = {}): Promise<TokenUsageMetrics> {
      const response = await apiClient.get('/metrics/token_usage/total', { params });
      return response.data;
    },
    
    /**
     * Get token usage metrics by agent
     */
    async getByAgent(params: MetricsServiceParams = {}): Promise<Record<string, TokenUsageMetrics>> {
      const response = await apiClient.get('/metrics/token_usage/by_agent', { params });
      return response.data;
    },
    
    /**
     * Get token usage metrics for a specific agent
     */
    async getForAgent(agentId: string, params: Omit<MetricsServiceParams, 'agent_id'> = {}): Promise<TokenUsageMetrics> {
      const response = await apiClient.get('/metrics/token_usage/total', { 
        params: { ...params, agent_id: agentId } 
      });
      return response.data;
    }
  },
  
  responseTime: {
    /**
     * Get average response time metrics
     */
    async getAverage(params: MetricsServiceParams = {}): Promise<ResponseTimeMetrics> {
      const response = await apiClient.get('/metrics/response_time/average', { params });
      return response.data;
    },
    
    /**
     * Get response time metrics by model
     */
    async getByModel(params: MetricsServiceParams = {}): Promise<Record<string, ResponseTimeMetrics>> {
      const response = await apiClient.get('/metrics/response_time/by_model', { params });
      return response.data;
    },
    
    /**
     * Get response time metrics for a specific agent
     */
    async getForAgent(agentId: string, params: Omit<MetricsServiceParams, 'agent_id'> = {}): Promise<ResponseTimeMetrics> {
      const response = await apiClient.get('/metrics/response_time/average', { 
        params: { ...params, agent_id: agentId } 
      });
      return response.data;
    }
  }
};
```

## Type Definitions

You'll need to define appropriate interfaces for the metrics in `app/types/api.ts`. Here's a starting point:

```typescript
export interface ModelTokenUsage {
  total: number;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface TokenUsageMetrics {
  total: number;
  prompt_tokens: number;
  completion_tokens: number;
  by_model: Record<string, ModelTokenUsage>;
}

export interface ModelResponseTime {
  average_ms: number;
  min_ms: number;
  max_ms: number;
}

export interface ResponseTimeMetrics {
  average_ms: number;
  min_ms: number;
  max_ms: number;
  median_ms: number;
  p95_ms: number;
  p99_ms: number;
  by_model: Record<string, ModelResponseTime>;
}
```

## Current Repository Methods To Replace

These metrics were previously calculated directly from the database. For reference, here are some examples of what might have been done before:

```typescript
// Pseudo-code example from previous implementation
public getTokenUsage(startTime: string, endTime: string): TokenUsageStats {
  const results = this.dbUtils.queryOne<TokenUsageStats>(
    `SELECT
      SUM(prompt_tokens) as prompt_tokens,
      SUM(completion_tokens) as completion_tokens,
      SUM(prompt_tokens + completion_tokens) as total
     FROM llm_calls
     WHERE timestamp BETWEEN @startTime AND @endTime`,
    { startTime, endTime }
  );
  
  return results || { prompt_tokens: 0, completion_tokens: 0, total: 0 };
}
```

## Deliverables

1. Complete implementation of `app/lib/api/services/metrics.ts`
2. Export the service from `app/lib/api/services/index.ts`
3. Define appropriate interfaces in `app/types/api.ts`
4. Include appropriate JSDoc comments for all methods

## References

- API Documentation for metrics endpoints
- TypeScript interfaces in `app/types/api.ts`
- API client in `app/lib/api/client.ts` 

## Additional contenxt
All migration files and docs, as well as all development phases/prompts (this prompt is only one of them) can be found here in the directory "temp_migration"

## Recommendations from Events API Service Implementation

Based on the implementation of the Events API Service (Task 6), here are key considerations for the Metrics API Service:

1. **API Structure**: The Events API Service uses a pattern where all methods leverage a central `getAll` method with different parameter combinations. Consider a similar approach for metrics methods to maintain consistency.

2. **Type Handling**: The Events service uses `EventType` enum for type-safe event filtering. Consider defining similar enums for metrics types if applicable.

3. **Date Handling**: The `parseApiDates` helper converts string timestamps to Date objects. This won't apply to metrics data which doesn't typically have timestamps in the response objects themselves (only in query parameters).

4. **Parameter Naming**: Keep parameter naming consistent with the Events service - `start_time` and `end_time` rather than alternatives like `from` and `to`.

5. **Response Processing**: While the Events service needs to process dates in responses, metrics responses are primarily numeric and shouldn't need post-processing transformation.

6. **Service Organization**: The Events service is implemented as a flat object with methods. The metrics example uses nested objects (`tokenUsage`, `responseTime`). Both approaches work, but ensure consistency in how you expose the service in `index.ts`.

7. **Testing**: The Events service tests use Jest spies to verify that specialized methods call the core methods with correct parameters. This is an effective approach for the nested structure of the metrics service as well.