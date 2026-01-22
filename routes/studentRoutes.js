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
  renderDashboard,
  registerStudent,
  loginStudent,
  renderProfile,
  updateProfile,
  changePassword
} from '../controllers/studentController.js';
import { Student, School, State, LGA, Result, Payment, Subject } from '../models/index.js';
import db from '../config/database.js';
import sendEmail from '../utils/sendEmail.js';
import SMSService from '../services/smsService.js';

const router = express.Router();

// Middleware to set current path for navigation highlighting
router.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

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

// Single-step registration (main route)
router.get('/register', async (req, res) => {
  try {
    const states = await State.findAll({ order: [['name', 'ASC']] });
    const subjects = await Subject.findAll({ order: [['subject_name', 'ASC']] });
    res.render('students/student-registration', {
      title: 'Student Registration',
      messages: req.flash(),
      states,
      subjects,
      preData: {}
    });
  } catch (err) {
    console.error('Registration page error:', err);
    res.status(500).render('error', { message: 'Server error' });
  }
});

router.post('/register', registerStudent);


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
router.post('/login', loginStudent);
router.get('/dashboard', requireStudent, renderDashboard);

// Profile routes
router.get('/profile', requireStudent, renderProfile);
router.post('/profile', requireStudent, updateProfile);
router.post('/change-password', requireStudent, changePassword);

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

    // Send notifications for profile update
    try {
      const smsService = new SMSService();
      const smsMessage = `BECE Profile Updated!\nName: ${student.name}\nReg Number: ${student.regNumber}\nYour profile has been updated successfully.`;
      await smsService.sendSMS(student.guardianPhone, smsMessage);

      const emailHtml = `
        <h2>BECE Profile Updated</h2>
        <p>Dear ${student.name},</p>
        <p>Your BECE profile has been updated successfully.</p>
        <p><strong>Updated Details:</strong></p>
        <ul>
          <li>Name: ${student.name}</li>
          <li>Email: ${student.email}</li>
          <li>Registration Number: ${student.regNumber}</li>
        </ul>
        <p><a href="${process.env.APP_URL || 'https://bece-ng.onrender.com'}/students/dashboard">Access Dashboard</a></p>
        <p>Best regards,<br>BECE Registration Team</p>
      `;
      await sendEmail(student.email, 'BECE Profile Updated', emailHtml);
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail update if notifications fail
    }

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

// Student results page
router.get('/results', requireStudent, async (req, res) => {
  try {
    const { getGrade, getGradeBadge, getGradeRemark } = await import('../utils/grade.js');
    
    const student = await Student.findByPk(req.session.student.id, {
      include: [School, State, LGA]
    });
    
    const results = await Result.findAll({ 
      where: { studentId: req.session.student.id },
      order: [['createdAt', 'DESC']] 
    });
    
    res.render('students/results', {
      title: 'My Results',
      student,
      results,
      getGrade,
      getGradeBadge,
      getGradeRemark,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Results error:', err);
    req.flash('error', 'Error loading results');
    res.redirect('/students/dashboard');
  }
});

// Student payments page
router.get('/payments', requireStudent, async (req, res) => {
  try {
    const student = await Student.findByPk(req.session.student.id);
    const payments = await Payment.findAll({ 
      where: { studentId: req.session.student.id },
      order: [['createdAt', 'DESC']] 
    });
    res.render('students/payments', {
      title: 'My Payments',
      student,
      payments,
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Payments error:', err);
    req.flash('error', 'Error loading payments');
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
