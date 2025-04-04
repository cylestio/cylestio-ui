import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import EmptyState from '@/components/EmptyState'

describe('EmptyState', () => {
  it('renders with default props', () => {
    render(<EmptyState />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
    expect(screen.getByText('There is no data to display right now.')).toBeInTheDocument()
    
    // Should have an icon
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('displays custom title and description', () => {
    render(
      <EmptyState 
        title="Custom Empty Title" 
        description="Custom empty state description"
      />
    )
    expect(screen.getByText('Custom Empty Title')).toBeInTheDocument()
    expect(screen.getByText('Custom empty state description')).toBeInTheDocument()
  })

  it('handles action button click', () => {
    const handleAction = jest.fn()
    render(
      <EmptyState 
        actionText="Add Item"
        onAction={handleAction}
      />
    )
    
    const button = screen.getByText('Add Item')
    fireEvent.click(button)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('handles secondary action button click', () => {
    const handleSecondaryAction = jest.fn()
    render(
      <EmptyState 
        secondaryActionText="Refresh"
        onSecondaryAction={handleSecondaryAction}
      />
    )
    
    const button = screen.getByText('Refresh')
    fireEvent.click(button)
    expect(handleSecondaryAction).toHaveBeenCalledTimes(1)
  })

  it('renders different content types correctly', () => {
    const { rerender } = render(<EmptyState contentType="chart" />)
    expect(screen.getByText('No chart data available')).toBeInTheDocument()
    
    rerender(<EmptyState contentType="metrics" />)
    expect(screen.getByText('No metrics available')).toBeInTheDocument()
    
    rerender(<EmptyState contentType="table" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders without card when card=false', () => {
    render(<EmptyState card={false} />)
    const card = document.querySelector('.tremor-Card-root')
    expect(card).not.toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <EmptyState>
        <div data-testid="child-content">Custom child content</div>
      </EmptyState>
    )
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Custom child content')).toBeInTheDocument()
  })

  it('uses different icon sizes', () => {
    const { rerender } = render(<EmptyState iconSize="lg" />)
    let icon = document.querySelector('.h-16')
    expect(icon).toBeInTheDocument()
    
    rerender(<EmptyState iconSize="md" />)
    icon = document.querySelector('.h-12')
    expect(icon).toBeInTheDocument()
    
    rerender(<EmptyState iconSize="sm" />)
    icon = document.querySelector('.h-8')
    expect(icon).toBeInTheDocument()
  })
}) 