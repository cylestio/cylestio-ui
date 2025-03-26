const express = require('express');
const cors = require('cors');
const { registerWithTrailingSlash } = require('./express-helper');
const app = express();
const port = process.env.MOCK_API_PORT || 8080;

console.log(`Using mock API port: ${port} (override with MOCK_API_PORT env variable)`);

// Middleware
app.use(cors());
app.use(express.json());

// Sample data
const agents = [
  {
    id: 1,
    agent_id: "assistant-abc123",
    name: "Customer Support Assistant",
    description: "AI assistant for customer support",
    version: "1.0.0",
    active: true,
    last_active: new Date().toISOString(),
    creation_time: "2023-05-01T10:00:00Z"
  },
  {
    id: 2,
    agent_id: "assistant-def456",
    name: "Sales Assistant",
    description: "AI assistant for sales",
    version: "1.1.0",
    active: true,
    last_active: new Date().toISOString(),
    creation_time: "2023-06-15T09:30:00Z"
  },
  {
    id: 3,
    agent_id: "assistant-ghi789",
    name: "Development Helper",
    description: "AI assistant for developers",
    version: "0.9.0",
    active: false,
    last_active: "2023-04-20T16:45:00Z",
    creation_time: "2023-04-01T08:15:00Z"
  }
];

const events = [
  {
    id: 1,
    event_id: "evt_abc123",
    agent_id: "assistant-abc123",
    session_id: "sess_123",
    conversation_id: "conv_456",
    event_type: "LLM_REQUEST",
    timestamp: new Date().toISOString(),
    metadata: {
      model: "gpt-4",
      temperature: 0.7
    },
    llm_request: {
      prompt: "How can I help you today?",
      model_params: {
        temperature: 0.7,
        max_tokens: 500
      }
    }
  }
];

const metrics = {
  total_sessions: 42,
  total_conversations: 128,
  total_events: 1024,
  llm_calls: 512,
  tool_calls: 256,
  security_alerts: 8
};

const securityMetrics = {
  total_alerts: 8,
  high_severity: 2,
  medium_severity: 3,
  low_severity: 3,
  recent_alerts: []
};

const alertTypes = [
  { type: "jailbreak_attempt", count: 3, severity: "high" },
  { type: "prompt_injection", count: 2, severity: "high" },
  { type: "data_exfiltration", count: 1, severity: "medium" },
  { type: "system_prompt_leak", count: 2, severity: "medium" }
];

const alerts = [
  {
    id: 1,
    alert_id: "alert_abc123",
    agent_id: "assistant-abc123",
    severity: "high",
    type: "jailbreak_attempt",
    timestamp: new Date().toISOString(),
    description: "Detected attempt to bypass safety guidelines",
    status: "open",
    metadata: {
      detected_pattern: "system prompt extraction",
      confidence: 0.92
    }
  }
];

// Add more events to match the dashboard view
for (let i = 2; i <= 25; i++) {
  events.push({
    id: i,
    event_id: `evt_${i}`,
    agent_id: i % 3 === 0 ? "assistant-ghi789" : (i % 2 === 0 ? "assistant-def456" : "assistant-abc123"),
    session_id: `sess_${i}`,
    conversation_id: `conv_${i + 100}`,
    event_type: ["LLM_REQUEST", "TOOL_CALL", "USER_MESSAGE"][i % 3],
    timestamp: new Date().toISOString(),
    status: ["success", "error", "unknown"][i % 3],
    metadata: {
      model: "gpt-4",
      temperature: 0.7
    }
  });
}

// Generate more security alerts to match the chart data
for (let i = 2; i <= 11; i++) {
  const severities = ["low", "medium", "high", "critical"];
  const types = ["jailbreak_attempt", "prompt_injection", "data_exfiltration", "system_prompt_leak", "external_resource_access"];
  
  alerts.push({
    id: i,
    alert_id: `alert_${i}`,
    agent_id: i % 3 === 0 ? "assistant-ghi789" : (i % 2 === 0 ? "assistant-def456" : "assistant-abc123"),
    severity: severities[i % 4],
    type: types[i % 5],
    timestamp: new Date().toISOString(),
    description: `Security alert ${i} description`,
    status: i % 5 === 0 ? "resolved" : "open",
    metadata: {
      detected_pattern: "pattern",
      confidence: 0.8 + (i / 100)
    }
  });
}

// Update the security metrics to match the actual alerts
securityMetrics.total_alerts = alerts.length;
securityMetrics.critical_alerts = alerts.filter(a => a.severity === "critical").length;
securityMetrics.high_severity = alerts.filter(a => a.severity === "high").length;
securityMetrics.medium_severity = alerts.filter(a => a.severity === "medium").length;
securityMetrics.low_severity = alerts.filter(a => a.severity === "low").length;
securityMetrics.recent_alerts = alerts.slice(0, 5);

