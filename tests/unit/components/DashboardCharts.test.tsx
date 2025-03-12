import { render, screen, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardCharts from '../../../app/components/DashboardCharts'
import { ReactNode } from 'react'

// Mock fetch globally
global.fetch = jest.fn()

// Define types for the mock data
type ChartDataItem = {
  minute?: string
  calls?: number
  name?: string
  value?: number
  date?: string
  count?: number
  [key: string]: string | number | undefined
}

interface TremorProps {
  children?: ReactNode
  className?: string
  data?: ChartDataItem[]
  valueFormatter?: (value: number) => string
}

// Mock Tremor components
jest.mock('@tremor/react', () => ({
  Card: ({ children, className }: TremorProps) => (
    <div data-testid="tremor-card" className={className}>
      {children}
    </div>
  ),
  Title: ({ children }: TremorProps) => <h3 data-testid="tremor-title">{children}</h3>,
  AreaChart: ({ data, valueFormatter }: TremorProps) => (
    <div data-testid="tremor-area-chart">
      {data?.map((item, index) => (
        <div key={index}>
          {item.minute}: {valueFormatter?.(item.calls || 0)}
        </div>
      ))}
    </div>
  ),
  DonutChart: ({ data, valueFormatter }: TremorProps) => (
    <div data-testid="tremor-donut-chart">
      {data?.map((item, index) => (
        <div key={index}>
          {item.name}: {valueFormatter?.(item.value || 0)}
        </div>
      ))}
    </div>
  ),
  BarChart: ({ data, valueFormatter }: TremorProps) => (
    <div data-testid="tremor-bar-chart">
      {data?.map((item, index) => (
        <div key={index}>
          {item.date}: {valueFormatter?.(item.count || 0)}
        </div>
      ))}
    </div>
  ),
  Flex: ({ children, className }: TremorProps) => (
    <div data-testid="tremor-flex" className={className}>
      {children}
    </div>
  ),
}))

describe('DashboardCharts', () => {
  const mockChartData = {
    callsPerMinute: [
      { minute: '12:00', calls: 42 },
      { minute: '12:01', calls: 38 },
    ],
    alertDistribution: [
      { name: 'Info', value: 456 },
      { name: 'Warning', value: 48 },
      { name: 'Error', value: 12 },
    ],
    alertsOverTime: [
      { date: '2025-03-05', count: 6 },
      { date: '2025-03-06', count: 4 },
    ],
  }

  beforeEach(() => {
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders all chart components', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChartData,
    })

    render(<DashboardCharts />)

    await waitFor(() => {
      expect(screen.getByText('Calls Per Minute')).toBeInTheDocument()
      expect(screen.getByText('Alert Distribution')).toBeInTheDocument()
      expect(screen.getByText('Alerts Over Time')).toBeInTheDocument()
    })

    expect(screen.getByTestId('tremor-area-chart')).toBeInTheDocument()
    expect(screen.getByTestId('tremor-donut-chart')).toBeInTheDocument()
    expect(screen.getByTestId('tremor-bar-chart')).toBeInTheDocument()
  })

  it('formats values correctly', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChartData,
    })

    render(<DashboardCharts />)

    await waitFor(() => {
      // Check area chart formatting
      expect(screen.getByText('12:00: 42 calls')).toBeInTheDocument()
      // Check donut chart formatting
      expect(screen.getByText('Info: 456 events')).toBeInTheDocument()
      // Check bar chart formatting
      expect(screen.getByText('2025-03-05: 6 alerts')).toBeInTheDocument()
    })
  })

  it('updates data every 60 seconds', async () => {
    const firstData = { ...mockChartData }
    const secondData = {
      ...mockChartData,
      callsPerMinute: [
        { minute: '12:02', calls: 45 },
        { minute: '12:03', calls: 53 },
      ],
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondData,
      })

    render(<DashboardCharts />)

    // Wait for first render
    await waitFor(() => {
      expect(screen.getByText('12:00: 42 calls')).toBeInTheDocument()
    })

    // Fast-forward 60 seconds
    act(() => {
      jest.advanceTimersByTime(60000)
    })

    // Wait for update
    await waitFor(() => {
      expect(screen.getByText('12:02: 45 calls')).toBeInTheDocument()
      expect(screen.getByText('12:03: 53 calls')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<DashboardCharts />)

    // Should still show the fallback data
    await waitFor(() => {
      expect(screen.getByText('12:00: 42 calls')).toBeInTheDocument()
      expect(screen.getByText('Info: 456 events')).toBeInTheDocument()
      expect(screen.getByText('2025-03-05: 6 alerts')).toBeInTheDocument()
    })
  })
})
