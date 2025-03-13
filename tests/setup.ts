// Mock fetch API with a function that returns fallback data
global.fetch = jest.fn().mockImplementation(url => {
  if (url.includes('/api/metrics')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          totalRequests: 1254,
          avgResponseTime: 320,
          blockedRequests: 12,
          suspiciousRequests: 48,
        }),
    })
  }

  if (url.includes('/api/charts')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          callsPerMinute: [
            { minute: '00:00', calls: 10 },
            { minute: '00:01', calls: 15 },
          ],
          alertDistribution: [
            { name: 'High', value: 30 },
            { name: 'Medium', value: 50 },
            { name: 'Low', value: 20 },
          ],
          alertsOverTime: [
            { date: '2024-01-01', count: 5 },
            { date: '2024-01-02', count: 8 },
          ],
        }),
    })
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
})

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

// Add matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
