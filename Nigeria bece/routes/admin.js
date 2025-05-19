const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const Student = require('../models/Student');
const School = require('../models/School');
const { check, validationResult } = require('express-validator');

// Ensure user is authenticated and an admin
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const studentCount = await Student.count();
    const schoolCount = await School.count();
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      studentCount,
      schoolCount,
    });
  } catch (err) {
    req.flash('error', 'Error loading dashboard');
    res.redirect('/auth/login');
  }
});

// Students list
router.get('/students', async (req, res) => {
  try {
    const students = await Student.findAll();
    res.render('admin/students', {
      title: 'Manage Students',
      user: req.user,
      students,
    });
  } catch (err) {
    req.flash('error', 'Error fetching students');
    res.redirect('/admin/dashboard');
  }
});

// Add student
router.post(
  '/students/add',
  [
    check('firstName').notEmpty().withMessage('First name is required'),
    check('lastName').notEmpty().withMessage('Last name is required'),
    check('schoolId').notEmpty().withMessage('School is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg));
      return res.redirect('/admin/students');
    }

    try {
      const { firstName, lastName, schoolId } = req.body;
      await Student.create({ firstName, lastName, schoolId });
      req.flash('success', 'Student added successfully');
      res.redirect('/admin/students');
    } catch (err) {
      req.flash('error', 'Error adding student');
      res.redirect('/admin/students');
    }
  }
);

// Schools list
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.findAll();
    res.render('admin/schools', {
      title: 'Manage Schools',
      user: req.user,
      schools,
    });
  } catch (err) {
    req.flash('error', 'Error fetching schools');
    res.redirect('/admin/dashboard');
  }
});

// Add school
router.post(
  '/schools/add',
  [
    check('name').notEmpty().withMessage('School name is required'),
    check('stateId').notEmpty().withMessage('State is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg));
      return res.redirect('/admin/schools');
    }

    try {
      const { name, stateId } = req.body;
      await School.create({ name, stateId });
      req.flash('success', 'School added successfully');
      res.redirect('/admin/schools');
    } catch (err) {
      req.flash('error', 'Error adding school');
      res.redirect('/admin/schools');
    }
  }
);

// Profile page
router.get('/profile', (req, res) => {
  res.render('admin/profile', {
    title: 'Admin Profile',
    user: req.user,
  });
});

// Update profile
router.post('/profile', async (req, res) => {
  try {
    const { name, email } = req.body;
    await User.update(req.user.id, { name, email });
    req.flash('success', 'Profile updated successfully');
    res.redirect('/admin/profile');
  } catch (err) {
    req.flash('error', 'Error updating profile');
    res.redirect('/admin/profile');
  }
});

module.exports = router;