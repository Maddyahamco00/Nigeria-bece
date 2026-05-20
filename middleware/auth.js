// middleware/auth.js
// Backward-compatible re-export shim.
// All existing code that imports from here continues to work unchanged.
// The real implementation now lives in src/auth/middleware/authMiddleware.js.

export {
  requireAuthenticatedAdmin,
  requireAuthenticatedStudent,
  attachRoleLocals,
  isAuthenticated,
  isAdmin,
  ensureStudent,
} from '../src/auth/middleware/authMiddleware.js';

// setupPassport kept for any code that still calls it (no-op now — passport
// is initialized directly in app.js, which is the correct place).
export const setupPassport = () => {};
