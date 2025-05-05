/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
  },
  env: {
    CYLESTIO_SERVER_URL: process.env.CYLESTIO_SERVER_URL || 'http://localhost:8000',
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'false',
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