// routes/auth.js
import express from 'express';
import passport from 'passport';
import { User, Student, State, LGA, School } from '../models/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';

const router = express.Router();

/* ===== SHARED AUTHENTICATION PAGES ===== */

// Login selection page
router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Login Portal',
    messages: req.flash()
  });
});

// Registration page (student registration)
router.get('/register', async (req, res) => {
  try {
    const states = await State.findAll();
    res.render('auth/register', {
      title: 'Registration Portal',
      messages: req.flash(),
      states
    });
  } catch (err) {
    console.error('Registration page error:', err);
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Root of /auth → redirect to login
router.get('/', (req, res) => {
  if (req.session.student) return res.redirect('/students/dashboard');
  if (req.session.admin) return res.redirect('/admin/dashboard');
  res.redirect('/auth/login');
});

/* ===== ADMIN AUTHENTICATION ===== */

// Admin login page
router.get('/admin', (req, res) => {
  res.render('auth/admin-login', {
    title: 'Admin Login',
    messages: req.flash()
  });
});

// Admin login handler
router.post('/admin',
  passport.authenticate('local-admin', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/auth/admin',
    failureFlash: true
  })
);

/* ===== STUDENT AUTHENTICATION ===== */

// Student registration page
router.get('/student/register', async (req, res) => {
  try {
    const states = await State.findAll();
    // Render the existing template filename: views/auth/student-registration.ejs
    res.render('auth/student-registration', {
      title: 'Student Registration',
      states,
      messages: req.flash()
    });
  } catch (err) {
    console.error("Registration page error:", err);
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Student registration handler
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, stateId, lgaId, schoolId, gender, dob, guardianPhone } = req.body;

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/auth/student/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({
      name,
      email,
      password: hashedPassword,
      gender,
      dateOfBirth: dob,
      guardianPhone,
      stateId,
      lgaId,
      schoolId,
      paymentStatus: 'Pending'
    });

    const regNumber = `BECE2024${student.id.toString().padStart(6, '0')}`;
    student.regNumber = regNumber;
    await student.save();

    req.flash('success', `Registration successful! Your Registration Number: ${regNumber}`);
    res.redirect('/auth/student/login');
  } catch (err) {
    console.error("Registration error:", err);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/auth/student/register');
  }
});

// Student login page
router.get('/student/login', (req, res) => {
  res.render('auth/student-login', {
    title: 'Student Login',
    messages: req.flash()
  });
});

// Student login handler using Passport
router.post('/student/login',
  passport.authenticate('local-student', {
    successRedirect: '/students/dashboard',
    failureRedirect: '/auth/student/login',
    failureFlash: true
  })
);

/* ===== PASSWORD RESET FUNCTIONALITY ===== */

// Forgot password page
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    messages: req.flash()
  });
});

// Forgot password handler
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, userType } = req.body;

    let user;
    if (userType === 'admin') {
      user = await User.findOne({ where: { email } });
    } else {
      user = await Student.findOne({ where: { email } });
    }

    if (!user) {
      req.flash('error', 'If an account exists with this email, a reset link will be sent.');
      return res.redirect('/auth/forgot-password');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiration = new Date(Date.now() + 3600000);

    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/auth/reset-password/${resetToken}?type=${userType}`;
    console.log('Password reset URL:', resetUrl);

    req.flash('success', 'Password reset link generated. Check console for demo.');
    res.redirect('/auth/forgot-password');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error', 'Error processing request');
    res.redirect('/auth/forgot-password');
  }
});

// Reset password page
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { type } = req.query;

    let user;
    if (type === 'admin') {
      user = await User.findOne({
        where: {
          resetToken: token,
          resetTokenExpiration: { [Op.gt]: new Date() }
        }
      });
    } else {
      user = await Student.findOne({
        where: {
          resetToken: token,
          resetTokenExpiration: { [Op.gt]: new Date() }
        }
      });
    }

    if (!user) {
      req.flash('error', 'Invalid or expired reset token.');
      return res.redirect('/auth/forgot-password');
    }

    res.render('auth/reset-password', {
      title: 'Reset Password',
      token,
      userType: type,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Reset password error:', err);
    req.flash('error', 'Error processing reset request');
    res.redirect('/auth/forgot-password');
  }
});

// Reset password handler
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword, userType } = req.body;

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect(`/auth/reset-password/${token}?type=${userType}`);
    }

    let user;
    if (userType === 'admin') {
      user = await User.findOne({
        where: {
          resetToken: token,
          resetTokenExpiration: { [Op.gt]: new Date() }
        }
      });
    } else {
      user = await Student.findOne({
        where: {
          resetToken: token,
          resetTokenExpiration: { [Op.gt]: new Date() }
        }
      });
    }

    if (!user) {
      req.flash('error', 'Invalid or expired reset token.');
      return res.redirect('/auth/forgot-password');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();

    req.flash('success', 'Password reset successful. You can now login with your new password.');
    res.redirect(userType === 'admin' ? '/auth/admin' : '/auth/student/login');
  } catch (err) {
    console.error('Reset password error:', err);
    req.flash('error', 'Error resetting password');
    res.redirect(`/auth/reset-password/${token}`);
  }
});

/* ===== SHARED LOGOUT ===== */

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('Admin logout error:', err);

    req.session.destroy((err) => {
      if (err) console.error('Student session destroy error:', err);
      req.flash('success', 'Logged out successfully');
      res.redirect('/auth/login');
    });
  });
});

export default router;