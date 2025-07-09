//Handles user authentication (login, registration, logout).
const bcrypt = require('bcryptjs');
const passport = require('passport');
const pool = require('../config/database');

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login', error: req.flash('error') });
};

exports.postLogin = passport.authenticate('local', {
  successRedirect: '/admin/dashboard',
  failureRedirect: '/auth/login',
  failureFlash: true
});

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Register', error: req.flash('error') });
};

exports.postRegister = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length) {
      req.flash('error', 'Email already exists.');
      return res.redirect('/auth/register');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPassword, name]);
    req.flash('success', 'Registration successful. Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    req.flash('error', 'An error occurred.');
    res.redirect('/auth/register');
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/auth/login');
  });
};