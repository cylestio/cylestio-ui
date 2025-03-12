import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoadingSpinner from '@/components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders the loading spinner', () => {
    render(<LoadingSpinner />)
    const spinnerElement = screen.getByRole('status', { hidden: true })
    expect(spinnerElement).toBeInTheDocument()
    expect(spinnerElement).toHaveClass('animate-spin')
  })

  it('has the correct styling', () => {
    render(<LoadingSpinner />)
    const container = screen.getByRole('status', { hidden: true }).parentElement
    expect(container).toHaveClass('flex', 'justify-center', 'items-center', 'h-40')
  })
})
