import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

describe('Database Migration Cleanup', () => {
  const workspaceRoot = path.resolve(process.cwd());
  
  test('database directory has been removed', () => {
    const dbDirPath = path.join(workspaceRoot, 'src', 'lib', 'db');
    expect(fs.existsSync(dbDirPath)).toBe(false);
  });
  
  test('database types file has been removed', () => {
    const dbTypesPath = path.join(workspaceRoot, 'src', 'types', 'database.ts');
    expect(fs.existsSync(dbTypesPath)).toBe(false);
  });
  
  test('package.json does not contain database dependencies', () => {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check in dependencies
    const dependencies = packageJson.dependencies || {};
    expect(dependencies['better-sqlite3']).toBeUndefined();
    expect(dependencies['sqlite3']).toBeUndefined();
    
    // Check in devDependencies
    const devDependencies = packageJson.devDependencies || {};
    expect(devDependencies['better-sqlite3']).toBeUndefined();
    expect(devDependencies['sqlite3']).toBeUndefined();
    expect(devDependencies['@types/better-sqlite3']).toBeUndefined();
  });
  
  test('package.json does not contain database test scripts', () => {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const scripts = packageJson.scripts || {};
    expect(scripts['test:db']).toBeUndefined();
    expect(scripts['test:db:connection']).toBeUndefined();
  });
  
  test('next.config.js does not contain database references', () => {
    const nextConfigPath = path.join(workspaceRoot, 'next.config.js');
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    expect(nextConfigContent.includes('sqlite')).toBe(false);
  });
  
  test('database scripts have been removed', () => {
    const dbScriptPath = path.join(workspaceRoot, 'scripts', 'test-db-connection.js');
    const indexScriptPath = path.join(workspaceRoot, 'scripts', 'create-indexes.js');
    
    expect(fs.existsSync(dbScriptPath)).toBe(false);
    expect(fs.existsSync(indexScriptPath)).toBe(false);
  });
}); 