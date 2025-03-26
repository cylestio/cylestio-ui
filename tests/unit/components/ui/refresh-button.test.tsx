import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RefreshButton } from '@/components/ui/refresh-button';

describe('RefreshButton', () => {
  const defaultProps = {
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders refresh button with default props', () => {
    render(<RefreshButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Refresh');
    expect(button).not.toBeDisabled();
  });

  it('calls onRefresh when button is clicked', () => {
    render(<RefreshButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables button when isLoading is true', () => {
    render(<RefreshButton {...defaultProps} isLoading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(defaultProps.onRefresh).not.toHaveBeenCalled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<RefreshButton {...defaultProps} isLoading={true} />);
    
    const spinner = screen.getByRole('button').querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    const customLabel = 'Reload Data';
    render(<RefreshButton {...defaultProps} label={customLabel} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(customLabel);
  });

  it('applies custom className', () => {
    render(<RefreshButton {...defaultProps} className="custom-class" />);
    
    const container = screen.getByRole('button').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('shows lastRefreshedTime when showLastRefreshed is true', () => {
    const now = new Date();
    render(
      <RefreshButton 
        {...defaultProps} 
        showLastRefreshed={true} 
        lastRefreshedTime={now} 
      />
    );
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('does not show lastRefreshedTime when showLastRefreshed is false', () => {
    const now = new Date();
    render(
      <RefreshButton 
        {...defaultProps} 
        showLastRefreshed={false} 
        lastRefreshedTime={now} 
      />
    );
    
    expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
  });

  it('formats time correctly for just now', () => {
    const now = new Date();
    render(
      <RefreshButton 
        {...defaultProps} 
        showLastRefreshed={true} 
        lastRefreshedTime={now} 
      />
    );
    
    expect(screen.getByText(/just now/i)).toBeInTheDocument();
  });

  it('formats time correctly for minutes ago', () => {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    render(
      <RefreshButton 
        {...defaultProps} 
        showLastRefreshed={true} 
        lastRefreshedTime={fiveMinutesAgo} 
      />
    );
    
    expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument();
  });
}); 