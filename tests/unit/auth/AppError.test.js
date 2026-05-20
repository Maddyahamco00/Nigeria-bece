// tests/unit/auth/AppError.test.js
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TokenExpiredError,
  TokenInvalidError,
} from '../../../src/errors/AppError.js';

describe('AppError', () => {
  test('sets message, statusCode, code, and isOperational', () => {
    const err = new AppError('Something broke', 503, 'SERVICE_UNAVAILABLE');
    expect(err.message).toBe('Something broke');
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('SERVICE_UNAVAILABLE');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  test('defaults statusCode to 500 and code to INTERNAL_ERROR', () => {
    const err = new AppError('oops');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });
});

describe('ValidationError', () => {
  test('has statusCode 400 and VALIDATION_ERROR code', () => {
    const err = new ValidationError('Name is required', { name: 'required' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.fields).toEqual({ name: 'required' });
    expect(err.isOperational).toBe(true);
  });
});

describe('AuthenticationError', () => {
  test('has statusCode 401', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTHENTICATION_ERROR');
    expect(err.message).toBe('Authentication required');
  });

  test('accepts custom message', () => {
    const err = new AuthenticationError('Invalid credentials');
    expect(err.message).toBe('Invalid credentials');
  });
});

describe('AuthorizationError', () => {
  test('has statusCode 403', () => {
    const err = new AuthorizationError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('AUTHORIZATION_ERROR');
  });
});

describe('NotFoundError', () => {
  test('formats message with resource name', () => {
    const err = new NotFoundError('Student');
    expect(err.message).toBe('Student not found');
    expect(err.statusCode).toBe(404);
  });
});

describe('ConflictError', () => {
  test('has statusCode 409', () => {
    const err = new ConflictError('Email already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });
});

describe('TokenExpiredError', () => {
  test('has statusCode 401 and TOKEN_EXPIRED code', () => {
    const err = new TokenExpiredError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('TOKEN_EXPIRED');
  });
});

describe('TokenInvalidError', () => {
  test('has statusCode 401 and TOKEN_INVALID code', () => {
    const err = new TokenInvalidError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('TOKEN_INVALID');
  });
});