// Helper function to generate hourly events data
function generateHourlyEventsData() {
  const hourlyData = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(now.getHours() - i);
    
    hourlyData.push({
      hour: `${hour.getHours()}:00`,
      count: Math.floor(Math.random() * 50) + 10
    });
  }
  
  return {
    items: hourlyData,
    total: hourlyData.length
  };
}

// Helper function to generate alert types data
function generateAlertTypesData() {
  const typesData = [
    { type: 'prompt_injection', count: 12, severity: 'high' },
    { type: 'sensitive_data_leak', count: 8, severity: 'medium' },
    { type: 'unusual_behavior', count: 15, severity: 'low' },
    { type: 'rate_limit', count: 5, severity: 'low' },
    { type: 'authorization_bypass', count: 3, severity: 'high' }
  ];
  
  return {
    items: typesData,
    total: typesData.length
  };
}

// Register routes with and without trailing slashes
registerWithTrailingSlash(app, 'get', '/api/v1/metrics/hourly-events', (req, res) => {
  res.json(generateHourlyEventsData());
});

registerWithTrailingSlash(app, 'get', '/api/v1/metrics/alerts/types', (req, res) => {
  res.json(generateAlertTypesData());
});

registerWithTrailingSlash(app, 'get', '/api/v1/v1/metrics/hourly-events', (req, res) => {
  res.json(generateHourlyEventsData());
});

registerWithTrailingSlash(app, 'get', '/api/v1/v1/metrics/alerts/types', (req, res) => {
  res.json(generateAlertTypesData());
});

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.get('/api/v1/agents/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  res.json({
    items: agents.slice(start, end),
    total: agents.length,
    page,
    page_size: pageSize
  });
});

app.get('/api/v1/agents/:agent_id', (req, res) => {
  const agent = agents.find(a => a.agent_id === req.params.agent_id);
  
  if (!agent) {
    return res.status(404).json({ status: 'error', message: 'Agent not found' });
  }
  
  res.json({
    ...agent,
    metrics: metrics
  });
});

app.get('/api/v1/agents/:agent_id/metrics', (req, res) => {
  const agent = agents.find(a => a.agent_id === req.params.agent_id);
  
  if (!agent) {
    return res.status(404).json({ status: 'error', message: 'Agent not found' });
  }
  
  res.json(metrics);
});

app.get('/api/v1/events/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  
  res.json({
    items: events,
    total: events.length,
    page,
    page_size: pageSize
  });
});

app.get('/api/v1/events/:event_id', (req, res) => {
  const event = events.find(e => e.event_id === req.params.event_id);
  
  if (!event) {
    return res.status(404).json({ status: 'error', message: 'Event not found' });
  }
  
  res.json(event);
});

app.get('/api/v1/alerts/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  res.json({
    items: alerts.slice(start, end),
    total: alerts.length,
    page,
    page_size: pageSize
  });
});

// Get a specific alert by ID
app.get('/api/v1/alerts/:id', (req, res) => {
  const alert = alerts.find(a => a.alert_id === req.params.id || a.id === parseInt(req.params.id));
  
  if (!alert) {
    return res.status(404).json({ status: 'error', message: 'Alert not found' });
  }
  
  res.json(alert);
});

// Also handle the paths without /api/v1 prefix since we fixed the client to use those
app.get('/alerts/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  res.json({
    items: alerts.slice(start, end),
    total: alerts.length,
    page,
    page_size: pageSize
  });
});

app.get('/events/:event_id', (req, res) => {
  const event = events.find(e => e.event_id === req.params.event_id || e.id === parseInt(req.params.event_id));
  
  if (!event) {
    return res.status(404).json({ status: 'error', message: 'Event not found' });
  }
  
  res.json(event);
});

app.get('/api/v1/metrics/', (req, res) => {
  res.json(metrics);
});

app.get('/api/v1/metrics/security', (req, res) => {
  res.json(securityMetrics);
});

app.get('/api/v1/metrics/alerts/types', (req, res) => {
  res.json({
    items: alertTypes,
    total: alertTypes.length
  });
});

// Special fix for double API prefix issue
app.get('/api/v1/api/agents/', (req, res) => {
  // Redirecting to the correct endpoint by passing the same request params
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  res.json({
    items: agents.slice(start, end),
    total: agents.length,
    page,
    page_size: pageSize
  });
});

app.get('/api/v1/api/events/', (req, res) => {
  // Redirecting to the correct endpoint by passing the same request params
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  
  res.json({
    items: events,
    total: events.length,
    page,
    page_size: pageSize
  });
});

