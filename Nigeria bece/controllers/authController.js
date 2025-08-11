//Handles user authentication (login, registration, logout).
// controllers/authController.js

const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

// GET login page
exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login', error: req.flash('error') });
};

// POST login
exports.postLogin = passport.authenticate('local', {
  successRedirect: '/admin/dashboard',
  failureRedirect: '/auth/login',
  failureFlash: true
});

// GET register page
exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Register', error: req.flash('error') });
};

// POST register (Sequelize)
exports.postRegister = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    // Check if email exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already exists.');
      return res.redirect('/auth/register');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({ email, password: hashedPassword, name });

    req.flash('success', 'Registration successful. Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred.');
    res.redirect('/auth/register');
  }
};

// Logout
exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/auth/login');
  });
};
