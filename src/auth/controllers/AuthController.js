// src/auth/controllers/AuthController.js
// Thin controller layer.
// Receives request → calls service → returns response.
// Zero business logic here.

import passport from 'passport';
import * as AuthService from '../services/AuthService.js';
import * as AuthRepository from '../repositories/AuthRepository.js';
import logger from '../../utils/logger.js';





// ── Page renders ─────────────────────────────────────────────────────────────

export const showLoginPage = (req, res) => {
  if (req.user) return res.redirect('/admin/dashboard');
  if (req.session.student) return res.redirect('/students/dashboard');
  res.render('auth/login', {
    title: 'Login Portal',
    messages: req.flash(),
    logged_out: req.query.logged_out,
  });
};

export const showAdminLoginPage = (req, res) => {
  if (req.user) return res.redirect('/admin/dashboard');
  res.render('auth/admin-login', {
    title: 'Admin Login',
    messages: req.flash(),
  });
};

export const showAdminRegisterPage = async (req, res, next) => {
  try {
    const [states, schools] = await Promise.all([
      AuthRepository.findAllStatesOrderedByName(),
      AuthRepository.findAllSchoolsOrderedByName(),
    ]);

    res.render('auth/admin-register', {
      title: 'Admin Registration',
      states,
      schools,
      messages: req.flash(),
    });
  } catch (err) {
    next(err);
  }
};

export const showStudentLoginPage = (req, res) => {
  res.render('auth/student-login', {
    title: 'Student Login',
    messages: req.flash(),
  });
};

export const showStudentRegisterPage = async (req, res, next) => {
  try {
    const states = await AuthRepository.findAllStatesOrderedByName();

    res.render('auth/student-registration', {
      title: 'Student Registration',
      states,
      messages: req.flash(),
    });
  } catch (err) {
    next(err);
  }
};

export const showForgotPasswordPage = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    messages: req.flash(),
  });
};

export const showResetPasswordPage = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userType = req.query.type || 'student';
    // Validate token exists before rendering the form
    await AuthService.validateResetToken(token, userType);
    res.render('auth/reset-password', {
      title: 'Reset Password',
      token,
      userType,
      messages: req.flash(),
    });
  } catch (err) {
    req.flash('error', 'Invalid or expired reset link.');
    res.redirect('/auth/forgot-password');
  }
};

// ── Admin auth actions ────────────────────────────────────────────────────────

export const handleAdminLogin = (req, res, next) => {
  passport.authenticate('local-admin', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info?.message || 'Invalid credentials');
      return res.redirect('/auth/admin');
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      logger.info('Admin session started', { userId: user.id, role: user.role });
      return res.redirect('/admin/dashboard');
    });
  })(req, res, next);
};

export const handleSharedLogin = (req, res, next) => {
  passport.authenticate('local-admin', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info?.message || 'Invalid credentials');
      return res.redirect('/auth/login');
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.redirect('/admin/dashboard');
    });
  })(req, res, next);
};

export const handleAdminRegister = async (req, res, next) => {
  try {
    await AuthService.registerAdmin(req.body);
    req.flash('success', 'Admin account created. You can now log in.');
    res.redirect('/auth/admin');
  } catch (err) {
    req.flash('error', err.message || 'Registration failed. Please try again.');
    res.redirect('/auth/admin/register');
  }
};

// ── Password reset actions ────────────────────────────────────────────────────

export const handleForgotPassword = async (req, res, next) => {
  try {
    const { email, userType } = req.body;
    await AuthService.initiatePasswordReset(email, userType || 'student');
    req.flash('success', 'If an account exists with that email, a reset link has been sent.');
    res.redirect('/auth/forgot-password');
  } catch (err) {
    next(err);
  }
};

export const handleResetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, userType } = req.body;
    const redirectPath = await AuthService.completePasswordReset(token, password, userType || 'student');
    req.flash('success', 'Password reset successful. You can now log in.');
    res.redirect(redirectPath);
  } catch (err) {
    req.flash('error', err.message || 'Error resetting password. Please try again.');
    res.redirect(`/auth/forgot-password`);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────

export const handleLogout = (req, res, next) => {
  const userId = req.user?.id || req.session?.student?.id;
  req.logout((err) => {
    if (err) return next(err);
    if (req.session) {
      req.session.destroy((destroyErr) => {
        if (destroyErr) logger.warn('Session destroy error on logout', { error: destroyErr.message });
        logger.info('User logged out', { userId });
        res.redirect('/auth/login?logged_out=1');
      });
    } else {
      res.redirect('/auth/login?logged_out=1');
    }
  });
};
