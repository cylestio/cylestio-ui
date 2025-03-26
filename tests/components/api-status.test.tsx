import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ApiStatus } from '../../app/components/ui/api-status';
import { checkApiStatus } from '../../app/lib/api/status';

// Mock the API status check
jest.mock('../../app/lib/api/status', () => ({
  checkApiStatus: jest.fn(),
}));

describe('ApiStatus Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading state initially', () => {
    (checkApiStatus as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<ApiStatus />);
    
    expect(screen.getByText('Checking API Connection...')).toBeInTheDocument();
  });

  test('displays connected state when API is available', async () => {
    (checkApiStatus as jest.Mock).mockResolvedValue(true);
    
    render(<ApiStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('API Connected')).toBeInTheDocument();
    });
  });

  test('displays disconnected state when API is unavailable', async () => {
    (checkApiStatus as jest.Mock).mockResolvedValue(false);
    
    render(<ApiStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('API Disconnected')).toBeInTheDocument();
    });
  });

  test('displays disconnected state when API check throws an error', async () => {
    (checkApiStatus as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(<ApiStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('API Disconnected')).toBeInTheDocument();
    });
  });
}); 