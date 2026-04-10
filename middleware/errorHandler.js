// middleware/errorHandler.js
// Centralized error handling middleware for Express

const logger = require('../config/logger');

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  // Skip for API routes — return JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  // For view routes — render error page or redirect
  res.status(404).render('partials/error', {
    errors: ['Page not found']
  });
}

/**
 * Global error handler
 */
function globalErrorHandler(err, req, res, next) {
  // Log the error
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const statusCode = err.statusCode || 500;
  const isApi = req.originalUrl.startsWith('/api');

  if (isApi) {
    return res.status(statusCode).json({
      success: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }

  res.status(statusCode).render('partials/error', {
    errors: [process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : err.message]
  });
}

module.exports = { notFoundHandler, globalErrorHandler };
