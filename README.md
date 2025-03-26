# Cylestio UI Dashboard

A modern, responsive monitoring dashboard for AI agents. Built with Next.js and Tremor.

![Cylestio Dashboard Screenshot](public/screenshots/dashboard.png)

## Features

- 📊 **Real-time monitoring** of AI agents, events, and security alerts
- 🔍 **Detailed analytics** for performance and usage metrics
- 🚨 **Security alerting** for potential issues with AI agents
- 📱 **Responsive design** that works across devices
- 🌓 **Dark mode support** for reduced eye strain
- 🔌 **Mock API** for development without a backend

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/cylestio/cylestio-ui.git
cd cylestio-ui
```

2. Install dependencies
```bash
npm install
```

3. Set up environment files

The application requires environment files for configuration. We provide sample files that you'll need to copy:

```bash
# For standard development (connecting to a real API)
cp .env.example .env.development
```

```bash
# For mock API development (recommended for most users)
cp .env.example .env.mock
```

Then edit the appropriate file with your settings. The most important settings to review are:

**For `.env.development`:**
- `API_BASE_URL` - URL of your API server
- `API_TIMEOUT` - Timeout for API requests in milliseconds
- `AUTH_SECRET` - Secret for authentication (change in production!)

**For `.env.mock`:**
- `NEXT_PUBLIC_USE_MOCK_API` - Set to `true` to use the mock API
- `MOCK_API_PORT` - Port for the mock API server
- `NEXT_PUBLIC_MOCK_API_URL` - URL for the mock API server

4. Start the development server

For mock mode (recommended for most development):
```bash
npm run dev:mock
```

This will start both the Next.js application and a mock API server that provides sample data.

### Development Modes

The application can run in several modes:

- **Mock Mode**: Uses a mock API server for development without a real backend
  ```bash
  npm run dev:mock
  ```

- **Standard Mode**: Connects to a real API server (requires backend setup)
  ```bash
  npm run dev
  ```

- **Production Mode**: Optimized build for production deployment
  ```bash
  npm run build
  npm start
  ```

## Project Structure

```
cylestio-ui/
├── app/                  # Next.js application
│   ├── api/              # API routes
│   ├── components/       # React components
│   │   ├── charts/       # Data visualization components
│   │   └── ui/           # UI elements
│   ├── hooks/            # React hooks
│   ├── lib/              # Utilities and helpers
│   │   └── api/          # API client
│   └── pages/            # Pages and routes
├── public/               # Static assets
└── tests/                # Test files
```

## API Integration

The dashboard can connect to any API that follows the Cylestio Monitor API specification. For development, a mock API server is included that simulates the real API.

### Mock API

The mock API server runs on port 8080 by default and provides simulated data for:

- Agents
- Events
- Alerts
- Metrics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Tremor](https://www.tremor.so/)
- Icons from [Lucide](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/)
