import React from 'react';
import { render, screen } from '@testing-library/react';
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
  beforeEach(() => {
    jest.clearAllMocks();
    // Just return empty promises for first version
    (AgentService.getById as jest.Mock).mockResolvedValue({});
    (AgentService.getMetrics as jest.Mock).mockResolvedValue({});
  });

  it('renders the component without crashing', () => {
    render(<AgentDetail agentId="agent-1" />);
    // Basic test for the first version - component should render without crashing
    expect(document.body.textContent).toBeDefined();
  });
}); 