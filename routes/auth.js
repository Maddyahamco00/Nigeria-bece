// routes/auth.js
import express from 'express';
import passport from 'passport';
import { User, Student, State, LGA, School, Subject } from '../models/index.js';
import sendEmail, { sendTemplateEmail } from '../utils/sendEmail.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import db from '../config/database.js';

const router = express.Router();

/* ===== SHARED AUTHENTICATION PAGES ===== */

// Login selection page
router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Login Portal',
    messages: req.flash(),
    logged_out: req.query.logged_out
  });
});



// Root of /auth → redirect to login
router.get('/', (req, res) => {
  if (req.user) {
    return res.redirect('/admin/dashboard');
  }
  if (req.session.student) {
    return res.redirect('/students/dashboard');
  }
  res.redirect('/auth/login');
});

/* ===== ADMIN AUTHENTICATION ===== */

// Admin login page
router.get('/admin', (req, res) => {
  if (req.user) {
    return res.redirect('/admin/dashboard');
  }
  res.render('auth/admin-login', {
    title: 'Admin Login',
    messages: req.flash()
  });
});

// Main login redirect to admin
router.post('/login', (req, res) => {
  res.redirect('/auth/admin');
});

// Admin registration page
router.get('/admin/register', async (req, res) => {
  try {
    const states = await State.findAll();
    const schools = await School.findAll({ include: [State] });
    
    res.render('auth/admin-register', {
      title: 'Admin Registration',
      states,
      schools,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Admin register page error:', err);
    req.flash('error', 'Failed to load registration page');
    res.redirect('/auth/admin');
  }
});

// Admin registration handler
router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, stateId, schoolId } = req.body;
    
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/auth/admin/register');
    }
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already exists');
      return res.redirect('/auth/admin/register');
    }
    
    const userData = {
      name,
      email,
      password,
      role: role || 'admin',
      isActive: true
    };
    
    if (role === 'state_admin' && stateId) {
      userData.stateId = stateId;
    }
    if (role === 'school_admin' && schoolId) {
      userData.schoolId = schoolId;
    }
    
    await User.create(userData);
    req.flash('success', 'Admin account created successfully! You can now login.');
    res.redirect('/auth/admin');
  } catch (err) {
    console.error('Admin registration error:', err);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/auth/admin/register');
  }
});

// Admin login handler
router.post('/admin', (req, res, next) => {
  passport.authenticate('local-admin', (err, user, info) => {
    if (err) {
      console.error('Admin auth error:', err);
      req.flash('error', 'Authentication error');
      return res.redirect('/auth/admin');
    }
    if (!user) {
      req.flash('error', info?.message || 'Invalid credentials');
      return res.redirect('/auth/admin');
    }
    
    // Check if user is active
    if (!user.isActive) {
      req.flash('error', 'Account is deactivated');
      return res.redirect('/auth/admin');
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        req.flash('error', 'Login failed');
        return res.redirect('/auth/admin');
      }
      console.log('Admin logged in:', user.email, 'Role:', user.role);
      return res.redirect('/admin/dashboard');
    });
  })(req, res, next);
});

/* ===== STUDENT AUTHENTICATION ===== */

// Registration page (redirect to biodata)
router.get('/register', (req, res) => {
  res.redirect('/students/register/biodata');
});

// Handle registration form submission (redirect to biodata)
router.post('/register', (req, res) => {
  res.redirect('/students/register/biodata');
});

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

    // Send reset link by email (non-blocking)
    try {
      if (user.email) {
        const html = `
          <p>Hello,</p>
          <p>A password reset was requested for your account. Click the link below to reset your password (valid for 1 hour):</p>
          <p><a href="${resetUrl}">Reset your password</a></p>
          <p>If you did not request this, please ignore this email.</p>
        `;
        sendEmail(user.email, 'Password Reset - Nigeria BECE Portal', html);
      }
    } catch (err) {
      console.error('Failed to send reset email:', err);
    }

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
    try {
      if (user.email) {
        const html = `
          <p>Hello,</p>
          <p>Your password has been changed successfully. If you did not perform this action, contact support immediately.</p>
        `;
        sendEmail(user.email, 'Password Changed - Nigeria BECE Portal', html);
      }
    } catch (err) {
      console.error('Failed to send password changed email:', err);
    }
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
    if (err) console.error('Logout error:', err);

    // If a session exists, destroy it. Redirect with a query flag so
    // the login page can show a friendly message without relying on flash.
    const redirectUrl = '/auth/login?logged_out=1';

    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
        res.redirect(redirectUrl);
      });
    } else {
      res.redirect(redirectUrl);
    }
  });
});

export default router;