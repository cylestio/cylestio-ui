#!/usr/bin/env node

/**
 * Script to fix import paths in the Security Explorer components
 * 
 * This script updates import paths to resolve the correct modules and fix
 * linter errors in the Security Explorer components.
 * 
 * Usage:
 *   node scripts/fix-security-imports.js
 */

const { readFileSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const { readdirSync, statSync } = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.blue}===============================`);
console.log(`${colors.blue}Security Import Path Fixer`);
console.log(`${colors.blue}===============================`);

// Helper function to find files recursively
function findFilesRecursively(dir, pattern) {
  let results = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findFilesRecursively(filePath, pattern));
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }

  return results;
}

// Fix import paths in security components
try {
  console.log(`${colors.cyan}Finding security component files...${colors.reset}`);

  // Find all TypeScript/TSX files in the security directory
  const securityRoot = path.join(__dirname, '..', 'app', 'security');
  const componentFiles = findFilesRecursively(securityRoot, /\.(ts|tsx)$/);

  console.log(`${colors.green}Found ${componentFiles.length} files to process${colors.reset}`);

  let fixedFiles = 0;

  for (const filePath of componentFiles) {
    console.log(`${colors.yellow}Processing ${path.relative(process.cwd(), filePath)}${colors.reset}`);
    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace @/app imports with relative paths
    if (content.includes('@/app/')) {
      const newContent = content.replace(/@\/app\//g, (match) => {
        const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '..', 'app'));
        return relativePath.replace(/\\/g, '/') + '/';
      });

      if (newContent !== content) {
        writeFileSync(filePath, newContent, 'utf8');
        content = newContent;
        modified = true;
      }
    }

    // Replace local missing imports
    const securityComponentFiles = findFilesRecursively(
      path.join(securityRoot, 'components'),
      /\.(ts|tsx)$/
    ).map(f => path.basename(f));

    for (const componentFile of securityComponentFiles) {
      const componentName = path.basename(componentFile, path.extname(componentFile));
      const importRegex = new RegExp(`Cannot find module '\\./components/${componentName}'`, 'g');
      
      if (importRegex.test(content)) {
        // Ensure the component file exists in the right location
        console.log(`${colors.magenta}  Creating missing component stub: ${componentName}${colors.reset}`);
        
        const stubCode = `'use client';

export default function ${componentName}(props: any) {
  return <div>Component ${componentName} (to be implemented)</div>;
}
`;
        
        const targetPath = path.join(path.dirname(filePath), 'components', componentFile);
        writeFileSync(targetPath, stubCode, 'utf8');
        modified = true;
      }
    }

    if (modified) {
      fixedFiles++;
    }
  }

  console.log(`${colors.green}✅ Fixed imports in ${fixedFiles} files!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error fixing import paths:${colors.reset}`);
  console.error(error);
  process.exit(1);
}

// Make the script executable
try {
  if (process.platform !== 'win32') {
    execSync('chmod +x scripts/fix-security-imports.js');
  }
} catch (error) {
  // Ignore permission errors
} 