#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Current directory:', process.cwd());

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  console.log('Creating dist directory...');
  fs.mkdirSync('dist');
}

// Copy index.ts to dist
console.log('Copying index.ts to dist...');
fs.copyFileSync('app/index.ts', 'dist/index.js');
fs.writeFileSync('dist/index.d.ts', `
export interface Agent {
  id: number;
  name: string;
  status: string;
  last_active: string;
  type: string;
}

export interface Event {
  id: number;
  timestamp: string;
  event_type: string;
  level: string;
  message: string;
  agent_id: number;
}

export declare const AgentTable: React.FC;
export declare const EventTable: React.FC;
export declare const RootLayout: React.FC<{children: React.ReactNode}>;
export declare const HomePage: React.FC;
`);

console.log('Building Next.js app...');
try {
  execSync('npx next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Error building Next.js app:', error);
  process.exit(1);
}

console.log('✅ Package built successfully!'); 