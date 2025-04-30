# Creating a GitHub Release

This document outlines the steps to create a GitHub release that will trigger the automatic npm package publishing workflow.

## Prerequisites

1. Ensure all code changes have been committed and pushed to the main branch
2. Verify that all TypeScript errors have been fixed and the build is successful
3. Make sure the version in `package.json` and `CHANGELOG.md` has been updated
4. Confirm all documentation is up-to-date

## Creating the Release

1. **Go to the GitHub repository**

   Navigate to https://github.com/cylestio/cylestio-ui

2. **Click on "Releases" in the sidebar**

   This will take you to the releases page.

3. **Click "Draft a new release"**

   This will open the release creation form.

4. **Fill in the release details**

   - **Tag version**: Enter `v0.2.0` (or whatever version you're releasing)
   - **Target**: Select `main` branch
   - **Release title**: Enter `v0.2.0 - UI Dashboard Package` (or appropriate title)
   - **Description**: Copy the relevant section from the CHANGELOG.md into the description box

   Example description:
   ```markdown
   ## [0.2.0] - 2024-05-22

   ### Added
   - Enhanced UI components for better monitoring
   - Improved TypeScript definitions
   - Additional documentation for custom integrations
   - More comprehensive examples in the docs

   ### Changed
   - Optimized package size
   - Streamlined component API for easier usage
   - Updated dependencies to latest versions
   - Improved build process for better compatibility

   ### Fixed
   - Type definition issues with complex data structures
   - Minor styling inconsistencies in dark mode
   - Documentation examples alignment with actual component props
   ```

5. **Publish the release**

   Click the "Publish release" button.

## What Happens Next

Once you publish the release:

1. The GitHub Actions workflow defined in `.github/workflows/npm-publish.yml` will automatically trigger
2. The workflow will:
   - Check out the code
   - Set up Node.js
   - Install dependencies
   - Run linting and type checking
   - Build the package
   - Verify the package structure
   - Publish to npm using the NPM_KEY secret
   - Send a notification to Slack (if configured)

3. You can monitor the workflow progress in the "Actions" tab of your GitHub repository

## Troubleshooting

If the workflow fails:

1. Check the workflow logs in the GitHub Actions tab
2. Common issues include:
   - TypeScript errors not fixed before release
   - Missing dependencies
   - Failed tests
   - Invalid npm token

## Post-Release Verification

After the release is published:

1. Verify the package is available on npm: https://www.npmjs.com/package/@cylestio/ui-dashboard
2. Install the package in a test project to confirm it works as expected
3. Check that all exported components are accessible 