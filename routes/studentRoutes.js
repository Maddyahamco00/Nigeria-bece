// routes/studentRoutes.js
import express from 'express';
import {
  renderBiodataForm,
  handleBiodata,
  renderSubjectsForm,
  handleSubjects,
  renderPaymentPage,
  renderConfirmationPage,
  renderLogin,
  renderDashboard
} from '../controllers/studentController.js';
import { Student, School, State, LGA, Result, Payment, Subject } from '../models/index.js';
import db from '../config/database.js';

const router = express.Router();

// Middleware to check if student is logged in
// Accept either a legacy req.session.student (used in some controllers)
// or a passport-authenticated user (req.isAuthenticated() and req.user).
const requireStudent = (req, res, next) => {
  if (req.session.student) return next();

  // If Passport has authenticated the user, populate the legacy session object
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated() && req.user) {
    try {
      // Map minimal fields used by the app into req.session.student
      req.session.student = {
        id: req.user.id,
        name: req.user.name || req.user.fullName || '',
        regNumber: req.user.regNumber || '',
        paymentStatus: req.user.paymentStatus || req.user.payment_status || 'pending',
        email: req.user.email || ''
      };
      return next();
    } catch (err) {
      console.error('Error populating session from passport user:', err);
      req.flash('error', 'Please login first');
      return res.redirect('/auth/student/login');
    }
  }

  req.flash('error', 'Please login first');
  res.redirect('/auth/student/login');
};

// Root of /students → simple placeholder or list page
router.get('/', (req, res) => {
  res.render('students/index', { title: 'Students Home' });
});

// Controller-based routes
// Student registration multi-step flow
router.get('/register/biodata', renderBiodataForm);
router.post('/register/biodata', handleBiodata);
router.get('/register/subjects', renderSubjectsForm);
router.post('/register/subjects', handleSubjects);
router.get('/register/payment', renderPaymentPage);
router.get('/register/confirmation', renderConfirmationPage);


// Fetch LGAs by state ID (AJAX)
router.get('/api/lgas/:stateId', async (req, res) => {
  try {
    const { stateId } = req.params;
    const lgas = await LGA.findAll({ where: { stateId } });
    res.json(lgas);
  } catch (err) {
    console.error('❌ Error fetching LGAs:', err);
    res.status(500).json({ error: 'Failed to load LGAs' });
  }
});

router.get('/login', renderLogin);
router.get('/dashboard', requireStudent, renderDashboard);

// Inline route: Student dashboard with full data
router.get('/dashboard/full', requireStudent, async (req, res) => {
  try {
    const studentData = await Student.findByPk(req.session.student.id, {
      include: [
        { model: School, attributes: ['name', 'address'] },
        { model: Result, order: [['createdAt', 'DESC']] },
        { model: Payment, where: { status: 'success' }, required: false }
      ]
    });

    res.render('students/dashboard', {
      title: 'Student Dashboard',
      student: studentData,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/auth/student/login');
  }
});

// Student profile
router.get('/profile', requireStudent, async (req, res) => {
  try {
    const studentData = await Student.findByPk(req.session.student.id, {
      include: [School],
      attributes: { exclude: ['password'] }
    });

    res.render('students/profile', {
      title: 'Student Profile',
      student: studentData,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Profile error:', err);
    req.flash('error', 'Error loading profile');
    res.redirect('/students/dashboard');
  }
});

// Update student profile
router.post('/profile', requireStudent, async (req, res) => {
  try {
    const { name, email, guardianPhone } = req.body;
    const student = await Student.findByPk(req.session.student.id);

    await student.update({ name, email, guardianPhone });

    req.session.student.name = name;

    req.flash('success', 'Profile updated successfully');
    res.redirect('/students/profile');
  } catch (err) {
    console.error('Profile update error:', err);
    req.flash('error', 'Error updating profile');
    res.redirect('/students/profile');
  }
});

// Payment simulation
router.post('/payment/simulate', requireStudent, async (req, res) => {
  try {
    const student = await Student.findByPk(req.session.student.id);
    student.paymentStatus = 'Paid';
    await student.save();

    req.session.student.paymentStatus = 'Paid';

    req.flash('success', 'Payment simulation successful!');
    res.redirect('/students/dashboard');
  } catch (err) {
    console.error('Payment error:', err);
    req.flash('error', 'Payment simulation failed');
    res.redirect('/students/dashboard');
  }
});

// Student logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/auth/student/login');
  });
});

export default router;
