import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorMessage from '@/components/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders with minimum required props', () => {
    render(<ErrorMessage message="Test error message" />)
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByText('Error')).toHaveClass('text-lg') // Title styling check
    
    // Should have an icon
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('displays custom title', () => {
    render(<ErrorMessage message="Error occurred" title="Custom Error Title" />)
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument()
  })

  it('displays technical details when provided', () => {
    render(
      <ErrorMessage 
        message="Unable to fetch data" 
        details="HTTP Error 500: Internal Server Error"
      />
    )
    
    expect(screen.getByText('HTTP Error 500: Internal Server Error')).toBeInTheDocument()
  })

  it('handles retry button click', () => {
    const handleRetry = jest.fn()
    render(
      <ErrorMessage 
        message="Failed to load"
        retryText="Try Again"
        onRetry={handleRetry}
      />
    )
    
    const button = screen.getByText('Try Again')
    fireEvent.click(button)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('handles alternative action button click', () => {
    const handleAlternativeAction = jest.fn()
    render(
      <ErrorMessage 
        message="Connection failed"
        alternativeActionText="Go Back"
        onAlternativeAction={handleAlternativeAction}
      />
    )
    
    const button = screen.getByText('Go Back')
    fireEvent.click(button)
    expect(handleAlternativeAction).toHaveBeenCalledTimes(1)
  })

  it('renders different severity levels correctly', () => {
    const { rerender } = render(<ErrorMessage message="Test" severity="critical" />)
    expect(screen.getByText('Critical Error')).toBeInTheDocument()
    
    rerender(<ErrorMessage message="Test" severity="warning" />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
    
    rerender(<ErrorMessage message="Test" severity="info" />)
    expect(screen.getByText('Information')).toBeInTheDocument()
  })

  it('renders without card when card=false', () => {
    render(<ErrorMessage message="Test error" card={false} />)
    const card = document.querySelector('.tremor-Card-root')
    expect(card).not.toBeInTheDocument()
  })

  it('shows severity badge when showBadge is true', () => {
    render(<ErrorMessage message="Test error" severity="warning" showBadge={true} />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('does not show severity badge when showBadge is false', () => {
    render(<ErrorMessage message="Test error" severity="warning" showBadge={false} />)
    
    // The title should be there, but not an additional badge with the text
    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getAllByText('Warning').length).toBe(1)
  })

  it('handles dismiss button click when dismissible', () => {
    const handleDismiss = jest.fn()
    render(
      <ErrorMessage 
        message="Dismissible error"
        dismissible={true}
        onDismiss={handleDismiss}
      />
    )
    
    const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
    fireEvent.click(dismissButton)
    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders help link when provided', () => {
    render(
      <ErrorMessage 
        message="Error with help"
        helpLink="https://help.example.com"
      />
    )
    
    const helpLink = screen.getByText('Help documentation')
    expect(helpLink).toBeInTheDocument()
    expect(helpLink.closest('a')).toHaveAttribute('href', 'https://help.example.com')
  })
}) 