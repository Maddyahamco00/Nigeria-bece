// src/auth/middleware/authMiddleware.js
// Clean auth guards — replaces middleware/auth.js console.log calls.
// Drop-in compatible: same export names used by existing routes.

import logger from '../../utils/logger.js';

const ADMIN_ROLES = [
  'super_admin', 'admin', 'state_admin',
  'school_admin', 'exam_admin', 'feedback_admin',
];

/**
 * Require a Passport-authenticated admin user.
 * Replaces the old isAuthenticated + isAdmin combo.
 */
export const requireAuthenticatedAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  logger.warn('Unauthenticated admin access attempt', { url: req.originalUrl, ip: req.ip });
  req.flash('error', 'Please log in to access this page');
  res.redirect('/auth/admin');
};

/**
 * Require the session-based student object (legacy session pattern).
 * Also accepts a Passport-authenticated student as fallback.
 */
export const requireAuthenticatedStudent = (req, res, next) => {
  if (req.session?.student) return next();

  if (req.isAuthenticated?.() && req.user) {
    req.session.student = {
      id: req.user.id,
      name: req.user.name || '',
      regNumber: req.user.regNumber || '',
      paymentStatus: req.user.paymentStatus || 'pending',
      email: req.user.email || '',
    };
    return next();
  }

  logger.warn('Unauthenticated student access attempt', { url: req.originalUrl, ip: req.ip });
  req.flash('error', 'Please log in first');
  res.redirect('/auth/student/login');
};

/**
 * Attach role/permission info to res.locals for EJS templates.
 */
export const attachRoleLocals = (req, res, next) => {
  if (req.user) {
    res.locals.userRole = req.user.role;
    res.locals.isAdmin = ADMIN_ROLES.includes(req.user.role);
    res.locals.isSuperAdmin = req.user.role === 'super_admin';
  }
  next();
};

// ── Backward-compatible aliases (used by existing routes/admin.js) ───────────
export const isAuthenticated = requireAuthenticatedAdmin;
export const isAdmin = requireAuthenticatedAdmin;
export const ensureStudent = requireAuthenticatedStudent;
