/** @type {import('next').NextConfig} */
const config = require('./config');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
  },
  env: {
    API_SERVER_URL: config.api.serverUrl,
  },
  // Support for custom port via environment variable or config
  devIndicators: {
    buildActivity: true,
  },
  // Fix 404 errors for JavaScript chunks on refresh
  output: 'standalone',
  // Ensure proper static asset handling
  poweredByHeader: false,
  // Enable static optimization
  optimizeFonts: true,
  // Increase static generation performance
  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig; 