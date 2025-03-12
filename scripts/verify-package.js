#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(process.cwd(), 'dist');
const PACKAGE_JSON = path.join(process.cwd(), 'package.json');
const EXPECTED_EXPORTS = [
  'Sidebar', 
  'DashboardCharts', 
  'DashboardMetrics', 
  'LoadingSpinner',
  'RootLayout',
  'HomePage',
  'AlertsPage',
  'EventsPage',
  'AnalyticsPage',
  'SettingsPage'
];

console.log('🔍 Verifying package structure...');

// Check if build files exist
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ dist/ directory does not exist. Run "npm run build:package" first.');
  process.exit(1);
}

// Verify package.json
if (!fs.existsSync(PACKAGE_JSON)) {
  console.error('❌ package.json does not exist.');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));

// Check essential package.json fields
const requiredFields = ['name', 'version', 'main', 'types', 'files'];
for (const field of requiredFields) {
  if (!packageJson[field]) {
    console.error(`❌ package.json is missing required field: ${field}`);
    process.exit(1);
  }
}

// Check if index files exist
const indexFile = path.join(DIST_DIR, 'index.js');
const typesFile = path.join(DIST_DIR, 'index.d.ts');

if (!fs.existsSync(indexFile)) {
  console.error('❌ dist/index.js does not exist.');
  process.exit(1);
}

if (!fs.existsSync(typesFile)) {
  console.error('❌ dist/index.d.ts does not exist.');
  process.exit(1);
}

// Check exports in index.d.ts
const typesContent = fs.readFileSync(typesFile, 'utf8');
let missingExports = [];

for (const component of EXPECTED_EXPORTS) {
  if (!typesContent.includes(`export const ${component}:`)) {
    missingExports.push(component);
  }
}

if (missingExports.length > 0) {
  console.error(`❌ Missing exports in index.d.ts: ${missingExports.join(', ')}`);
  process.exit(1);
}

// Create a dry run of npm pack to inspect contents
console.log('📦 Creating a dry run of npm pack...');
try {
  execSync('npm pack --dry-run', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ npm pack dry run failed:', error.message);
  process.exit(1);
}

console.log('✅ Package structure verification completed successfully.'); 