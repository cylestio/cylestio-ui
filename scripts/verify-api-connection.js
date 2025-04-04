#!/usr/bin/env node

/**
 * This script tests connectivity to the real API server
 * and verifies that key endpoints are working correctly.
 * 
 * Usage: 
 *   node scripts/verify-api-connection.js [host] [port]
 * 
 * Example:
 *   node scripts/verify-api-connection.js localhost 8000
 */

const fetch = require('node-fetch');
const readline = require('readline');

const host = process.argv[2] || 'localhost';
const port = process.argv[3] || '8000';
const apiBaseUrl = `http://${host}:${port}`;
const apiVersion = '/api/v1';
const fullBaseUrl = `${apiBaseUrl}${apiVersion}`;

console.log(`Testing API connection to ${fullBaseUrl}`);

// Key endpoints to test
const endpoints = [
  { path: '/', name: 'Root Endpoint' },
  { path: '/status', name: 'Status Endpoint' },
  { path: '/agents', name: 'Agents List' },
  { path: '/events', name: 'Events List' },
  { path: '/alerts', name: 'Alerts List' },
  { path: '/dashboard', name: 'Dashboard Data' },
  { path: '/metrics', name: 'Metrics' },
  { path: '/metrics/security', name: 'Security Metrics' }
];

// Test a single endpoint and report results
async function testEndpoint(endpoint) {
  const url = `${fullBaseUrl}${endpoint.path}`;
  console.log(`\nTesting ${endpoint.name}: ${url}`);
  
  try {
    const response = await fetch(url);
    const status = response.status;
    console.log(`Status: ${status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response Structure:');
      console.log(JSON.stringify(Object.keys(data), null, 2));
      
      if (data.items) {
        console.log(`Items Count: ${data.items.length}`);
        if (data.items.length > 0) {
          console.log('First Item Structure:');
          console.log(JSON.stringify(Object.keys(data.items[0]), null, 2));
        }
      }
      
      return { success: true, status, data };
    } else {
      return { success: false, status, error: response.statusText };
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test all endpoints in sequence
async function testAllEndpoints() {
  console.log('Beginning API verification...\n');
  
  let results = {};
  
  for (const endpoint of endpoints) {
    results[endpoint.path] = await testEndpoint(endpoint);
  }
  
  console.log('\n=== SUMMARY ===');
  for (const [path, result] of Object.entries(results)) {
    const status = result.success ? '✅ Success' : '❌ Failed';
    console.log(`${status}: ${path} ${result.status || ''}`);
  }
  
  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n${successCount}/${endpoints.length} endpoints working`);
  
  if (successCount < endpoints.length) {
    console.log('\nSome endpoints failed. Please check:');
    console.log('1. Is the API server running?');
    console.log(`2. Is the API server configured to listen on ${host}:${port}?`);
    console.log('3. Do all expected endpoints exist in the real API server?');
  }
  
  return results;
}

// Run the verification script
testAllEndpoints().catch(error => {
  console.error('Script error:', error);
}); 