import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AgentDetail } from '@/components/AgentDetail';
import { AgentService } from '@/lib/api/services';

// Mock the API services
jest.mock('@/lib/api/services', () => ({
  AgentService: {
    getById: jest.fn(),
    getMetrics: jest.fn(),
  },
}));

describe('AgentDetail', () => {
  const mockAgent = {
    id: 1,
    agent_id: 'agent-1',
    name: 'Test Agent',
    description: 'This is a test agent',
    version: '1.0.0',
    active: true,
    last_active: new Date().toISOString(),
    creation_time: new Date().toISOString(),
  };

  const mockMetrics = {
    total_sessions: 100,
    total_conversations: 50,
    total_events: 500,
    llm_calls: 200,
    tool_calls: 150,
    security_alerts: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AgentService.getById as jest.Mock).mockResolvedValue(mockAgent);
    (AgentService.getMetrics as jest.Mock).mockResolvedValue(mockMetrics);
  });

  it('renders the loading state initially', async () => {
    // Mock a loading state by not resolving the promise yet
    const promise = new Promise(() => {});
    (AgentService.getById as jest.Mock).mockReturnValue(promise);
    
    render(<AgentDetail agentId="agent-1" />);
    
    // Check if the loading state is displayed
    expect(screen.getByText('Loading agent details...')).toBeInTheDocument();
  });

  it('renders the agent details when data is loaded', async () => {
    render(<AgentDetail agentId="agent-1" />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });
    
    // Check if the agent details are displayed
    expect(screen.getByText('1.0.0')).toBeInTheDocument(); // Version
    expect(screen.getByText('This is a test agent')).toBeInTheDocument(); // Description
  });

  it('renders the metrics when data is loaded', async () => {
    render(<AgentDetail agentId="agent-1" />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });
    
    // Check if the metrics are displayed
    expect(screen.getByText('100')).toBeInTheDocument(); // Sessions
    expect(screen.getByText('50')).toBeInTheDocument(); // Conversations
    expect(screen.getByText('500')).toBeInTheDocument(); // Total Events
    expect(screen.getByText('200')).toBeInTheDocument(); // LLM Calls
    expect(screen.getByText('150')).toBeInTheDocument(); // Tool Calls
    expect(screen.getByText('5')).toBeInTheDocument(); // Security Alerts
  });

  it('handles API error correctly', async () => {
    const error = { status: 'error', message: 'Failed to fetch agent details' };
    (AgentService.getById as jest.Mock).mockRejectedValue(error);
    
    render(<AgentDetail agentId="agent-1" />);
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch agent details')).toBeInTheDocument();
    });
    
    // Check if the Back to Agents button is displayed
    expect(screen.getByText('Back to Agents')).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(<AgentDetail agentId="agent-1" />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });
    
    // Clear the mocks to reset call count
    (AgentService.getById as jest.Mock).mockClear();
    (AgentService.getMetrics as jest.Mock).mockClear();
    
    // Click the refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Check if the API was called again
    expect(AgentService.getById).toHaveBeenCalledTimes(1);
    expect(AgentService.getMetrics).toHaveBeenCalledTimes(1);
  });
}); 