import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecurityAlertsTable from '../../../../../app/security/components/SecurityAlertsTable';
import { mockAlertsResponse } from '../mocks';

// Mock the API functions
jest.mock('../../../../../app/lib/api', () => require('../__mocks__/api'));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

describe('SecurityAlertsTable', () => {
  const mockFilters = {
    severity: '',
    category: '',
    alert_level: '',
    llm_vendor: '',
    search: '',
    time_range: '7d',
  };
  
  const onPageChangeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <SecurityAlertsTable 
        filters={mockFilters} 
        onPageChange={onPageChangeMock} 
      />
    );
    
    expect(screen.getByText('Loading security alerts...')).toBeInTheDocument();
  });

  it('renders alerts table after loading', async () => {
    await act(async () => {
      render(
        <SecurityAlertsTable 
          filters={mockFilters} 
          onPageChange={onPageChangeMock} 
        />
      );
    });
    
    await waitFor(() => {
      // Check that table headers are rendered
      expect(screen.getByText('Severity')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Alert Level')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('LLM Vendor')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      
      // Check that alerts are rendered
      expect(screen.getByText('Potential prompt injection detected')).toBeInTheDocument();
      expect(screen.getByText('Sensitive data in response')).toBeInTheDocument();
      expect(screen.getByText('System instruction disclosure')).toBeInTheDocument();
      
      // Check that severity badges are rendered with correct styles
      const criticalBadge = screen.getByText('critical');
      expect(criticalBadge).toBeInTheDocument();
      
      // Check that formatted categories are displayed
      expect(screen.getByText('Prompt Injection')).toBeInTheDocument();
      expect(screen.getByText('Sensitive Data')).toBeInTheDocument();
      expect(screen.getByText('System Instruction Leak')).toBeInTheDocument();
    });
  });

  it('renders empty state when no alerts', async () => {
    // Mock API to return empty alerts
    const emptyResponse = { 
      ...mockAlertsResponse, 
      alerts: [] 
    };
    
    require('../__mocks__/api').fetchAPI.mockResolvedValueOnce(emptyResponse);
    
    await act(async () => {
      render(
        <SecurityAlertsTable 
          filters={mockFilters} 
          onPageChange={onPageChangeMock} 
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('No alerts found')).toBeInTheDocument();
      expect(screen.getByText('No security alerts match your current filters. Try adjusting your filters or time range.')).toBeInTheDocument();
    });
  });

  it('renders error state when API fails', async () => {
    // Mock API to return error
    require('../__mocks__/api').fetchAPI.mockRejectedValueOnce(new Error('API error'));
    
    await act(async () => {
      render(
        <SecurityAlertsTable 
          filters={mockFilters} 
          onPageChange={onPageChangeMock} 
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load security alerts. Please try again later.')).toBeInTheDocument();
    });
  });

  it('displays pagination when there are multiple pages', async () => {
    await act(async () => {
      render(
        <SecurityAlertsTable 
          filters={mockFilters} 
          onPageChange={onPageChangeMock} 
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 16')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });
}); 