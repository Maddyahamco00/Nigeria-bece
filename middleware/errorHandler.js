// middleware/errorHandler.js
// Centralized error handling — now AppError-aware.
// Operational errors (AppError) get clean messages.
// Unexpected errors get generic 500 responses.

import logger from '../utils/logger.js';

export const notFoundHandler = (req, res) => {
  logger.warn('404 Not Found', { method: req.method, url: req.originalUrl, ip: req.ip });
  res.status(404).render('404', { title: 'Page Not Found', requested: req.originalUrl });
};

export const globalErrorHandler = (err, req, res, next) => {
  const isOperational = err.isOperational === true;
  const statusCode = err.statusCode || err.status || 500;

  // Always log — operational errors at warn, unexpected at error
  if (isOperational) {
    logger.warn('Operational error', {
      code: err.code,
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    });
  } else {
    logger.error('Unexpected error', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    });
  }

  const isJsonRequest =
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.path.startsWith('/api/');

  if (isJsonRequest) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: isOperational ? err.message : 'An unexpected error occurred',
        ...(err.fields && { fields: err.fields }),
      },
    });
  }

  // For browser requests: flash + redirect for operational errors,
  // render error page for unexpected ones
  if (isOperational && statusCode < 500 && req.flash) {
    req.flash('error', err.message);
    return res.redirect('back');
  }

  res.status(statusCode).render('error', {
    title: 'Server Error',
    message: isOperational ? err.message : 'Something went wrong. Please try again.',
  });
};

/**
 * Wraps async route handlers — eliminates try/catch boilerplate.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
