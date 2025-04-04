#!/usr/bin/env node

/**
 * API Endpoint Fixer
 * 
 * This script checks for missing endpoints in the real API server and 
 * provides instructions on how to implement them.
 * 
 * Usage:
 *   node scripts/api-endpoint-fixer.js
 */

console.log('\n=== Cylestio API Endpoint Fixer ===\n');
console.log('Based on the server logs, the following endpoints are missing in the real API server:');

// List missing endpoints
const missingEndpoints = [
  {
    path: '/api/v1/events/',
    method: 'GET',
    description: 'Fetch events with pagination support',
    parameters: ['page', 'page_size', 'start_time', 'end_time'],
    implementation: `
@app.get('/api/v1/events/', response_model=PaginatedResponse[Event])
def get_events(
    page: int = 1, 
    page_size: int = 10,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None
):
    """Get a paginated list of events."""
    # Return an empty list for now
    return {
        "items": [],
        "total": 0,
        "page": page,
        "page_size": page_size
    }
`
  },
  {
    path: '/api/v1/alerts/',
    method: 'GET',
    description: 'Fetch security alerts with pagination and filtering',
    parameters: ['page', 'page_size', 'start_time', 'end_time', 'severity'],
    implementation: `
@app.get('/api/v1/alerts/', response_model=PaginatedResponse[Alert])
def get_alerts(
    page: int = 1, 
    page_size: int = 10,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    severity: Optional[str] = None
):
    """Get a paginated list of security alerts."""
    # Return an empty list for now
    return {
        "items": [],
        "total": 0,
        "page": page,
        "page_size": page_size
    }
`
  },
  {
    path: '/api/v1/agents/{agent_id}/metrics/',
    method: 'GET',
    description: 'Fetch metrics for a specific agent',
    parameters: ['agent_id'],
    implementation: `
@app.get('/api/v1/agents/{agent_id}/metrics/', response_model=AgentMetrics)
def get_agent_metrics(agent_id: str):
    """Get metrics for a specific agent."""
    # Return default metrics
    return {
        "total_sessions": 0,
        "total_conversations": 0,
        "total_events": 0,
        "llm_calls": 0,
        "tool_calls": 0,
        "security_alerts": 0,
        "average_response_time": 0
    }
`
  },
  {
    path: '/api/v1/metrics/response_time/average/',
    method: 'GET',
    description: 'Fetch average response time metrics',
    parameters: ['start_time', 'end_time'],
    implementation: `
@app.get('/api/v1/metrics/response_time/average/')
def get_average_response_time(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None
):
    """Get average response time metrics."""
    # Return empty metrics
    return {
        "items": [],
        "total": 0,
        "average": 0
    }
`
  },
  {
    path: '/api/v1/metrics/token_usage/total/',
    method: 'GET',
    description: 'Fetch token usage metrics',
    parameters: ['start_time', 'end_time'],
    implementation: `
@app.get('/api/v1/metrics/token_usage/total/')
def get_token_usage(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None
):
    """Get token usage metrics."""
    # Return empty metrics
    return {
        "items": [],
        "total": 0,
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "total_tokens": 0
    }
`
  },
  {
    path: '/api/v1/dashboard',
    method: 'GET',
    description: 'Fetch dashboard overview data',
    parameters: [],
    implementation: `
@app.get('/api/v1/dashboard')
def get_dashboard():
    """Get dashboard overview data."""
    # Return basic dashboard data structure
    return {
        "metrics": {
            "total_agents": 1,  # Based on the one agent we have
            "active_agents": 0,
            "total_events": 0,
            "security_alerts": 0
        },
        "recent_events": [],
        "recent_alerts": [],
        "agent_status": {
            "active": 0,
            "inactive": 1  # Based on the one inactive agent we have
        }
    }
`
  }
];

// Print information about each missing endpoint
missingEndpoints.forEach((endpoint, index) => {
  console.log(`\n${index + 1}. ${endpoint.method} ${endpoint.path}`);
  console.log(`   Description: ${endpoint.description}`);
  console.log(`   Parameters: ${endpoint.parameters.join(', ') || 'None'}`);
});

console.log('\n\n=== Implementation Instructions ===\n');
console.log('To fix the missing endpoints, add the following code to your FastAPI app:');

// Print implementation code for each endpoint
missingEndpoints.forEach((endpoint, index) => {
  console.log(`\n${index + 1}. ${endpoint.method} ${endpoint.path}:`);
  console.log(endpoint.implementation);
});

console.log('\n=== Alternative Solution ===\n');
console.log('If you prefer not to modify the API server, you can continue using the client-side fixes that:');
console.log('1. Handle 404 errors gracefully with fallback data');
console.log('2. Provide empty arrays or default values for missing endpoints');
console.log('3. Display user-friendly messages for unavailable features');

console.log('\n=== Running with Missing Endpoints ===\n');
console.log('The UI has been updated to work with the current API server by:');
console.log('1. Fixing double API version prefix issues in requests');
console.log('2. Adding graceful error handling for 404 responses');
console.log('3. Providing fallback UI for missing features');

console.log('\nRun the UI with the real API server using:');
console.log('npm run api:use-real && npm run dev:real-api'); 