/**
 * Centralized mock data module for Cylestio UI
 * This module provides mock data functions used throughout the application
 * when real data is not available or when running in mock mode.
 */

// Mock metrics
export function getMockMetrics() {
  return {
    totalRequests: 1254,
    avgResponseTime: 320,
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
}

// Mock alerts generator
export function generateMockAlerts(page: number, pageSize: number): any[] {
  const mockAlerts = [];
  
  for (let i = 0; i < pageSize; i++) {
    const id = (page - 1) * pageSize + i + 1;
    const event_id = id + 1000; // Mock associated event ID
    
    // Random severity with weighted distribution toward lower severity
    const severityRoll = Math.random();
    let severity;
    if (severityRoll < 0.5) {
      severity = 'LOW';
    } else if (severityRoll < 0.8) {
      severity = 'MEDIUM';
    } else if (severityRoll < 0.95) {
      severity = 'HIGH';
    } else {
      severity = 'CRITICAL';
    }
    
    // Random timestamps within last 7 days
    const timestamp = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
    
    // Random alert types
    const alertTypes = [
      'prompt_injection',
      'sensitive_info',
      'jailbreak_attempt',
      'malicious_code',
      'data_exfiltration',
      'pattern_match',
      'suspicious_behavior'
    ];
    const alert_type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    // Descriptions based on alert type
    let description = `Alert #${id}`;
    switch (alert_type) {
      case 'prompt_injection':
        description = `Potential prompt injection attempt detected in user input (ID: ${id})`;
        break;
      case 'sensitive_info':
        description = `Sensitive information detected in request or response (ID: ${id})`;
        break;
      case 'jailbreak_attempt':
        description = `Possible jailbreak attempt using known patterns (ID: ${id})`;
        break;
      case 'malicious_code':
        description = `Code execution attempt detected in user input (ID: ${id})`;
        break;
      case 'data_exfiltration':
        description = `Potential data exfiltration attempt detected (ID: ${id})`;
        break;
    }
    
    mockAlerts.push({
      id,
      event_id,
      alert_type,
      severity,
      description,
      matched_terms: ['term1', 'term2'],
      action_taken: Math.random() > 0.7 ? 'BLOCKED' : 'LOGGED',
      timestamp,
      created_at: timestamp
    });
  }
  
  return mockAlerts;
}

// Mock events generator
export function generateMockEvents(page: number, pageSize: number): any[] {
  const mockEvents = [];
  
  for (let i = 0; i < pageSize; i++) {
    const id = (page - 1) * pageSize + i + 1;
    
    // Random timestamps within last 7 days
    const timestamp = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
    
    // Random event types with distribution
    const eventTypes = [
      'LLM_REQUEST', 'LLM_RESPONSE', 'TOOL_CALL', 'TOOL_RESPONSE',
      'USER_MESSAGE', 'SYSTEM_MESSAGE', 'SECURITY_ALERT'
    ];
    const event_type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Channel based on event type
    let channel;
    switch (event_type) {
      case 'LLM_REQUEST':
      case 'LLM_RESPONSE':
        channel = 'LLM';
        break;
      case 'TOOL_CALL':
      case 'TOOL_RESPONSE':
        channel = 'TOOL';
        break;
      case 'USER_MESSAGE':
        channel = 'USER';
        break;
      case 'SYSTEM_MESSAGE':
        channel = 'SYSTEM';
        break;
      case 'SECURITY_ALERT':
        channel = 'SECURITY';
        break;
      default:
        channel = 'SYSTEM';
    }
    
    // Level with weighted distribution
    const levelRoll = Math.random();
    let level;
    if (levelRoll < 0.7) {
      level = 'INFO';
    } else if (levelRoll < 0.9) {
      level = 'WARNING';
    } else {
      level = 'ERROR';
    }
    
    mockEvents.push({
      id,
      agent_id: Math.floor(Math.random() * 5) + 1,
      session_id: Math.floor(Math.random() * 20) + 1,
      conversation_id: Math.floor(Math.random() * 50) + 1,
      event_type,
      channel,
      level,
      timestamp,
      created_at: timestamp
    });
  }
  
  return mockEvents;
} 