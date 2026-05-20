// src/errors/AppError.js
// Single source of truth for all application errors.
// Throw these from services/repositories; the global error handler catches them.

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguishes known errors from unexpected crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Convenience subclasses ──────────────────────────────────────────────────

export class ValidationError extends AppError {
  constructor(message, fields = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.fields = fields; // optional field-level detail
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Token has expired') {
    super(message, 401, 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends AppError {
  constructor(message = 'Invalid token') {
    super(message, 401, 'TOKEN_INVALID');
    this.name = 'TokenInvalidError';
  }
}
