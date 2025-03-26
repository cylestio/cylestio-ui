import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingState } from '@/components/ui/loading-state';

describe('LoadingState', () => {
  it('renders the loading spinner with default props', () => {
    render(<LoadingState />);
    const spinnerElement = screen.getByRole('status');
    expect(spinnerElement).toBeInTheDocument();
    expect(spinnerElement).toHaveClass('animate-spin');
    expect(spinnerElement).toHaveClass('h-8', 'w-8'); // Medium size by default
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<LoadingState size="small" />);
    const spinnerElement = screen.getByRole('status');
    expect(spinnerElement).toHaveClass('h-4', 'w-4');
  });

  it('renders with large size', () => {
    render(<LoadingState size="large" />);
    const spinnerElement = screen.getByRole('status');
    expect(spinnerElement).toHaveClass('h-12', 'w-12');
  });

  it('renders with custom message', () => {
    const message = 'Loading data...';
    render(<LoadingState message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders as fullscreen variant', () => {
    render(<LoadingState variant="fullscreen" />);
    const container = screen.getByRole('status').closest('div');
    expect(container).toHaveClass('fixed', 'inset-0', 'z-50');
  });

  it('renders as inline variant', () => {
    render(<LoadingState variant="inline" />);
    const container = screen.getByRole('status').closest('div');
    expect(container).toHaveClass('flex', 'h-40');
  });

  it('applies custom className', () => {
    render(<LoadingState className="custom-class" />);
    const container = screen.getByRole('status').closest('div');
    expect(container).toHaveClass('custom-class');
  });
}); 