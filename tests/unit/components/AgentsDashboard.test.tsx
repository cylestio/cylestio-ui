import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AgentsDashboard } from '@/components/AgentsDashboard';
import { AgentService } from '@/lib/api/services';
import { useRouter } from 'next/navigation';

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the API services
jest.mock('@/lib/api/services', () => ({
  AgentService: {
    getAll: jest.fn(),
  },
}));

describe('AgentsDashboard', () => {
  const mockPush = jest.fn();
  const mockAgents = {
    items: [
      {
        id: 1,
        agent_id: 'agent-1',
        name: 'Test Agent 1',
        description: 'This is a test agent',
        version: '1.0.0',
        active: true,
        last_active: new Date().toISOString(),
        creation_time: new Date().toISOString(),
      },
      {
        id: 2,
        agent_id: 'agent-2',
        name: 'Test Agent 2',
        description: 'This is another test agent',
        version: '1.0.0',
        active: false,
        last_active: new Date().toISOString(),
        creation_time: new Date().toISOString(),
      },
    ],
    total: 2,
    page: 1,
    page_size: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (AgentService.getAll as jest.Mock).mockResolvedValue(mockAgents);
  });

  it('renders the loading state initially', async () => {
    // Mock a loading state by not resolving the promise yet
    const promise = new Promise(() => {});
    (AgentService.getAll as jest.Mock).mockReturnValue(promise);
    
    render(<AgentsDashboard />);
    
    // Check if the loading state is displayed
    expect(screen.getByText('Loading agents...')).toBeInTheDocument();
  });

  it('renders the agents when data is loaded', async () => {
    render(<AgentsDashboard />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
      expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
    });
    
    // Check metrics
    expect(screen.getByText('2')).toBeInTheDocument(); // Total Agents
    expect(screen.getByText('1')).toBeInTheDocument(); // Active Agents
    expect(screen.getByText('1')).toBeInTheDocument(); // Inactive Agents
  });

  it('handles API error correctly', async () => {
    const error = { status: 'error', message: 'Failed to fetch agents' };
    (AgentService.getAll as jest.Mock).mockRejectedValue(error);
    
    render(<AgentsDashboard />);
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch agents')).toBeInTheDocument();
    });
  });

  it('navigates to agent details when a row is clicked', async () => {
    render(<AgentsDashboard />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    });
    
    // Click on the first agent row
    fireEvent.click(screen.getByText('Test Agent 1'));
    
    // Check if router.push was called with the correct agent ID
    expect(mockPush).toHaveBeenCalledWith('/agents/agent-1');
  });

  it('filters agents by search query', async () => {
    render(<AgentsDashboard />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
      expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
    });
    
    // Enter a search query
    const searchInput = screen.getByPlaceholderText('Search agents...');
    fireEvent.change(searchInput, { target: { value: 'Agent 1' } });
    
    // Check if only the matching agent is displayed
    expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Agent 2')).not.toBeInTheDocument();
  });

  it('filters agents by status', async () => {
    render(<AgentsDashboard />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
      expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
    });
    
    // Select active status
    const statusSelect = screen.getByText('All statuses');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('Active'));
    
    // Check if only the active agent is displayed
    expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Agent 2')).not.toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(<AgentsDashboard />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    });
    
    // Clear the mock to reset call count
    (AgentService.getAll as jest.Mock).mockClear();
    
    // Click the refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Check if the API was called again
    expect(AgentService.getAll).toHaveBeenCalledTimes(1);
  });

  it('changes pages when pagination controls are used', async () => {
    // Create mock data with pagination
    const paginatedMock = {
      ...mockAgents,
      total: 25,
    };
    (AgentService.getAll as jest.Mock).mockResolvedValue(paginatedMock);
    
    render(<AgentsDashboard />);
    
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    });
    
    // Clear the mock to reset call count
    (AgentService.getAll as jest.Mock).mockClear();
    
    // Click on the "Next" button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Check if the API was called with page 2
    expect(AgentService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        page_size: 10
      })
    );
  });
}); 