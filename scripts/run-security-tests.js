#!/usr/bin/env node

/**
 * Manual test runner for security components
 * 
 * This script allows running the security component tests even when tests are
 * disabled in the main package.json.
 * 
 * Usage:
 *   node scripts/run-security-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.blue}===============================`);
console.log(`${colors.blue}Security Component Tests`);
console.log(`${colors.blue}===============================`);

try {
  console.log(`${colors.cyan}Running Jest on security component tests...${colors.reset}`);
  
  // Run Jest directly on the security test files
  const output = execSync(
    'npx jest tests/unit/app/security --coverage --passWithNoTests',
    { stdio: 'pipe' }
  ).toString();
  
  console.log(output);
  console.log(`${colors.green}✅ Security tests completed successfully!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error running security tests:${colors.reset}`);
  console.error(error.stdout ? error.stdout.toString() : error);
  process.exit(1);
}

// Make the script executable
try {
  if (process.platform !== 'win32') {
    execSync('chmod +x scripts/run-security-tests.js');
  }
} catch (error) {
  // Ignore permission errors
} 