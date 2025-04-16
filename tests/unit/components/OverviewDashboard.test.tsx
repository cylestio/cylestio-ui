import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import OverviewDashboard from '@/components/OverviewDashboard';
import { 
  AgentService, 
  EventsService,
  AlertsService,
  MetricsService 
} from '@/lib/api/services';
import { useTimeRange, useApiRequest } from '@/hooks';

// Mock the hooks
jest.mock('@/hooks', () => ({
  useTimeRange: jest.fn(),
  useApiRequest: jest.fn()
}));

// Mock fetch for direct API calls
global.fetch = jest.fn();

// Mock the API services
jest.mock('@/lib/api/services', () => ({
  AgentService: {
    getMostActive: jest.fn()
  },
  EventsService: {
    getAll: jest.fn()
  },
  AlertsService: {
    getCritical: jest.fn()
  },
  MetricsService: {
    responseTime: {
      getAverage: jest.fn()
    },
    tokenUsage: {
      getTotal: jest.fn()
    }
  }
}));

describe('OverviewDashboard', () => {
  // Mock data
  const mockAgents = [
    {
      id: 1,
      agent_id: 'agent-1',
      name: 'Test Agent 1',
      description: 'Test Agent Description',
      version: '1.0.0',
      active: true,
      last_active: new Date().toISOString(),
      creation_time: new Date().toISOString(),
      type: 'Test',
      event_count: 150
    },
    {
      id: 2,
      agent_id: 'agent-2',
      name: 'Test Agent 2',
      description: 'Another Test Agent',
      version: '1.0.0',
      active: false,
      last_active: new Date().toISOString(),
      creation_time: new Date().toISOString(),
      type: 'Test',
      event_count: 75
    }
  ];

  const mockEvents = {
    items: [
      {
        id: 1,
        event_id: 'event-1',
        agent_id: 'agent-1',
        session_id: 'session-1',
        conversation_id: 'conv-1',
        event_type: 'llm_request',
        timestamp: new Date().toISOString(),
        metadata: {}
      },
      {
        id: 2,
        event_id: 'event-2',
        agent_id: 'agent-2',
        session_id: 'session-1',
        conversation_id: 'conv-1',
        event_type: 'tool_call',
        timestamp: new Date().toISOString(),
        metadata: {}
      }
    ],
    total: 2,
    page: 1,
    page_size: 10
  };

  const mockAlerts = {
    items: [
      {
        id: 1,
        alert_id: 'alert-1',
        event_id: 'event-1',
        agent_id: 'agent-1',
        timestamp: new Date().toISOString(),
        alert_type: 'prompt_injection',
        severity: 'critical',
        description: 'Detected prompt injection attempt',
        metadata: {},
        reviewed: false,
        reviewed_at: null,
        reviewed_by: null,
        action_taken: 'blocked'
      }
    ],
    total: 1,
    page: 1,
    page_size: 10
  };

  const mockResponseTimeMetrics = {
    average_ms: 250,
    min_ms: 100,
    max_ms: 500,
    median_ms: 230,
    p95_ms: 450,
    p99_ms: 490,
    by_model: {}
  };

  const mockTokenMetrics = {
    total: 10000,
    prompt_tokens: 5000,
    completion_tokens: 5000,
    by_model: {}
  };

  const mockHourlyData = [
    { hour: '0:00', count: 30 },
    { hour: '1:00', count: 25 },
    // ... more hourly data
  ];

  const mockAlertTypes = [
    { type: 'prompt_injection', count: 12 },
    { type: 'sensitive_data_leak', count: 8 },
  ];

  const mockTimeRange = {
    range: '24h',
    setRange: jest.fn(),
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(),
    setCustomTimeRange: jest.fn()
  };

  // Setup for each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useTimeRange hook
    (useTimeRange as jest.Mock).mockReturnValue(mockTimeRange);
    
    // Mock fetch responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/events/hourly') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHourlyData)
        });
      } else if (url === '/api/alerts/types') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAlertTypes)
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders the dashboard with data', async () => {
    // Mock all API calls with success responses
    (useApiRequest as jest.Mock).mockImplementation((fn, options) => {
      // Based on which service function is being called, return appropriate mock data
      if (fn.toString().includes('getMostActive')) {
        return {
          data: mockAgents,
          loading: false,
          error: null
        };
      } else if (fn.toString().includes('getAll')) {
        return {
          data: mockEvents,
          loading: false,
          error: null
        };
      } else if (fn.toString().includes('getCritical')) {
        return {
          data: mockAlerts,
          loading: false,
          error: null
        };
      } else if (fn.toString().includes('getAverage')) {
        return {
          data: mockResponseTimeMetrics,
          loading: false,
          error: null
        };
      } else if (fn.toString().includes('getTotal')) {
        return {
          data: mockTokenMetrics,
          loading: false,
          error: null
        };
      }
      return {
        data: null,
        loading: false,
        error: null
      };
    });

    render(<OverviewDashboard />);
    
    // Wait for everything to be rendered
    await waitFor(() => {
      // Check headings
      expect(screen.getByText('Cylestio Monitor')).toBeInTheDocument();
      
      // Check that time range selector is rendered
      expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
      
      // Check that at least one agent is rendered
      expect(screen.getAllByText(/Test Agent/)[0]).toBeInTheDocument();
    });
  });

  it('changes time range when selector is changed', async () => {
    // Mock all API calls with success responses
    (useApiRequest as jest.Mock).mockImplementation((fn, options) => {
      // Based on which service function is being called, return appropriate mock data
      if (fn.toString().includes('getMostActive')) {
        return {
          data: mockAgents,
          loading: false,
          error: null
        };
      } else if (fn.toString().includes('getAll')) {
        return {
          data: mockEvents,
          loading: false,
          error: null
        };
      } else if (fn.toString().includes('getCritical')) {
        return {
          data: mockAlerts,
          loading: false,
          error: null
        };
      } else if (fn.toString().includes('getAverage')) {
        return {
          data: mockResponseTimeMetrics,
          loading: false,
          error: null
        };
      } else if (fn.toString().includes('getTotal')) {
        return {
          data: mockTokenMetrics,
          loading: false,
          error: null
        };
      }
      return {
        data: null,
        loading: false,
        error: null
      };
    });

    render(<OverviewDashboard />);
    
    // Wait for everything to be rendered
    await waitFor(() => {
      // Find the time range selector using testid
      const selector = screen.getByTestId('time-range-selector');
      
      // Change to 7 days
      fireEvent.change(selector, { target: { value: '7d' } });
      
      // Check if setRange was called with the new value
      expect(mockTimeRange.setRange).toHaveBeenCalledWith('7d');
    });
  });

  it('renders loading state when data is loading', async () => {
    // Mock loading state
    (useApiRequest as jest.Mock).mockImplementation((fn, options) => {
      if (fn.toString().includes('getMostActive')) {
        return {
          data: null,
          loading: true,
          error: null
        };
      }
      return {
        data: null,
        loading: false,
        error: null
      };
    });
    
    render(<OverviewDashboard />);
    
    // Check for loading spinner
    await waitFor(() => {
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('renders error state when API call fails', async () => {
    // Mock error state
    (useApiRequest as jest.Mock).mockImplementation((fn, options) => {
      if (fn.toString().includes('getMostActive')) {
        return {
          data: [], // Return empty array instead of null to avoid .map() error
          loading: false,
          error: { status: 500, message: 'Failed to fetch agents' }
        };
      }
      return {
        data: null,
        loading: false,
        error: null
      };
    });
    
    render(<OverviewDashboard />);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch agents')).toBeInTheDocument();
    });
  });
}); 