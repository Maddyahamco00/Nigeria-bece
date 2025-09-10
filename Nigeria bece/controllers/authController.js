// controllers/authController.js
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const authController = {
  showRegister: (req, res) => {
    res.render('auth/register', { messages: req.flash() });
  },

  register: async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({ name, email, password: hashedPassword });
      req.flash('success', 'Registration successful. You can now log in.');
      res.redirect('/auth/login');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Something went wrong.');
      res.redirect('/auth/register');
    }
  },

  showLogin: (req, res) => {
    res.render('auth/login', { messages: req.flash() });
  },

  logout: (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      req.flash('success', 'You are logged out.');
      res.redirect('/auth/login');
    });
  },
};

export default authController;

