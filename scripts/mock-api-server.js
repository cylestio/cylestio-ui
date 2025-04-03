const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.MOCK_API_PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Mock data generators (using functionality from actual implementation)
const generateMockAlerts = (page, pageSize) => {
  const mockAlerts = [];
  const agents = generateMockAgents();
  
  for (let i = 0; i < pageSize; i++) {
    const id = (page - 1) * pageSize + i + 1;
    const event_id = id + 1000;
    const agentIndex = Math.floor(Math.random() * agents.length);
    const agent = agents[agentIndex];
    const timestamp = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
    
    mockAlerts.push({
      id,
      event_id,
      alert_type: ['prompt_injection', 'sensitive_info', 'jailbreak_attempt', 'malicious_code'][Math.floor(Math.random() * 4)],
      severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
      description: `Mock security alert #${id}`,
      created_at: timestamp,
      timestamp,
      action_taken: Math.random() > 0.5 ? 'BLOCKED' : 'LOGGED',
      agent_id: agent.id,
      agent_name: agent.name,
      type: 'security_alert'
    });
  }
  return mockAlerts;
};

const generateMockEvents = (page, pageSize) => {
  const mockEvents = [];
  const agents = generateMockAgents();
  const eventTypes = ['query', 'response', 'tool_call', 'llm_call', 'action', 'error'];
  const statusTypes = ['success', 'warning', 'error'];
  
  for (let i = 0; i < pageSize; i++) {
    const id = (page - 1) * pageSize + i + 1;
    const agentIndex = Math.floor(Math.random() * agents.length);
    const agent = agents[agentIndex];
    const timestamp = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const status = statusTypes[Math.floor(Math.random() * statusTypes.length)];
    
    mockEvents.push({
      id,
      agent_id: agent.id,
      agent_name: agent.name,
      session_id: Math.floor(Math.random() * 20) + 1,
      conversation_id: Math.floor(Math.random() * 50) + 1,
      event_type: ['LLM_REQUEST', 'LLM_RESPONSE', 'TOOL_CALL', 'USER_MESSAGE'][Math.floor(Math.random() * 4)],
      channel: ['LLM', 'TOOL', 'USER', 'SYSTEM'][Math.floor(Math.random() * 4)],
      level: ['INFO', 'WARNING', 'ERROR'][Math.floor(Math.random() * 3)],
      timestamp,
      created_at: timestamp,
      type,
      status,
      description: `Event ${id} description - ${type}`
    });
  }
  return mockEvents;
};

// New mock data generators for missing endpoints
const generateMockAgents = () => {
  return [
    {
      id: 1,
      name: 'Customer Service Bot',
      status: 'active',
      type: 'chat',
      last_active: new Date().toISOString(),
      event_count: 2435,
      timestamp: new Date().toISOString(),
      agent_name: 'Customer Service Bot',
      description: 'A chatbot for customer service inquiries'
    },
    {
      id: 2,
      name: 'Data Analyzer',
      status: 'active',
      type: 'analysis',
      last_active: new Date().toISOString(),
      event_count: 1526,
      timestamp: new Date().toISOString(),
      agent_name: 'Data Analyzer',
      description: 'Analyzes business data and provides insights'
    },
    {
      id: 3,
      name: 'Security Monitor',
      status: 'active',
      type: 'security',
      last_active: new Date().toISOString(),
      event_count: 892,
      timestamp: new Date().toISOString(),
      agent_name: 'Security Monitor',
      description: 'Monitors system security and detects threats'
    },
    {
      id: 4,
      name: 'Legacy Integration',
      status: 'inactive',
      type: 'integration',
      last_active: new Date(Date.now() - 86400000).toISOString(),
      event_count: 421,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      agent_name: 'Legacy Integration',
      description: 'Integrates with legacy systems and databases'
    },
    {
      id: 5,
      name: 'Inventory Assistant',
      status: 'error',
      type: 'assistant',
      last_active: new Date(Date.now() - 3600000).toISOString(),
      event_count: 198,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      agent_name: 'Inventory Assistant',
      description: 'Assists with inventory management and tracking'
    },
  ];
};

const generateMetrics = () => {
  return {
    totalRequests: 1254,
    avgResponseTime: 320,
    successRate: 98.5,
    securityMetrics: {
      blocked: 12,
      suspicious: 48,
      events: [
        { date: '2023-01-01', blocked: 1, suspicious: 5 },
        { date: '2023-01-02', blocked: 2, suspicious: 7 },
        { date: '2023-01-03', blocked: 0, suspicious: 4 },
        { date: '2023-01-04', blocked: 3, suspicious: 9 },
        { date: '2023-01-05', blocked: 1, suspicious: 6 },
        { date: '2023-01-06', blocked: 2, suspicious: 8 },
        { date: '2023-01-07', blocked: 3, suspicious: 9 },
      ]
    }
  };
};

const generateHourlyEvents = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    count: Math.floor(Math.random() * 50) + 20
  }));
};

const generateAlertTypes = () => {
  return [
    { type: 'prompt_injection', count: 32 },
    { type: 'sensitive_info', count: 21 },
    { type: 'jailbreak_attempt', count: 18 },
    { type: 'malicious_code', count: 14 },
    { type: 'data_exfiltration', count: 9 },
    { type: 'pattern_match', count: 25 },
    { type: 'suspicious_behavior', count: 31 }
  ];
};

// API routes
app.get('/api/alerts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  
  res.json({
    alerts: generateMockAlerts(page, pageSize),
    total: 100,
    critical: 5,
  });
});

app.get('/api/events', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  
  res.json({
    events: generateMockEvents(page, pageSize),
    total: 100,
  });
});

app.get('/api/metrics/security', (req, res) => {
  res.json({
    blocked: 12,
    suspicious: 48,
    events: [
      { date: '2023-01-01', blocked: 1, suspicious: 5 },
      { date: '2023-01-02', blocked: 2, suspicious: 7 },
      { date: '2023-01-03', blocked: 0, suspicious: 4 },
      { date: '2023-01-04', blocked: 3, suspicious: 9 },
      { date: '2023-01-05', blocked: 1, suspicious: 6 },
      { date: '2023-01-06', blocked: 2, suspicious: 8 },
      { date: '2023-01-07', blocked: 3, suspicious: 9 },
    ]
  });
});

// Additional routes
app.get('/api/agents', (req, res) => {
  res.json(generateMockAgents());
});

app.get('/api/metrics', (req, res) => {
  res.json(generateMetrics());
});

app.get('/api/events/hourly', (req, res) => {
  res.json(generateHourlyEvents());
});

app.get('/api/alerts/types', (req, res) => {
  res.json(generateAlertTypes());
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
  console.log(`Access at http://localhost:${PORT}`);
}); 