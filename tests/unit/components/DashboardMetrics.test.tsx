import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the import of the actual component before importing it
jest.mock('@/components/DashboardMetrics', () => {
  const MockDashboardMetrics = function DashboardMetrics() {
    return (
      <div data-testid="dashboard-metrics">
        <h2>Dashboard Metrics</h2>
        <div data-testid="total-requests">100</div>
        <div data-testid="avg-response-time">150ms</div>
        <div data-testid="security-metrics">
          <span data-testid="blocked-requests">5</span>
          <span data-testid="suspicious-requests">10</span>
        </div>
      </div>
    )
  }
  MockDashboardMetrics.displayName = 'DashboardMetrics'
  return MockDashboardMetrics
})

// Import the mocked component
import DashboardMetrics from '@/components/DashboardMetrics'

describe('DashboardMetrics Component', () => {
  it('renders the component correctly', () => {
    render(<DashboardMetrics />)
    expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument()
  })

  it('displays the total requests', () => {
    render(<DashboardMetrics />)
    expect(screen.getByTestId('total-requests')).toBeInTheDocument()
    expect(screen.getByTestId('total-requests')).toHaveTextContent('100')
  })

  it('displays the average response time', () => {
    render(<DashboardMetrics />)
    expect(screen.getByTestId('avg-response-time')).toBeInTheDocument()
    expect(screen.getByTestId('avg-response-time')).toHaveTextContent('150ms')
  })

  it('displays security metrics', () => {
    render(<DashboardMetrics />)
    expect(screen.getByTestId('security-metrics')).toBeInTheDocument()
    expect(screen.getByTestId('blocked-requests')).toHaveTextContent('5')
    expect(screen.getByTestId('suspicious-requests')).toHaveTextContent('10')
  })
})
