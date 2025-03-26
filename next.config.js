/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    disableOptimizedLoading: false,
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    // Simple fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    // Add aliases for common imports
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },
  typescript: {
    // Disable type checking during build for faster builds
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  poweredByHeader: false,
  generateEtags: false,
  output: 'standalone',
  // Add trailing slashes to all paths
  trailingSlash: true,
  // Ensure we can find the _error page
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
  // External packages configuration moved here from experimental
  serverExternalPackages: [],
};

module.exports = nextConfig; 