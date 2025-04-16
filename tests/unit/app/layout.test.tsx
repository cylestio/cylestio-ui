import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import RootLayout from '@/layout'

// Mock the Sidebar component
jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>
  }
})

// Mock the Inter font
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}))

describe('RootLayout', () => {
  const renderLayout = () => {
    return render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    )
  }

  it('renders without crashing', () => {
    renderLayout()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('has main content area with proper classes', () => {
    renderLayout()
    const mainElement = screen.getByRole('main')
    expect(mainElement).toHaveClass('flex-1')
    expect(mainElement).toHaveClass('p-4') // Updated to match current implementation
  })
})
