import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Sidebar from '../../app/components/Sidebar'
import DashboardMetrics, { MetricsData } from '../../app/components/DashboardMetrics'
import DashboardCharts, { ChartData } from '../../app/components/DashboardCharts'

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}))

describe('Dashboard Integration', () => {
  const mockMetricsData: MetricsData[] = [
    { title: 'Total Agents', value: '47', change: 12, changeType: 'increase' as const },
    { title: 'Active Sessions', value: '153', change: 8, changeType: 'increase' as const },
  ]

  const mockChartsData: ChartData[] = [
    {
      id: 'agent-activity',
      title: 'Agent Activity (24h)',
      type: 'area' as const,
      data: [
        { time: '00:00', value: 10 },
        { time: '12:00', value: 30 },
      ],
      categories: ['time', 'value']
    },
  ]

  it('renders a complete dashboard with sidebar and metrics', () => {
    // Create a container dashboard layout with actual components
    render(
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <DashboardMetrics data={mockMetricsData} />
        </main>
      </div>
    )

    // Check sidebar elements
    expect(screen.getByText('Cylestio Monitor')).toBeInTheDocument()
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument()

    // Check metrics elements
    expect(screen.getByText('Total Agents')).toBeInTheDocument()
    expect(screen.getByText('47')).toBeInTheDocument()
    expect(screen.getByText('Active Sessions')).toBeInTheDocument()
  })

  it('renders charts and metrics together', () => {
    render(
      <div className="space-y-6">
        <DashboardMetrics data={mockMetricsData} />
        <DashboardCharts data={mockChartsData} />
      </div>
    )

    // Check metrics content
    expect(screen.getByText('Total Agents')).toBeInTheDocument()
    expect(screen.getByText('47')).toBeInTheDocument()

    // Check chart content
    expect(screen.getByText('Agent Activity (24h)')).toBeInTheDocument()
  })

  it('handles loading states correctly', () => {
    render(
      <div className="space-y-6">
        <DashboardMetrics isLoading={true} />
        <DashboardCharts isLoading={true} />
      </div>
    )

    // Check for loading states
    const skeletons = screen.getAllByTestId('metric-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
