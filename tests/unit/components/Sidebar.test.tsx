import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '../../../app/components/Sidebar';
import { HomeIcon, ChartBarIcon } from '@heroicons/react/24/outline';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

// Define props type to match the component
type SidebarProps = React.ComponentProps<typeof Sidebar>;

describe('Sidebar Component', () => {
  it('renders correctly with default props', () => {
    render(<Sidebar />);
    
    // Check if logo is present
    expect(screen.getByAltText('Cylestio Logo')).toBeInTheDocument();
    
    // Check if title is rendered
    expect(screen.getByText('Cylestio Monitor')).toBeInTheDocument();
    
    // Check if navigation items are rendered
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-events')).toBeInTheDocument();
    expect(screen.getByTestId('nav-alerts')).toBeInTheDocument();
    expect(screen.getByTestId('nav-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('nav-settings')).toBeInTheDocument();
  });

  it('renders custom navigation items', () => {
    const customNavigation: SidebarProps['navigation'] = [
      { name: 'Home', href: '/', icon: HomeIcon },
      { name: 'Custom', href: '/custom', icon: ChartBarIcon },
    ];

    render(<Sidebar navigation={customNavigation} />);
    
    // Check if custom items are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    
    // Check that default items are not rendered
    expect(screen.queryByText('Events')).not.toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<Sidebar title="Custom Dashboard" />);
    
    expect(screen.getByText('Custom Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Cylestio Monitor')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Sidebar className="custom-sidebar-class" />);
    
    const sidebarElement = container.firstChild;
    expect(sidebarElement).toHaveClass('custom-sidebar-class');
  });
});
