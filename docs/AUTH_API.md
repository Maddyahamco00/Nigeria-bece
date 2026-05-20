# AUTH_API.md (Phase 3)

This document describes the authentication endpoints and the layered architecture introduced in Phase 3.

## Key principle
Controllers must be thin:
- receive request
- validate request
- call service
- return response

All business logic and database access must live in:
- `src/auth/services/`
- `src/auth/repositories/`

## Endpoints (Express)
> Note: Existing routes are preserved for backward compatibility.

### GET /auth
- Render the login page.

### GET /auth/login
- Render the shared login page.

### POST /auth/login
- Auth is handled by Passport local strategy.

### GET /auth/admin
- Render admin login.

### POST /auth/admin
- Validate body, then Passport local-admin login.

### GET /auth/admin/register
- Render admin registration form.

### POST /auth/admin/register
- Validate body, then call `AuthService.registerAdmin()`.

### GET /auth/forgot-password
- Render forgot-password page.

### POST /auth/forgot-password
- Validate body, then call `AuthService.initiatePasswordReset()`.

### GET /auth/reset-password/:token
- Validate token by calling `AuthService.validateResetToken()`.

### POST /auth/reset-password/:token
- Validate body, then call `AuthService.completePasswordReset()`.

### GET /auth/logout
- Logout and redirect.

## Modules
- Validators: `src/auth/validators/authValidators.js`
- Controllers: `src/auth/controllers/AuthController.js`
- Services: `src/auth/services/AuthService.js`
- Repositories: `src/auth/repositories/AuthRepository.js`
- Auth middleware/guards: `src/auth/middleware/authMiddleware.js`

