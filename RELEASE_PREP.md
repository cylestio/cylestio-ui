# Release Preparation Guide

This guide outlines the steps needed to prepare the Cylestio UI Dashboard package for release to npm.

## Pre-release Checklist

### 1. Fix TypeScript Errors

Before building the package, all TypeScript errors must be resolved. Current issues include:

- Type definition errors in `app/components/drilldown/index.ts`
- Prop type mismatches in components such as `DrilldownMetricCard`
- Missing or incorrect imports in various components

Run the following command to identify all TypeScript errors:

```bash
npm run type-check
```

### 2. Update Documentation

Ensure all documentation is up-to-date:

- [x] README.md - Main project documentation
- [x] CHANGELOG.md - Updated with new version and changes
- [x] Installation Guide - Verify installation instructions
- [x] API Reference - Check component documentation

### 3. Update Version

Update the version number in:

- [x] package.json (currently set to 0.2.0)
- [x] CHANGELOG.md

### 4. Test the Package Build

Once TypeScript errors are fixed, build and verify the package:

```bash
npm run build:package
npm run verify:package
```

### 5. Test Integration

Create a test project that imports the package locally to verify it works as expected:

```bash
# In a separate project
npm install --save /path/to/cylestio-ui
```

## Release Process

1. Commit all changes and push to the main branch
2. Create a new GitHub release with the version as the tag name (e.g., v0.2.0)
3. The GitHub Actions workflow will automatically:
   - Build the package
   - Run linting and type checking
   - Verify the package structure
   - Publish to npm

## Known Issues

The following issues should be addressed before the final release:

1. TypeScript errors in various components
2. Missing dependencies:
   - react-tooltip
   - Some components reference non-existent modules

## Post-release

After the package is published:

1. Verify the package can be installed from npm
2. Test with a real project
3. Update the demo project to use the latest version
4. Announce the release to stakeholders 