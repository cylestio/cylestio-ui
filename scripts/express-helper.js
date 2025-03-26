/**
 * Helper functions for Express routing
 */

/**
 * Registers a route handler for both versions of a path (with and without trailing slash)
 * @param {object} app - Express app instance
 * @param {string} method - HTTP method ('get', 'post', etc.)
 * @param {string} path - Base path without trailing slash
 * @param {function} handler - Route handler function
 */
function registerWithTrailingSlash(app, method, path, handler) {
  // Register handler for path without trailing slash
  app[method](path, handler);
  
  // Register handler for path with trailing slash
  const pathWithSlash = path.endsWith('/') ? path : `${path}/`;
  app[method](pathWithSlash, handler);
  
  console.log(`Registered route: ${method.toUpperCase()} ${path} (with and without trailing slash)`);
}

module.exports = {
  registerWithTrailingSlash
}; 