const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('NPM Package Installation', () => {
  const tempDir = path.join(os.tmpdir(), `cylestio-ui-test-${Date.now()}`);
  
  beforeAll(() => {
    // Create a temporary directory for testing
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Create package.json in the temp directory
    const packageJson = {
      name: 'cylestio-ui-test',
      version: '1.0.0',
      private: true,
      dependencies: {}
    };
    
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create a simple test file
    const testFile = `
      import { Sidebar, DashboardMetrics } from '@cylestio/ui-dashboard';
      
      // Basic test to ensure components can be imported
      console.log('Components imported successfully:', 
        typeof Sidebar === 'function', 
        typeof DashboardMetrics === 'function'
      );
    `;
    
    fs.writeFileSync(
      path.join(tempDir, 'test.js'),
      testFile
    );
  });
  
  afterAll(() => {
    // Clean up the temporary directory
    try {
      execSync(`rm -rf ${tempDir}`);
    } catch (error) {
      console.error(`Failed to clean up temporary directory: ${error.message}`);
    }
  });
  
  it('can be packaged and installed locally', () => {
    // Skip this test in CI environment
    if (process.env.CI) {
      console.log('Skipping npm package installation test in CI environment');
      return;
    }
    
    try {
      // Create a tarball of the package
      console.log('Creating package tarball...');
      const packOutput = execSync('npm pack', { encoding: 'utf8' });
      const tarballName = packOutput.trim().split('\n').pop();
      
      // Move the tarball to the temp directory
      execSync(`mv ${tarballName} ${tempDir}/`);
      
      // Install the tarball in the temp directory
      console.log('Installing package from tarball...');
      execSync(`cd ${tempDir} && npm install ./${tarballName}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Verify the package was installed
      const nodeModulesDir = path.join(tempDir, 'node_modules', '@cylestio', 'ui-dashboard');
      expect(fs.existsSync(nodeModulesDir)).toBe(true);
      
      // Verify the package exports the expected components
      const packageIndexFile = path.join(nodeModulesDir, 'dist', 'index.js');
      expect(fs.existsSync(packageIndexFile)).toBe(true);
      
      // Try importing the components (this requires a transpiler setup, so we're just checking file existence)
      console.log('Verification complete. Package can be installed correctly.');
    } catch (error) {
      console.error('Package installation test failed:', error.message);
      throw error;
    }
  });
}); 