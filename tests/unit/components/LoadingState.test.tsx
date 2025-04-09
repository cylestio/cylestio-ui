import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoadingState from '@/components/LoadingState'

describe('LoadingState', () => {
  it('renders with default props', () => {
    render(<LoadingState />)
    const loadingText = screen.getByText('Loading data...')
    const spinner = screen.getByRole('status', { hidden: true })
    
    expect(loadingText).toBeInTheDocument()
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('displays custom message', () => {
    render(<LoadingState message="Custom loading message" />)
    expect(screen.getByText('Custom loading message')).toBeInTheDocument()
  })

  it('renders skeleton variant correctly', () => {
    render(<LoadingState variant="skeleton" contentType="data" />)
    
    // Should have at least one animated div
    const skeletonItems = document.querySelectorAll('.animate-pulse')
    expect(skeletonItems.length).toBeGreaterThan(0)
  })

  it('renders spinner variant correctly', () => {
    render(<LoadingState variant="spinner" />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders minimal variant correctly', () => {
    render(<LoadingState variant="minimal" />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('handles different content types', () => {
    const { rerender } = render(<LoadingState contentType="metrics" />)
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument()
    
    rerender(<LoadingState contentType="chart" />)
    expect(screen.getByText('Loading visualization...')).toBeInTheDocument()
    
    rerender(<LoadingState contentType="table" />)
    expect(screen.getByText('Loading table data...')).toBeInTheDocument()
  })

  it('renders without card when card=false', () => {
    render(<LoadingState card={false} />)
    const card = document.querySelector('.tremor-Card-root')
    expect(card).not.toBeInTheDocument()
  })

  it('respects showText=false prop', () => {
    render(<LoadingState showText={false} />)
    expect(screen.queryByText('Loading data...')).not.toBeInTheDocument()
  })
}) 