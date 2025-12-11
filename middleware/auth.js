// middleware/auth.js
import passport from 'passport';
import initializePassport from '../config/passport.js';

initializePassport(passport);

export const setupPassport = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (req.session.admin || req.session.student || (req.isAuthenticated && req.isAuthenticated())) {
    return next();
  }
  req.flash('error', 'Please log in first');
  res.redirect('/auth/login');
};

// Middleware to check if user is an admin
export const isAdmin = (req, res, next) => {
  if (req.session.admin || (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'super_admin'))) {
    return next();
  }
  req.flash('error', 'Admins only');
  res.redirect('/auth/login');
};

// Middleware to ensure student session
export const ensureStudent = (req, res, next) => {
  if (!req.session.studentId) return res.redirect('/students/login');
  next();
};