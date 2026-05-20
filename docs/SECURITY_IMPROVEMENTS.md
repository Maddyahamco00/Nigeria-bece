# SECURITY_IMPROVEMENTS.md (Phase 3)

This phase focuses on safe, incremental security improvements while preserving existing login functionality.

## Password hashing
- Uses `bcryptjs` in `src/auth/services/AuthService.js`.
- BCRYPT rounds are centralized in the service.

## Password reset security
- Reset tokens are random (`crypto.randomBytes(32)`), stored with an expiration TTL.
- Service returns success even when email is unknown to prevent user enumeration.

## Centralized operational errors
- `src/errors/AppError.js` defines known error types.
- `middleware/errorHandler.js` converts operational errors into consistent browser/JSON responses.

## Logging
- `utils/logger.js` is used for structured auth event logs (login success, reset token generation, logout).

## Role-based access guard (session-based)
- `src/auth/middleware/authMiddleware.js` provides `requireAuthenticatedAdmin` and `requireAuthenticatedStudent`.
- Roles are derived from `req.user.role` and used for template locals.

## Notes
JWT/refresh token work is not fully introduced in Phase 3 if the runtime auth flow remains session/Passport based. Existing JWT-related code (if any) must be audited in later phases.

