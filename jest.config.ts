import type { Config } from 'jest'
import nextJest from 'next/jest'

// Empty export to satisfy TypeScript
const createJestConfig = nextJest({
  dir: './',
})

// Jest configuration
const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  // Reasonable coverage thresholds
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 60,
      functions: 60,
      lines: 60,
    },
  },
  // Normal test matching
  testMatch: ['<rootDir>/**/*.test.{js,jsx,ts,tsx}'],
  // Standard ignores
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/'
  ],
  testTimeout: 10000,
  // Run tests from standard locations
  roots: [
    '<rootDir>/tests'
  ],
}

export default createJestConfig(customJestConfig)
