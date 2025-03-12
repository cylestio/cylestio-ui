import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import Sidebar from '@/components/Sidebar'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

interface LinkProps {
  children: ReactNode
  href: string
  className?: string
  'data-testid'?: string
}

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = function Link({ children, href, className, 'data-testid': testId }: LinkProps) {
    return (
      <a href={href} className={className} data-testid={testId}>
        {children}
      </a>
    )
  }
  MockLink.displayName = 'Link'
  return MockLink
})

describe('Sidebar', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    ;(usePathname as jest.Mock).mockReturnValue('/')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the title', () => {
    render(<Sidebar />)
    expect(screen.getByText('Cylestio Monitor')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights the active navigation item', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/events')
    render(<Sidebar />)

    const eventsLink = screen.getByTestId('nav-events')
    const dashboardLink = screen.getByTestId('nav-dashboard')

    expect(eventsLink).toHaveClass('text-blue-700', 'bg-blue-50')
    expect(dashboardLink).toHaveClass('text-gray-600')
  })

  it('shows the database connection status', () => {
    render(<Sidebar />)
    expect(screen.getByText('Connected to DB')).toBeInTheDocument()
  })

  it('updates time every second', () => {
    jest.setSystemTime(new Date('2024-03-12T12:00:00'))
    render(<Sidebar />)

    expect(screen.getByText(/Last updated: 12:00:00/)).toBeInTheDocument()

    // Advance time by 1 second
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(screen.getByText(/Last updated: 12:00:01/)).toBeInTheDocument()

    // Advance time by another second
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(screen.getByText(/Last updated: 12:00:02/)).toBeInTheDocument()
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval')
    const { unmount } = render(<Sidebar />)

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('renders navigation links with correct hrefs', () => {
    render(<Sidebar />)

    expect(screen.getByTestId('nav-dashboard')).toHaveAttribute('href', '/')
    expect(screen.getByTestId('nav-events')).toHaveAttribute('href', '/events')
    expect(screen.getByTestId('nav-alerts')).toHaveAttribute('href', '/alerts')
    expect(screen.getByTestId('nav-analytics')).toHaveAttribute('href', '/analytics')
    expect(screen.getByTestId('nav-settings')).toHaveAttribute('href', '/settings')
  })
})
