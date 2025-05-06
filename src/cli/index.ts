#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const helpText = `
cylestio-dashboard - AI Agent Monitoring Dashboard

USAGE:
  cylestio-dashboard [COMMAND] [OPTIONS]

COMMANDS:
  start         Start the dashboard server
  help          Show this help message

OPTIONS:
  --port, -p    Specify port (default: 3000)
  --api-url     Specify API server URL (default: http://localhost:8000)
  --help, -h    Show help for a command

EXAMPLES:
  cylestio-dashboard start
  cylestio-dashboard start --port 4000
  cylestio-dashboard start --api-url http://api.example.com
`;

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || args.includes('--help') || args.includes('-h')) {
  console.log(helpText);
  process.exit(0);
}

if (command === 'start') {
  // Extract options
  let port = 3000;
  let apiUrl = 'http://localhost:8000';

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--port' || args[i] === '-p') {
      port = parseInt(args[i + 1], 10) || 3000;
      i++;
    } else if (args[i] === '--api-url') {
      apiUrl = args[i + 1];
      i++;
    }
  }

  // Create temp .env.local file for the API URL
  const envContent = `CYLESTIO_SERVER_URL=${apiUrl}`;
  const tempEnvPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(tempEnvPath, envContent);
  
  console.log(`Starting Cylestio Dashboard on port ${port}`);
  console.log(`API Server: ${apiUrl}`);
  
  // Start the Next.js server
  const nextProcess = spawn('npx', ['next', 'start', '-p', port.toString()], {
    cwd: path.resolve(__dirname, '../../'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, CYLESTIO_SERVER_URL: apiUrl }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down Cylestio Dashboard...');
    nextProcess.kill('SIGINT');
    // Clean up the temporary .env.local file
    try {
      fs.unlinkSync(tempEnvPath);
    } catch (err) {
      // Ignore file not found errors
    }
    process.exit(0);
  });

  nextProcess.on('close', (code) => {
    console.log(`Cylestio Dashboard process exited with code ${code}`);
    // Clean up the temporary .env.local file
    try {
      fs.unlinkSync(tempEnvPath);
    } catch (err) {
      // Ignore file not found errors
    }
    process.exit(code);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.log(helpText);
  process.exit(1);
} 