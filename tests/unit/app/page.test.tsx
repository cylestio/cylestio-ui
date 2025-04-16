import React from 'react'
import { render } from '@testing-library/react'
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

// Mock Date to avoid Date.now issues
jest.spyOn(global.Date, 'now').mockImplementation(() => 1647079200000)

describe('Home Page', () => {
  it('renders without crashing', () => {
    // Basic test that just ensures the component renders without errors
    expect(() => render(<Home />)).not.toThrow()
  })
})
