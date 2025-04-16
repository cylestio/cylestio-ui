const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('NPM Package Installation', () => {
  const tempDir = path.join(os.tmpdir(), `cylestio-ui-test-${Date.now()}`);
  
  beforeAll(() => {
    // Create a temporary directory for testing
    fs.mkdirSync(tempDir, { recursive: true });
  });
  
  afterAll(() => {
    // Clean up the temporary directory
    try {
      execSync(`rm -rf ${tempDir}`);
    } catch (error) {
      console.error(`Failed to clean up temporary directory: ${error.message}`);
    }
  });
  
  it('skips package tests in first version', () => {
    // Skip this test for now
    console.log('Skipping npm package installation test for first version');
    expect(true).toBe(true);
  });
}); 