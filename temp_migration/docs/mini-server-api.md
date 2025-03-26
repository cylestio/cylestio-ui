# Cylestio Mini Local Server API

## Overview
The Cylestio Mini Local Server provides a REST API layer that standardizes access to monitoring data for AI agents. This document outlines the available endpoints, request/response formats, and usage examples.

## Base URL
All API endpoints are accessible at:
```http://localhost:8000/api/v1```

API documentation is available at:
```http://localhost:8000/docs```

## Authentication
The API currently does not require authentication for local usage.

## Common Query Parameters
Most endpoints support these query parameters:

| Parameter    | Type      | Description                                       |
|--------------|-----------|---------------------------------------------------|
| `start_time` | ISO 8601  | Start time for data (default: 24h ago)            |
| `end_time`   | ISO 8601  | End time for data (default: current time)         |
| `agent_id`   | string    | Filter results by agent ID                        |
| `session_id` | string    | Filter results by session ID                      |
| `page`       | integer   | Page number for paginated results (default: 1)    |
| `page_size`  | integer   | Number of items per page (default: 50, max: 100)  |

## Endpoints

### Health Check
```
GET /
```
Returns API health status.

Response:
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### Agents

#### List all agents
```
GET /v1/agents
```

Response:
```json
{
  "items": [
    {
      "id": 1,
      "agent_id": "assistant-abc123",
      "name": "Customer Support Assistant",
      "description": "AI assistant for customer support",
      "version": "1.0.0",
      "active": true,
      "last_active": "2023-05-11T14:23:45Z",
      "creation_time": "2023-05-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
```

#### Get agent by ID
```
GET /v1/agents/{agent_id}
```

Response:
```json
{
  "id": 1,
  "agent_id": "assistant-abc123",
  "name": "Customer Support Assistant",
  "description": "AI assistant for customer support",
  "version": "1.0.0",
  "active": true,
  "last_active": "2023-05-11T14:23:45Z",
  "creation_time": "2023-05-01T10:00:00Z",
  "metrics": {
    "total_sessions": 42,
    "total_conversations": 128,
    "total_events": 1024,
    "llm_calls": 512,
    "tool_calls": 256,
    "security_alerts": 8
  }
}
```

#### Get agent metrics
```
GET /v1/agents/{agent_id}/metrics
```

Response:
```json
{
  "total_sessions": 42,
  "total_conversations": 128,
  "total_events": 1024,
  "llm_calls": 512,
  "tool_calls": 256,
  "security_alerts": 8
}
```

### Events

#### List events
```
GET /v1/events
```

Query parameters:
- `event_type`: Filter by event type (LLM_REQUEST, LLM_RESPONSE, TOOL_CALL, etc.)
- `conversation_id`: Filter by conversation ID
- All common query parameters

Response:
```json
{
  "items": [
    {
      "id": 1,
      "event_id": "evt_abc123",
      "agent_id": 1,
      "session_id": 1,
      "conversation_id": 1,
      "event_type": "LLM_REQUEST",
      "timestamp": "2023-05-11T14:22:30Z",
      "metadata": {
        "model": "gpt-4",
        "temperature": 0.7
      },
      "llm_request": {
        "prompt": "How can I help you today?",
        "model_params": {
          "temperature": 0.7,
          "max_tokens": 500
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
```

#### Get event by ID
```
GET /v1/events/{event_id}
```

Response: Same as a single event object from the list endpoint.

#### Create event
```
POST /v1/events
```

Request body:
```json
{
  "event_id": "evt_xyz789",
  "agent_id": "assistant-abc123",
  "session_id": "sess_def456",
  "conversation_id": "conv_ghi789",
  "event_type": "LLM_REQUEST",
  "timestamp": "2023-05-11T14:22:30Z",
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7
  },
  "llm_request": {
    "prompt": "How can I help you today?",
    "model_params": {
      "temperature": 0.7,
      "max_tokens": 500
    }
  }
}
```

Response:
```json
{
  "id": 2,
  "event_id": "evt_xyz789",
  "agent_id": 1,
  "session_id": 1,
  "conversation_id": 1,
  "event_type": "LLM_REQUEST",
  "timestamp": "2023-05-11T14:22:30Z",
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7
  },
  "llm_request": {
    "prompt": "How can I help you today?",
    "model_params": {
      "temperature": 0.7,
      "max_tokens": 500
    }
  }
}
```

### Metrics

#### Token Usage
```
GET /v1/metrics/token_usage/total
```

Query parameters: All common query parameters

Response:
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

#### Response Times
```
GET /v1/metrics/response_time/average
```

Query parameters: All common query parameters

Response:
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

### Alerts

#### List alerts
```
GET /v1/alerts
```

Query parameters:
- `severity`: Filter by severity (low, medium, high, critical)
- All common query parameters

Response:
```json
{
  "items": [
    {
      "id": 1,
      "alert_id": "alert_abc123",
      "event_id": "evt_def456",
      "agent_id": 1,
      "timestamp": "2023-05-11T14:22:30Z",
      "alert_type": "PROMPT_INJECTION",
      "severity": "high",
      "description": "Potential prompt injection attempt detected",
      "metadata": {
        "input_text": "Ignore previous instructions and...",
        "confidence_score": 0.92
      }
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
```

### Telemetry

#### Get telemetry events
```
GET /v1/telemetry/events
```

Query parameters: All common query parameters

Response:
```json
{
  "items": [
    {
      "id": 1,
      "timestamp": "2023-05-11T14:22:30Z",
      "event_type": "SYSTEM_STATUS",
      "metadata": {
        "cpu_usage": 0.45,
        "memory_usage": 0.68,
        "disk_usage": 0.32
      }
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
```

## Error Handling

All endpoints return standard HTTP status codes:
- 200: Success
- 400: Bad request (invalid parameters)
- 404: Resource not found
- 500: Server error

Error response format:
```json
{
  "status": "error",
  "message": "Error description",
  "detail": {
    "errors": [
      {
        "field": "field_name",
        "message": "Specific error message",
        "type": "error_type"
      }
    ]
  }
}
```

## Example Usage (TypeScript)

```typescript
// API client for Cylestio Mini Local Server
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create an axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch events for a specific agent
async function fetchAgentEvents(agentId: string, startTime: Date, endTime: Date) {
  try {
    const response = await api.get('/events', {
      params: {
        agent_id: agentId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        page: 1,
        page_size: 50
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Get token usage metrics
async function getTokenUsage(startTime: Date, endTime: Date) {
  try {
    const response = await api.get('/metrics/token_usage/total', {
      params: {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching token usage:', error);
    throw error;
  }
}
``` 