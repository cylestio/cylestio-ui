#!/usr/bin/env node

/**
 * API Debugging Tool
 * 
 * This script performs a comprehensive diagnosis of API connectivity
 * and helps identify common issues when connecting to the real API.
 * 
 * Usage:
 *   node scripts/api-debug.js [host] [port]
 * 
 * Example:
 *   node scripts/api-debug.js localhost 8000
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Get command line arguments or use defaults
const host = process.argv[2] || 'localhost';
const port = process.argv[3] || '8000';
const apiBaseUrl = `http://${host}:${port}`;
const apiVersion = '/api/v1';
const fullBaseUrl = `${apiBaseUrl}${apiVersion}`;

console.log('\n=== Cylestio API Debug Tool ===\n');
console.log(`Testing API connection to: ${fullBaseUrl}\n`);

// Key endpoints to test
const endpoints = [
  { path: '/', name: 'Root Endpoint', required: true },
  { path: '/status', name: 'Status Endpoint', required: true },
  { path: '/agents', name: 'Agents List', required: true },
  { path: '/events', name: 'Events List', required: true },
  { path: '/alerts', name: 'Alerts List', required: true },
  { path: '/dashboard', name: 'Dashboard Data', required: false },
  { path: '/metrics', name: 'Metrics', required: false },
  { path: '/metrics/security', name: 'Security Metrics', required: false }
];

// Test API version and authentication endpoints separately
async function testApiInfo() {
  console.log('--- Testing API Server Info ---');
  
  try {
    // Test root endpoint to get API version
    const response = await fetch(`${apiBaseUrl}/`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API Server accessible at ${apiBaseUrl}`);
      console.log(`   Version: ${data.version || 'unknown'}`);
      console.log(`   Status: ${data.status || 'unknown'}`);
      
      if (data.version) {
        console.log(`\n🔍 API Version: ${data.version}`);
      }
      
      return true;
    } else {
      console.log(`❌ API Server not accessible at ${apiBaseUrl}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Failed to connect to API server: ${error.message}`);
    console.log('   Check if the API server is running and accessible');
    return false;
  }
}

// Test a single endpoint and return results
async function testEndpoint(endpoint) {
  const url = `${fullBaseUrl}${endpoint.path}`;
  console.log(`\nTesting ${endpoint.name} (${url})`);
  
  try {
    const response = await fetch(url);
    const status = response.status;
    
    console.log(`Status: ${status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response Structure:');
      
      // Pretty print the first level of keys
      const keys = Object.keys(data);
      console.log(`{`);
      keys.forEach(key => {
        const value = data[key];
        let displayValue;
        
        if (Array.isArray(value)) {
          displayValue = `Array(${value.length})`;
          if (value.length > 0) {
            displayValue += ` [${typeof value[0]}]`;
          }
        } else if (value === null) {
          displayValue = 'null';
        } else if (typeof value === 'object') {
          displayValue = `Object {${Object.keys(value).join(', ')}}`;
        } else {
          displayValue = typeof value === 'string' 
            ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"` 
            : value;
        }
        
        console.log(`  ${key}: ${displayValue}`);
      });
      console.log(`}`);
      
      // If the response contains an 'items' array, show more details
      if (data.items && Array.isArray(data.items)) {
        console.log(`\nItems Count: ${data.items.length}`);
        
        if (data.items.length > 0) {
          console.log('First Item Structure:');
          const firstItem = data.items[0];
          console.log(`{`);
          Object.keys(firstItem).forEach(key => {
            const value = firstItem[key];
            let displayValue;
            
            if (Array.isArray(value)) {
              displayValue = `Array(${value.length})`;
            } else if (value === null) {
              displayValue = 'null';
            } else if (typeof value === 'object') {
              displayValue = `Object {${Object.keys(value).join(', ')}}`;
            } else {
              displayValue = typeof value === 'string' 
                ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"` 
                : value;
            }
            
            console.log(`  ${key}: ${displayValue}`);
          });
          console.log(`}`);
        }
      }
      
      return { success: true, status, data };
    } else {
      // Try to parse error response
      try {
        const errorData = await response.json();
        console.log('Error Response:', errorData);
      } catch (e) {
        console.log('Could not parse error response body');
      }
      
      return { success: false, status, error: response.statusText };
    }
  } catch (error) {
    console.error(`Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Check the environment configuration
function checkEnvironmentConfig() {
  console.log('\n--- Checking Environment Configuration ---');
  
  // Check .env.development
  const envPath = path.join(process.cwd(), '.env.development');
  
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('Found .env.development file');
      
      // Check API_BASE_URL
      const apiBaseUrlMatch = envContent.match(/API_BASE_URL=(.+)/);
      if (apiBaseUrlMatch) {
        const configuredUrl = apiBaseUrlMatch[1].trim();
        console.log(`API_BASE_URL = ${configuredUrl}`);
        
        if (configuredUrl !== apiBaseUrl) {
          console.log(`⚠️ Warning: Configured URL (${configuredUrl}) doesn't match tested URL (${apiBaseUrl})`);
        } else {
          console.log('✅ API_BASE_URL matches tested URL');
        }
      } else {
        console.log('❌ API_BASE_URL not found in .env.development');
      }
      
      // Check NEXT_PUBLIC_USE_MOCK_API
      const useMockMatch = envContent.match(/NEXT_PUBLIC_USE_MOCK_API=(.+)/);
      if (useMockMatch) {
        const useMock = useMockMatch[1].trim();
        console.log(`NEXT_PUBLIC_USE_MOCK_API = ${useMock}`);
        
        if (useMock === 'true') {
          console.log('⚠️ Warning: Mock API is enabled, set to false to use the real API');
        } else {
          console.log('✅ Mock API is disabled');
        }
      } else {
        console.log('❌ NEXT_PUBLIC_USE_MOCK_API not found in .env.development');
      }
    } else {
      console.log('❌ .env.development file not found');
    }
  } catch (error) {
    console.error(`Error reading environment file: ${error.message}`);
  }
}

// Test all endpoints in sequence
async function testAllEndpoints() {
  console.log('\n--- Testing API Endpoints ---');
  
  let results = {};
  let requiredEndpointsWorking = true;
  
  for (const endpoint of endpoints) {
    results[endpoint.path] = await testEndpoint(endpoint);
    
    // Track if required endpoints are working
    if (endpoint.required && !results[endpoint.path].success) {
      requiredEndpointsWorking = false;
    }
  }
  
  console.log('\n=== SUMMARY ===');
  for (const [path, result] of Object.entries(results)) {
    const endpoint = endpoints.find(e => e.path === path);
    const requiredLabel = endpoint.required ? '[REQUIRED]' : '[OPTIONAL]';
    const status = result.success ? '✅ Success' : '❌ Failed';
    console.log(`${status}: ${path} ${result.status || ''} ${requiredLabel}`);
  }
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const requiredCount = endpoints.filter(e => e.required).length;
  const requiredSuccessCount = Object.entries(results)
    .filter(([path]) => endpoints.find(e => e.path === path).required)
    .filter(([_, result]) => result.success)
    .length;
  
  console.log(`\n${successCount}/${endpoints.length} endpoints working`);
  console.log(`${requiredSuccessCount}/${requiredCount} required endpoints working`);
  
  return {
    results,
    allSuccess: successCount === endpoints.length,
    requiredSuccess: requiredEndpointsWorking
  };
}

// Check if the port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -i :${port}`, (error, stdout, stderr) => {
      if (error) {
        // No process found using the port
        resolve({ inUse: false });
        return;
      }
      
      if (stdout) {
        // Process(es) found using the port
        resolve({ inUse: true, details: stdout });
      } else {
        resolve({ inUse: false });
      }
    });
  });
}

// Check for common issues
async function checkForCommonIssues() {
  console.log('\n--- Checking for Common Issues ---');
  
  // Check if API port is in use
  const portStatus = await checkPort(port);
  if (portStatus.inUse) {
    console.log(`✅ Port ${port} is in use (expected for API server)`);
  } else {
    console.log(`❌ Port ${port} is not in use - API server might not be running`);
    console.log(`   Start your API server before connecting to it`);
  }
  
  // Check if network connections are blocked
  try {
    const response = await fetch('https://www.google.com');
    if (response.ok) {
      console.log('✅ Internet connection is working');
    } else {
      console.log('⚠️ Internet connection check failed');
    }
  } catch (error) {
    console.log('❌ Internet connection check failed - network may be restricted');
  }
}

// Print recommendations based on test results
function printRecommendations(apiInfo, endpointTests) {
  console.log('\n=== RECOMMENDATIONS ===');
  
  if (!apiInfo) {
    console.log('❌ Cannot connect to API server. Please check:');
    console.log('1. Is the API server running?');
    console.log(`2. Is it listening on ${host}:${port}?`);
    console.log('3. Are there any firewall rules blocking the connection?');
    console.log('4. Try running: curl ' + apiBaseUrl);
    return;
  }
  
  if (!endpointTests.requiredSuccess) {
    console.log('❌ Required API endpoints are not working. Please check:');
    console.log('1. Does the API server implement all required endpoints?');
    console.log('2. Are the endpoint paths correct? They should be available at:');
    
    endpoints
      .filter(e => e.required)
      .forEach(e => console.log(`   - ${fullBaseUrl}${e.path}`));
    
    console.log('3. Check API server logs for errors');
    return;
  }
  
  if (!endpointTests.allSuccess) {
    console.log('⚠️ Some optional endpoints are not working. The app may still function,');
    console.log('   but some features might be limited. Consider implementing missing endpoints.');
  } else {
    console.log('✅ All API endpoints are working properly!');
  }
  
  console.log('\nNext steps:');
  console.log('1. Update .env.development with correct settings:');
  console.log(`   API_BASE_URL=${apiBaseUrl}`);
  console.log('   NEXT_PUBLIC_USE_MOCK_API=false');
  console.log('2. Restart your Next.js application:');
  console.log('   npm run dev:real-api');
}

// Run all checks
async function runDiagnostics() {
  // Check environment configuration
  checkEnvironmentConfig();
  
  // Check for common issues
  await checkForCommonIssues();
  
  // Test API server info
  const apiInfo = await testApiInfo();
  
  // Test all endpoints if API server is accessible
  let endpointTests = { allSuccess: false, requiredSuccess: false, results: {} };
  if (apiInfo) {
    endpointTests = await testAllEndpoints();
  }
  
  // Print recommendations
  printRecommendations(apiInfo, endpointTests);
}

// Execute the diagnostics
runDiagnostics().catch(error => {
  console.error('Error running diagnostics:', error);
}); 