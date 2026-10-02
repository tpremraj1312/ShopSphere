const { sendError } = require('../shared/response');
const securityLogger = require('../shared/securityLogger');
const { captureException } = require('../shared/monitoring');

const errorHandler = (err, req, res, next) => {
  // Log the full error to the console (or a logging service)
  console.error('[Error]:', err);

  // Default to 500 internal server error
  const statusCode = err.statusCode || 500;

  // 4.3.1: Global Sentry error capture for unhandled/server errors with PII sanitization
  if (statusCode >= 500) {
    captureException(err, {
      url: req.originalUrl || req.url,
      method: req.method,
      userId: req.user?.userId || req.user?._id,
      headers: {
        'user-agent': req.get?.('User-Agent'),
      },
      body: req.body, // Will be sanitized by monitoring.sanitizeContext
      params: req.params,
      query: req.query,
    });
  }

  // SEC-22: Log security-relevant errors
  if (statusCode === 403) {
    securityLogger.forbiddenAccess(err.message || 'Forbidden', req);
  } else if (statusCode === 429) {
    securityLogger.rateLimitTrip(req);
  } else if (statusCode >= 500) {
    securityLogger.error('SERVER_ERROR', {
      code: err.code,
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    }, req);
  }
  
  // Create a safe error object to send to the client (hiding sensitive info)
  const safeError = {
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.isOperational ? err.message : 'An unexpected error occurred',
  };

  // Only include details if they exist and it's an operational error
  if (err.isOperational && err.details) {
    safeError.details = err.details;
  }

  // Use the shared response envelope
  sendError(res, safeError, statusCode);
};

module.exports = errorHandler;

