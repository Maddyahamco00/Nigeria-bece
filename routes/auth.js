// routes/auth.js
// Thin router — only wires URLs to controller methods and validators.
// All business logic lives in src/auth/services/AuthService.js.
// All DB access lives in src/auth/repositories/AuthRepository.js.
// All validation lives in src/auth/validators/authValidators.js.
//
// BACKWARD COMPATIBLE: every URL that existed before still exists.

import express from 'express';
import passport from 'passport';
import * as AuthController from '../src/auth/controllers/AuthController.js';
import {
  validateBody,
  adminLoginSchema,
  adminRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../src/auth/validators/authValidators.js';

const router = express.Router();

// Expose current path to EJS templates for nav highlighting
router.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// ── Root redirect ─────────────────────────────────────────────────────────
router.get('/', AuthController.showLoginPage);

// ── Shared login page ─────────────────────────────────────────────────────
router.get('/login', AuthController.showLoginPage);
router.post('/login', AuthController.handleSharedLogin);

// ── Admin auth ────────────────────────────────────────────────────────────
router.get('/admin', AuthController.showAdminLoginPage);
router.post(
  '/admin',
  validateBody(adminLoginSchema, '/auth/admin'),
  AuthController.handleAdminLogin
);

router.get('/admin/register', AuthController.showAdminRegisterPage);
router.post(
  '/admin/register',
  validateBody(adminRegisterSchema, '/auth/admin/register'),
  AuthController.handleAdminRegister
);

// ── Student auth ──────────────────────────────────────────────────────────
// Redirect legacy /auth/register → multi-step flow (unchanged)
router.get('/register', (req, res) => res.redirect('/students/register/biodata'));
router.post('/register', (req, res) => res.redirect('/students/register/biodata'));

router.get('/student/register', AuthController.showStudentRegisterPage);
// Student registration POST is handled by studentRoutes.js (unchanged)
// We keep this route pointing there to preserve backward compatibility
router.post('/student/register', (req, res) => res.redirect(307, '/students/register'));

router.get('/student/login', AuthController.showStudentLoginPage);
router.post(
  '/student/login',
  passport.authenticate('local-student', {
    successRedirect: '/students/dashboard',
    failureRedirect: '/auth/student/login',
    failureFlash: true,
  })
);

// ── Password reset ────────────────────────────────────────────────────────
router.get('/forgot-password', AuthController.showForgotPasswordPage);
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema, '/auth/forgot-password'),
  AuthController.handleForgotPassword
);

router.get('/reset-password/:token', AuthController.showResetPasswordPage);
router.post(
  '/reset-password/:token',
  validateBody(resetPasswordSchema, '/auth/forgot-password'),
  AuthController.handleResetPassword
);

// ── Logout ────────────────────────────────────────────────────────────────
router.get('/logout', AuthController.handleLogout);

export default router;
