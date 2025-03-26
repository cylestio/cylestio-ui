import type { Config } from 'jest'
import nextJest from 'next/jest'

// Empty export to satisfy TypeScript
const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  // Set reasonable coverage thresholds
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
  // Match test files
  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  testTimeout: 10000,
  // Include test roots
  roots: ['<rootDir>/tests/'],
}

export default createJestConfig(customJestConfig)
