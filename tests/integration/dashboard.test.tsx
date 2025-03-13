import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Sidebar from '@/components/Sidebar'
import DashboardMetrics from '@/components/DashboardMetrics'
import DashboardCharts from '@/components/DashboardCharts'

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock

describe('Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard components without crashing', () => {
    render(
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <DashboardMetrics />
          <DashboardCharts />
        </main>
      </div>
    )

    // Verify basic structure is present
    expect(screen.getByText('Cylestio Monitor')).toBeInTheDocument()
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument()

    // Verify loading states are shown
    const skeletons = screen.getAllByTestId('metric-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
