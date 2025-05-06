# @cylestio/ui-dashboard

[![npm version](https://badge.fury.io/js/%40cylestio%2Fui-dashboard.svg)](https://www.npmjs.com/package/@cylestio/ui-dashboard)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Enterprise-grade dashboard components for monitoring AI agent activities and security metrics, designed to integrate with Cylestio Monitor.

## Description

Cylestio UI Dashboard provides a powerful frontend interface for visualizing AI agent metrics, security events, and performance data. The dashboard includes components for monitoring token usage, LLM requests, security alerts, agent performance, and more.

## Quick Start for Users

Install and run the dashboard with just two commands:

```bash
# Install globally
npm install -g @cylestio/ui-dashboard

# Start the dashboard with default settings
cylestio-dashboard
```

This will launch a web server and open the dashboard in your browser at http://localhost:3000, connecting to a Cylestio API server at http://localhost:8000.

### Custom Configuration

```bash
# Run on a different port
cylestio-dashboard start --port 4000

# Specify a custom API server
cylestio-dashboard start --api-url http://api.example.com:8080

# Combine options
cylestio-dashboard start --port 4000 --api-url http://api.example.com:8080
```

## For Developers

If you want to contribute or modify the dashboard:

1. Clone the repository
   ```bash
   git clone https://github.com/cylestio/cylestio-ui
   ```

2. Navigate to the repository directory
   ```bash
   cd cylestio-ui
   ```

3. Install dependencies
   ```bash
   npm install
   ```

4. Start the development server
   ```bash
   # Start with default settings (port 3000, API at localhost:8000)
   npm run dev
   
   # Start with custom port
   PORT=4000 npm run dev
   
   # Start with custom API URL
   CYLESTIO_API_URL=http://api.example.com:8080 npm run dev
   
   # Combine custom settings
   PORT=4000 CYLESTIO_API_URL=http://api.example.com:8080 npm run dev
   ```

### Configuration Options

| Option      | CLI Flag            | Environment Variable  | Default              | Description                 |
|-------------|--------------------|----------------------|----------------------|----------------------------|
| Port        | `--port <number>`   | `PORT`                | 3000                 | Dashboard server port      |
| API URL     | `--api-url <url>`   | `CYLESTIO_API_URL`    | http://localhost:8000 | Cylestio API server URL    |

## Command Reference

| Command                                        | Description                                    |
|------------------------------------------------|------------------------------------------------|
| `cylestio-dashboard`                           | Start with default settings                    |
| `cylestio-dashboard start`                     | Same as above                                  |
| `cylestio-dashboard start --port 4000`         | Start on port 4000                             |
| `cylestio-dashboard start --api-url <url>`     | Connect to specified API server                |
| `cylestio-dashboard help`                      | Display help                                   |

## Publishing to npm

This package uses GitHub Actions for automated npm publishing.

### Prerequisites

1. Set up an NPM access token in your GitHub repository:
   - Generate a token on npm with publishing rights
   - Add it as a repository secret named `NPM_TOKEN` in GitHub

### Publishing Process

1. Manual Release:
   - Go to the Actions tab in the GitHub repository
   - Select the "Release to npm" workflow
   - Click "Run workflow" 
   - Choose whether to run a dry-run (no actual publish)
   - Optionally specify a version number (otherwise uses package.json)

2. GitHub Release:
   - A GitHub Release will be automatically created when publishing to npm
   - Release notes are generated automatically
   - The packaged tarball is attached to the release

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style 
- Write tests for new features
- Keep pull requests focused on a single feature or bug fix
- Update documentation as needed

## License

This project is licensed under the Apache License, Version 2.0 - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the Cylestio team directly.
