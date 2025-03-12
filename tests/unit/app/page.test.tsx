import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/page'

// Mock the components
jest.mock('@/components/DashboardMetrics', () => {
  return function MockDashboardMetrics() {
    return <div data-testid="dashboard-metrics">DashboardMetrics</div>
  }
})

jest.mock('@/components/DashboardCharts', () => {
  return function MockDashboardCharts() {
    return <div data-testid="dashboard-charts">DashboardCharts</div>
  }
})

jest.mock('@/components/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>
  }
})

// Mock React.Suspense
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  Suspense: ({ fallback }) => fallback,
}))

describe('Home Page', () => {
  beforeEach(() => {
    // Mock Date.toLocaleString() to return a fixed date
    const mockDate = new Date('2024-03-12T12:00:00')
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the dashboard title', () => {
    render(<Home />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders the last updated time', () => {
    render(<Home />)
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    expect(screen.getByText(/3\/12\/2024, 12:00:00 PM/)).toBeInTheDocument()
  })

  it('renders LoadingSpinner for metrics section', () => {
    render(<Home />)
    const spinners = screen.getAllByTestId('loading-spinner')
    expect(spinners.length).toBeGreaterThanOrEqual(1)
  })

  it('renders LoadingSpinner for charts section', () => {
    render(<Home />)
    const spinners = screen.getAllByTestId('loading-spinner')
    expect(spinners.length).toBeGreaterThanOrEqual(1)
  })

  it('renders LoadingSpinner components within Suspense boundaries', () => {
    render(<Home />)
    const spinners = screen.getAllByTestId('loading-spinner')
    expect(spinners).toHaveLength(2)
  })
})
