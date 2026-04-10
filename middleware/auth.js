// middleware/auth.js
// Authentication middleware for protecting routes

/**
 * Middleware to check if user is authenticated (for view routes)
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  return res.redirect('/login');
}

/**
 * Middleware to check if user is authenticated (for API routes)
 * Returns JSON error instead of redirect
 */
function isAuthenticatedAPI(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'Authentication required. Please log in first.'
  });
}

module.exports = { isAuthenticated, isAuthenticatedAPI };
