// Mock fetch API
global.fetch = jest.fn()

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