// Main dashboard data
app.get('/api/v1/dashboard', (req, res) => {
  res.json({
    metrics: {
      total_agents: agents.length,
      active_agents: agents.filter(a => a.active).length,
      total_events: events.length,
      security_alerts: alerts.length
    },
    recent_events: events.slice(0, 5),
    recent_alerts: alerts.slice(0, 5),
    agent_status: {
      active: agents.filter(a => a.active).length,
      inactive: agents.filter(a => !a.active).length
    }
  });
});

// Also add the path without api/v1 prefix
app.get('/dashboard', (req, res) => {
  res.json({
    metrics: {
      total_agents: agents.length,
      active_agents: agents.filter(a => a.active).length,
      total_events: events.length,
      security_alerts: alerts.length
    },
    recent_events: events.slice(0, 5),
    recent_alerts: alerts.slice(0, 5),
    agent_status: {
      active: agents.filter(a => a.active).length,
      inactive: agents.filter(a => !a.active).length
    }
  });
});

// Add API status endpoint
app.get('/api/v1/status', (req, res) => {
  res.json({
    status: 'connected',
    version: '1.0.0',
    uptime: 100,
    server: `http://localhost:${port}`,
    service: 'cylestio-mini-mock-server',
    environment: 'development'
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: 'connected',
    version: '1.0.0',
    uptime: 100,
    server: `http://localhost:${port}`,
    service: 'cylestio-mini-mock-server',
    environment: 'development'
  });
});

// Get agent count endpoint
app.get('/api/v1/agents/count', (req, res) => {
  res.json({
    total: agents.length,
    active: agents.filter(a => a.active).length,
    inactive: agents.filter(a => !a.active).length
  });
});

// Add agents endpoint without the /api/v1 prefix
app.get('/agents/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  res.json({
    items: agents.slice(start, end),
    total: agents.length,
    page,
    page_size: pageSize
  });
});

// Alert trends data for chart
app.get('/api/v1/alerts/trends', (req, res) => {
  // Generate fake trend data for the last 7 days
  const trendData = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    trendData.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 5) + 1
    });
  }
  
  res.json({
    items: trendData,
    total: trendData.length
  });
});

app.get('/alerts/trends', (req, res) => {
  // Generate fake trend data for the last 7 days
  const trendData = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    trendData.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 5) + 1
    });
  }
  
  res.json({
    items: trendData,
    total: trendData.length
  });
});

// Fix for double v1 prefix - handle both regular and double-prefixed paths
app.get('/api/v1/v1/alerts/', (req, res) => {
  // Just redirect to the proper endpoint with the same params
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  // Filter by severity if requested
  let filteredAlerts = alerts;
  if (req.query.severity) {
    filteredAlerts = alerts.filter(a => a.severity === req.query.severity);
  }
  
  // Filter by date range if provided
  if (req.query.start_time || req.query.end_time) {
    filteredAlerts = filteredAlerts.filter(alert => {
      const alertTime = new Date(alert.timestamp).getTime();
      const startOk = !req.query.start_time || alertTime >= new Date(JSON.parse(req.query.start_time)).getTime();
      const endOk = !req.query.end_time || alertTime <= new Date(JSON.parse(req.query.end_time)).getTime();
      return startOk && endOk;
    });
  }
  
  res.json({
    items: filteredAlerts.slice(start, end),
    total: filteredAlerts.length,
    page,
    page_size: pageSize
  });
});

// Response time metrics
app.get('/api/v1/v1/metrics/response_time/average/', (req, res) => {
  // Generate mock response time data for the requested time period
  const now = new Date();
  const periods = 7;
  const responseTimeData = [];
  
  for (let i = periods - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    responseTimeData.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 1000) + 500 // Random value between 500-1500ms
    });
  }
  
  res.json({
    items: responseTimeData,
    total: responseTimeData.length,
    average: responseTimeData.reduce((sum, item) => sum + item.value, 0) / responseTimeData.length
  });
});

// Token usage metrics
app.get('/api/v1/v1/metrics/token_usage/total/', (req, res) => {
  // Generate mock token usage data for the requested time period
  const now = new Date();
  const periods = 7;
  const tokenUsageData = [];
  
  for (let i = periods - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    tokenUsageData.push({
      date: date.toISOString().split('T')[0],
      input_tokens: Math.floor(Math.random() * 10000) + 2000,
      output_tokens: Math.floor(Math.random() * 5000) + 1000
    });
  }
  
  const totalInput = tokenUsageData.reduce((sum, item) => sum + item.input_tokens, 0);
  const totalOutput = tokenUsageData.reduce((sum, item) => sum + item.output_tokens, 0);
  
  res.json({
    items: tokenUsageData,
    total: tokenUsageData.length,
    total_input_tokens: totalInput,
    total_output_tokens: totalOutput,
    total_tokens: totalInput + totalOutput
  });
});

// Handle 404
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log(`API documentation available at http://localhost:${port}/docs`);
}); 