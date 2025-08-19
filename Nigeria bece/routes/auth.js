
//  routes/auth.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// 🔐 REGISTER ROUTE
// GET /auth/register — show registration form
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});
router.post('/register', [
  check('name').notEmpty().withMessage('Name is required'),
  check('email').isEmail().withMessage('Enter a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).send('User already exists');
    }

    // Create user (password will be hashed by the model hook)
    await User.create({ name, email, password });

    return res.status(201).send('User registered successfully!');
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).send('Internal server error');
  }
});

// 🔐 LOGIN ROUTE
// GET /auth/login — show login form
// 🔐 LOGIN ROUTE
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

router.post('/login', [
  check('email').isEmail().withMessage('Enter a valid email'),
  check('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/login', { 
      title: 'Login', 
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).render('auth/login', { title: 'Login', error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).render('auth/login', { title: 'Login', error: 'Invalid credentials' });
    }

    // ✅ redirect user to dashboard
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).render('auth/login', { title: 'Login', error: 'Internal server error' });
  }
});

module.exports = router;
