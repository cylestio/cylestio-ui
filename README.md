# Cylestio UI Dashboard

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Enterprise-grade dashboard for monitoring AI agent activities and security metrics.

## Quick Start

```bash
git clone https://github.com/cylestio/cylestio-ui.git
cd cylestio-ui
npm install
npm run dev
```

By default, the application will run on port 3000 and connect to the API server at http://localhost:8000.

### Customizing the Configuration

The application uses a central configuration file (`config.js`) in the root directory:

```js
// config.js
const config = {
  // API server configuration
  api: {
    // Base URL for API requests
    serverUrl: 'http://localhost:8000',
  },
  
  // Server configuration
  server: {
    // Port for the development server
    port: 3000,
  }
};
```

#### Option 1: Edit the config file directly

You can directly edit the `config.js` file to change any settings.

#### Option 2: Use the config helper script

We provide a helper script to update the configuration:

```bash
# Change the API server URL
npm run config -- --api-url http://your-api-server.com

# Change the development server port
npm run config -- --port 3001

# Apply multiple changes
npm run config -- --api-url http://your-api-server.com --port 3001
```

#### Option 3: Use environment variables for temporary changes

For one-time port changes without modifying the config file:

```bash
# Linux/Mac
PORT=3001 npm run dev

# Windows (Command Prompt)
set PORT=3001 && npm run dev

# Windows (PowerShell)
$env:PORT=3001; npm run dev
```

## Code Structure

### Configuration

The application uses a centralized configuration approach:

- `config.js` in the root directory contains all configurable settings
- All components and modules import from this central config file
- This ensures consistent settings throughout the application

Example of importing the config in a component:

```javascript
// Import the config
import config from '../../config';

// Use the API URL from config
const apiUrl = config.api.serverUrl;
```

## Features

- 📊 **Pre-built Components**: Ready-to-use UI components for AI agent monitoring
- 🎨 **Customizable**: Fully customizable with Tailwind CSS
- 📱 **Responsive**: Mobile-friendly UI that works on all devices
- 🔒 **Secure**: Enterprise-grade security built-in
- 🌗 **Dark Mode**: Support for light and dark themes

## Documentation

For complete documentation, visit:

- [Installation Guide](docs/installation.md)
- [API Reference](docs/api-reference.md)
- [Customization Guide](docs/customization.md)
- [API Integration Guide](docs/API_INTEGRATION_GUIDE.md)

## Development

### Local Development

Start the development server:

```bash
npm run dev
```

## Requirements

- React 17+
- Next.js 13+ (with App Router)
- Node.js 16+

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details and the [Code of Conduct](CODE_OF_CONDUCT.md) for community guidelines.

## License

[Apache-2.0](LICENSE) © Cylestio
