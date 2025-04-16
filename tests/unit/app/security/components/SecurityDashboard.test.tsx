import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecurityDashboard from '../../../../../app/security/components/SecurityDashboard';

// Mock the API functions
jest.mock('../../../../../app/lib/api', () => ({
  fetchAPI: jest.fn().mockResolvedValue({})
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

// Mock the charts to avoid issues with rendering in test environment
jest.mock('@tremor/react', () => {
  const originalModule = jest.requireActual('@tremor/react');
  return {
    ...originalModule,
    AreaChart: () => <div data-testid="area-chart">Area Chart</div>,
    BarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
    DonutChart: () => <div data-testid="donut-chart">Donut Chart</div>,
  };
});

describe('SecurityDashboard', () => {
  const mockFilters = {
    severity: '',
    category: '',
    alert_level: '',
    llm_vendor: '',
    search: '',
    time_range: '7d',
  };

  it('renders without crashing', () => {
    // Basic test that just ensures the component renders without errors
    expect(() => 
      render(
        <SecurityDashboard
          timeRange="7d"
          filters={mockFilters}
        />
      )
    ).not.toThrow();
  });
}); 