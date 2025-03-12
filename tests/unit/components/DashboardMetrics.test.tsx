import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardMetrics from '../../../app/components/DashboardMetrics'

describe('DashboardMetrics Component', () => {
  const mockMetricsData = [
    { title: 'Total Agents', value: '47', change: 12, changeType: 'increase' },
    { title: 'Active Sessions', value: '153', change: 8, changeType: 'increase' },
    { title: 'Alerts', value: '3', change: 2, changeType: 'decrease' },
    { title: 'Avg. Response Time', value: '245ms', change: 18, changeType: 'decrease' },
  ]

  it('renders all metrics cards correctly', () => {
    render(<DashboardMetrics data={mockMetricsData} />)
    
    // Check if all metric titles are rendered
    expect(screen.getByText('Total Agents')).toBeInTheDocument()
    expect(screen.getByText('Active Sessions')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Avg. Response Time')).toBeInTheDocument()
    
    // Check if all metric values are rendered
    expect(screen.getByText('47')).toBeInTheDocument()
    expect(screen.getByText('153')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('245ms')).toBeInTheDocument()
  })

  it('displays the correct change indicators', () => {
    render(<DashboardMetrics data={mockMetricsData} />)
    
    // Check for increase indicators
    const increaseElements = screen.getAllByText(/\+\d+%/);
    expect(increaseElements).toHaveLength(2);
    expect(increaseElements[0]).toHaveTextContent('+12%');
    expect(increaseElements[1]).toHaveTextContent('+8%');
    
    // Check for decrease indicators
    const decreaseElements = screen.getAllByText(/\-\d+%/);
    expect(decreaseElements).toHaveLength(2);
    expect(decreaseElements[0]).toHaveTextContent('-2%');
    expect(decreaseElements[1]).toHaveTextContent('-18%');
  })

  it('shows loading state when isLoading=true', () => {
    render(<DashboardMetrics isLoading={true} />)
    
    // Check for loading skeletons
    const skeletons = screen.getAllByTestId('metric-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  })

  it('applies custom className and cardClassName', () => {
    const { container } = render(
      <DashboardMetrics 
        data={mockMetricsData} 
        className="custom-container-class"
        cardClassName="custom-card-class"
      />
    );
    
    // Check container class
    expect(container.firstChild).toHaveClass('custom-container-class');
    
    // Check card classes
    const cards = container.querySelectorAll('.custom-card-class');
    expect(cards.length).toBe(mockMetricsData.length);
  })

  it('renders empty state when no data is provided', () => {
    render(<DashboardMetrics />)
    
    const emptyStateMessage = screen.getByText(/No metrics available/i);
    expect(emptyStateMessage).toBeInTheDocument();
  })
})
