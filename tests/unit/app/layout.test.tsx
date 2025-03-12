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

  it('renders the sidebar', () => {
    renderLayout()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders children content', () => {
    renderLayout()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('applies Inter font class', () => {
    const { container } = renderLayout()
    const bodyElement = container.querySelector('body')
    expect(bodyElement).toHaveClass('inter-font')
  })

  it('renders with correct layout structure', () => {
    renderLayout()
    const mainElement = screen.getByRole('main')
    expect(mainElement).toHaveClass('flex-1', 'p-6')
  })
})
