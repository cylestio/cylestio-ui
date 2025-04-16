/**
 * ⚠️ WARNING: MOCK DATA - DO NOT USE IN PRODUCTION ⚠️
 * 
 * This file contains mock data for development and testing purposes only.
 * All components and services should use the real API endpoints in production.
 * 
 * The Cylestio dashboard should ONLY use data from the real API server.
 * If you're tempted to use this file, please use fetchAPI() from lib/api.ts instead.
 */

// Helper to generate relative dates (past)
const getRelativeDate = (daysAgo: number, hoursAgo = 0, minutesAgo = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

// Mock data for agents
export const mockAgents = [
  {
    id: 1,
    agent_id: 'agent-api-test',
    name: 'Agent-api-test',
    type: 'Other',
    status: 'inactive',
    created_at: getRelativeDate(5),
    updated_at: getRelativeDate(5),
    request_count: 0,
    token_usage: 0,
    error_count: 0
  },
  {
    id: 2,
    agent_id: 'agent-agent2',
    name: 'Agent-agent2',
    type: 'Other',
    status: 'inactive',
    created_at: getRelativeDate(2),
    updated_at: getRelativeDate(2),
    request_count: 0,
    token_usage: 0,
    error_count: 0
  },
  {
    id: 3,
    agent_id: 'agent-test',
    name: 'Agent-test',
    type: 'Other',
    status: 'inactive',
    created_at: getRelativeDate(4),
    updated_at: getRelativeDate(4),
    request_count: 0,
    token_usage: 0,
    error_count: 0
  },
  {
    id: 4,
    agent_id: 'agent-test-age',
    name: 'Agent-test-age',
    type: 'Other',
    status: 'inactive',
    created_at: getRelativeDate(3),
    updated_at: getRelativeDate(3),
    request_count: 0,
    token_usage: 0,
    error_count: 0
  },
  {
    id: 5,
    agent_id: 'agent-test-mon',
    name: 'Agent-test-mon',
    type: 'Other',
    status: 'inactive',
    created_at: getRelativeDate(14),
    updated_at: getRelativeDate(14),
    request_count: 5,
    token_usage: 0,
    error_count: 0
  },
  {
    id: 6,
    agent_id: 'agent-customer',
    name: 'Agent-customer',
    type: 'Other',
    status: 'active',
    created_at: getRelativeDate(0, 6),
    updated_at: getRelativeDate(0, 6),
    request_count: 183,
    token_usage: 0,
    error_count: 0
  },
  {
    id: 7,
    agent_id: 'agent-weather',
    name: 'Agent-weather',
    type: 'Other',
    status: 'active',
    created_at: getRelativeDate(0, 4),
    updated_at: getRelativeDate(0, 4),
    request_count: 361,
    token_usage: 0,
    error_count: 0
  },
  {
    id: 8,
    agent_id: 'agent-rag-agen',
    name: 'Agent-rag-agen',
    type: 'Other',
    status: 'active',
    created_at: getRelativeDate(0, 2),
    updated_at: getRelativeDate(0, 2),
    request_count: 118,
    token_usage: 0,
    error_count: 0
  },
  {
    id: 9,
    agent_id: 'agent-chatbot',
    name: 'Agent-chatbot',
    type: 'Other',
    status: 'inactive',
    created_at: getRelativeDate(30),
    updated_at: getRelativeDate(30),
    request_count: 8,
    token_usage: 0,
    error_count: 0
  }
]; 