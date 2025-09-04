// controllers/authController.js
import bcrypt from 'bcryptjs';
import passport from 'passport';
import User from '../models/User.js';

// GET login page
export const getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login', error: req.flash('error') });
};

// POST login
export const postLogin = passport.authenticate('local', {
  successRedirect: '/admin/dashboard',
  failureRedirect: '/auth/login',
  failureFlash: true
});

// GET register page
export const getRegister = (req, res) => {
  res.render('auth/register', { title: 'Register', error: req.flash('error') });
};

// POST register
export const postRegister = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already exists.');
      return res.redirect('/auth/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
export const logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/auth/login');
  });
};
