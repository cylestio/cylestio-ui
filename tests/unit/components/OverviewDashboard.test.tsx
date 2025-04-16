import React from 'react';
import { render } from '@testing-library/react';
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
  const mockTimeRange = {
    range: '24h',
    setRange: jest.fn(),
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(),
    setCustomTimeRange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useTimeRange hook
    (useTimeRange as jest.Mock).mockReturnValue(mockTimeRange);

    // Mock API responses with minimal data
    (useApiRequest as jest.Mock).mockImplementation(() => ({
      data: [],
      loading: false,
      error: null
    }));
  });

  it('renders the dashboard without crashing', () => {
    render(<OverviewDashboard />);
    // Basic test for the first version - component should render without crashing
    expect(document.body.textContent).toBeDefined();
  });
}); 