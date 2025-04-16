import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorDisplay } from '@/components/ui/error-display';
import { ApiError } from '@/types/api';

describe('ErrorDisplay', () => {
  const stringError = 'Something went wrong';
  
  const apiError: ApiError = {
    status: 'error',
    message: 'API Error Occurred',
    detail: {
      errors: [
        { field: 'name', message: 'Name is required', type: 'validation' },
        { field: 'email', message: 'Email is invalid', type: 'validation' }
      ]
    }
  };

  it('renders with string error message', () => {
    render(<ErrorDisplay error={stringError} />);
    expect(screen.getByText(stringError)).toBeInTheDocument();
  });

  it('renders with ApiError object', () => {
    render(<ErrorDisplay error={apiError} />);
    expect(screen.getByText(apiError.message)).toBeInTheDocument();
  });

  it('renders with error severity by default', () => {
    render(<ErrorDisplay error={stringError} />);
    const container = screen.getByText(stringError).closest('div');
    expect(container?.parentElement).toHaveClass('bg-red-50', 'text-red-800');
  });

  it('renders with warning severity', () => {
    render(<ErrorDisplay error={stringError} severity="warning" />);
    const container = screen.getByText(stringError).closest('div');
    expect(container?.parentElement).toHaveClass('bg-amber-50', 'text-amber-800');
  });

  it('renders with info severity', () => {
    render(<ErrorDisplay error={stringError} severity="info" />);
    const container = screen.getByText(stringError).closest('div');
    expect(container?.parentElement).toHaveClass('bg-blue-50', 'text-blue-800');
  });

  it('renders error details when showDetails is true', () => {
    render(<ErrorDisplay error={apiError} showDetails={true} />);
    
    // Should show the error message
    expect(screen.getByText(apiError.message)).toBeInTheDocument();
    
    // Should show the error details
    expect(screen.getByText(/name:/i)).toBeInTheDocument();
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email:/i)).toBeInTheDocument();
    expect(screen.getByText(/Email is invalid/i)).toBeInTheDocument();
  });

  it('does not render error details when showDetails is false', () => {
    render(<ErrorDisplay error={apiError} showDetails={false} />);
    
    // Should show the error message
    expect(screen.getByText(apiError.message)).toBeInTheDocument();
    
    // Should not show the error details
    expect(screen.queryByText(/name:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay error={stringError} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onClear when dismiss button is clicked', () => {
    const onClear = jest.fn();
    render(<ErrorDisplay error={stringError} onClear={onClear} />);
    
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not show retry/dismiss buttons when callbacks are not provided', () => {
    render(<ErrorDisplay error={stringError} />);
    
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ErrorDisplay error={stringError} className="custom-class" />);
    const container = screen.getByText(stringError).closest('div');
    expect(container?.parentElement).toHaveClass('custom-class');
  });
}); 