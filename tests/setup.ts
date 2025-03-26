// Setup file for Jest tests
// Import jest-dom additions to extend Jest matchers
import '@testing-library/jest-dom';

// Setup any global mocks or configurations needed for testing
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for API tests
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock window URL methods if needed
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

// Export empty object to satisfy TypeScript
export {};
