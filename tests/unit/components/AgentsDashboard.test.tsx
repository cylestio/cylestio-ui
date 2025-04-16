import React from 'react';
import { render } from '@testing-library/react';
import { AgentsDashboardWrapper } from '@/components/AgentsDashboardWrapper';
import { AgentService } from '@/lib/api/services';
import { useRouter } from 'next/navigation';

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

// Mock the API services
jest.mock('@/lib/api/services', () => ({
  AgentService: {
    getAll: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    }),
  },
}));

describe('AgentsDashboard', () => {
  it('renders without crashing', () => {
    // Basic test that just ensures the component renders without errors
    expect(() => render(<AgentsDashboardWrapper />)).not.toThrow();
  });
}); 