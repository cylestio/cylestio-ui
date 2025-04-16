// Setup file for Jest tests
import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend({
  // Add any custom matchers here
});

// Silence console warnings and errors during tests
// Comment these out if you want to see them during testing
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Empty export to satisfy TypeScript
export {}
