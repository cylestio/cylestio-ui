#!/usr/bin/env node

/**
 * Helper script to update the configuration file
 * Usage:
 *   node scripts/update-config.js --api-url http://new-api.example.com
 *   node scripts/update-config.js --port 3002
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--api-url' && i + 1 < args.length) {
    const url = args[++i];
    console.log(`Setting API URL to: ${url}`);
    configContent = configContent.replace(
      /(serverUrl:.*['"])(.*)(['"])/,
      `$1${url}$3`
    );
  } 
  else if (arg === '--port' && i + 1 < args.length) {
    const port = args[++i];
    console.log(`Setting port to: ${port}`);
    configContent = configContent.replace(
      /(port:.*?)(\d+)/,
      `$1${port}`
    );
  }
  else if (arg === '--help') {
    console.log(`
Usage: node scripts/update-config.js [options]

Options:
  --api-url URL      Set the API server URL in the config file
  --port PORT        Set the development server port in the config file
  --help             Show this help message
    `);
    process.exit(0);
  }
}

fs.writeFileSync(configPath, configContent);
console.log('Configuration updated successfully'); 