#!/usr/bin/env node

/**
 * This script switches between mock API mode and real API mode
 * by setting environment variables appropriately.
 * 
 * Usage:
 *   node scripts/switch-api-mode.js [mock|real]
 * 
 * Example:
 *   node scripts/switch-api-mode.js real
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const mode = args[0]?.toLowerCase();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Validate command line arguments
if (!mode || (mode !== 'mock' && mode !== 'real')) {
  console.log('Usage: node scripts/switch-api-mode.js [mock|real]');
  console.log('\nOptions:');
  console.log('  mock - Use the mock API server');
  console.log('  real - Use the real API server');
  process.exit(1);
}

console.log(`Switching to ${mode.toUpperCase()} API mode...\n`);

// Function to update .env.development file
function updateEnvFile() {
  const envFilePath = path.join(process.cwd(), '.env.development');
  
  let envContent;
  try {
    envContent = fs.readFileSync(envFilePath, 'utf8');
  } catch (error) {
    console.error(`Error reading .env.development file: ${error.message}`);
    process.exit(1);
  }
  
  // Update the USE_MOCK_API variable
  const mockApiValue = mode === 'mock' ? 'true' : 'false';
  
  // Check if the variable exists
  if (envContent.includes('NEXT_PUBLIC_USE_MOCK_API=')) {
    // Replace the existing variable
    envContent = envContent.replace(
      /NEXT_PUBLIC_USE_MOCK_API=(true|false)/,
      `NEXT_PUBLIC_USE_MOCK_API=${mockApiValue}`
    );
  } else {
    // Add the variable if it doesn't exist
    envContent += `\nNEXT_PUBLIC_USE_MOCK_API=${mockApiValue}\n`;
  }
  
  // Write the updated content back to the file
  try {
    fs.writeFileSync(envFilePath, envContent);
    console.log(`✅ Updated .env.development with NEXT_PUBLIC_USE_MOCK_API=${mockApiValue}`);
  } catch (error) {
    console.error(`Error writing to .env.development file: ${error.message}`);
    process.exit(1);
  }
}

// Function to print next steps
function printNextSteps() {
  console.log('\nNext Steps:');
  
  if (mode === 'mock') {
    console.log('1. Start the mock API server:');
    console.log('   npm run mock-api');
    console.log('\n2. In a new terminal, start the UI:');
    console.log('   npm run dev');
  } else {
    console.log('1. Ensure your real API server is running at http://localhost:8000');
    console.log('\n2. Verify API connectivity:');
    console.log('   npm run verify-api');
    console.log('\n3. Start the UI:');
    console.log('   npm run dev:real-api');
  }
  
  console.log('\n✨ Done! API mode switched successfully.');
}

// Execute the functions
updateEnvFile();
printNextSteps();

rl.close(); 