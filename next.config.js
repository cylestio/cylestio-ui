/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
  },
  env: {
    API_SERVER_URL: process.env.API_SERVER_URL || 'http://localhost:8080',
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'false',
  },
};

module.exports = nextConfig; 