const express = require('express');
const router = express.Router();
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// Login page
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin/dashboard');
  }
  res.render('auth/login', { title: 'Login', errors: req.flash('error') });
});

// Handle login
router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Please enter a valid email'),
    check('password').notEmpty().withMessage('Password is required'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg));
      return res.redirect('/auth/login');
    }

    passport.authenticate('local', {
      successRedirect: '/admin/dashboard',
      failureRedirect: '/auth/login',
      failureFlash: true,
    })(req, res, next);
  }
);

// Registration page
router.get('/register', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin/dashboard');
  }
  res.render('auth/register', { title: 'Register', errors: req.flash('error') });
});

// Handle registration
router.post(
  '/register',
  [
    check('name').notEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Please enter a valid email'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    check('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg));
      return res.redirect('/auth/register');
    }

    try {
      const { name, email, password } = req.body;
      const existing = await User.findByEmail(email);
      if (existing) {
        req.flash('error', 'Email already registered');
        return res.redirect('/auth/register');
      }

      await User.create({ name, email, password });
      req.flash('success', 'Registration successful! Please log in.');
      res.redirect('/auth/login');
    } catch (err) {
      req.flash('error', 'Server error. Please try again.');
      res.redirect('/auth/register');
    }
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      req.flash('error', 'Error logging out');
      return res.redirect('/admin/dashboard');
    }
    req.flash('success', 'Successfully logged out');
    res.redirect('/auth/login');
  });
});

module.exports = router;
// Middleware to check if user is authenticated