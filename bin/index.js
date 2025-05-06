#!/usr/bin/env node

/**
 * @cylestio/ui-dashboard
 * 
 * Copyright 2025 Cylestio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'start';
const port = args.includes('--port') ? args[args.indexOf('--port') + 1] : process.env.PORT || 3000;
const apiUrl = args.includes('--api-url') ? args[args.indexOf('--api-url') + 1] : process.env.CYLESTIO_API_URL || 'http://localhost:8000';

const helpText = `
Cylestio UI Dashboard - v0.1.10

USAGE:
  cylestio-dashboard [COMMAND] [OPTIONS]

COMMANDS:
  start         Start the dashboard (default)
  help          Show this help message

OPTIONS:
  --port <num>  Specify port (default: 3000)
  --api-url <url> Specify API server URL (default: http://localhost:8000)

EXAMPLES:
  cylestio-dashboard
  cylestio-dashboard start --port 4000
  cylestio-dashboard start --api-url http://api.example.com:8080
`;

function startDashboard() {
  console.log(`Starting Cylestio Dashboard on port ${port}...`);
  console.log(`Connecting to API server at ${apiUrl}`);
  
  // Start a simple web server that serves the dashboard
  const express = require('express');
  const app = express();
  const path = require('path');
  const fs = require('fs');
  
  // Serve the dashboard UI
  app.use(express.static(path.join(__dirname, '..', 'public')));
  
  // API configuration endpoint
  app.get('/config.json', (req, res) => {
    res.json({
      apiUrl: apiUrl,
      version: '0.1.10'
    });
  });
  
  // Default route
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`✓ Cylestio Dashboard is running at http://localhost:${port}`);
    console.log(`  Press Ctrl+C to stop`);
  });
}

if (command === 'help') {
  console.log(helpText);
} else if (command === 'start') {
  startDashboard();
} else {
  console.log(`Unknown command: ${command}`);
  console.log(helpText);
} 