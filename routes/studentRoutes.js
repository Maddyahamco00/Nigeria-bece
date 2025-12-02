// routes/studentRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import {
  renderRegister,
  registerStudent,
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
// Student registration page (supports payment_ref for pre-filling)
// router.get('/register', async (req, res) => {
//   try {
//     const states = await State.findAll({ order: [['name', 'ASC']] }); // fetch from DB

//     const { payment_ref } = req.query;
//     let preData = {};

//     if (payment_ref) {
//       try {
//         const [rows] = await db.query(
//           `SELECT * FROM pre_reg_payments WHERE payment_reference = ? AND payment_status = 'Paid' LIMIT 1`,
//           { replacements: [payment_ref] }
//         );
//         if (rows.length > 0) preData = rows[0];
//       } catch (err) {
//         console.error('Error loading pre-registration data:', err);
//       }
//     }

//     // fetch subjects
//     db.query("SELECT * FROM subjects", (err, subjects) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).send("Error fetching subjects");
//       }

//       return res.render('auth/student-registration', {
//         title: 'Student Registration',
//         states,
//         preData,
//         subjects,
//         messages: req.flash()
//      });
//     });
//   } catch (err) {
//     console.error(err);
//     req.flash('error', 'Could not load registration form.');
//     res.redirect('/');
//   }
// });

// Then in the route:
// routes/studentRoutes.js - Updated with debug logging
// routes/studentRoutes.js - Fixed version
// routes/studentRoutes.js - WORKING VERSION
router.get('/register', async (req, res) => {
  console.log('=== DEBUG: /students/register route hit ===');
  
  try {
    console.log('Fetching states...');
    const states = await State.findAll({ order: [['name', 'ASC']] });
    
    console.log('Fetching subjects...');
    
    // Use raw SQL query that matches your actual database
    let subjects = [];
    try {
      const [subjectRows] = await db.query(`
        SELECT 
          id,
          subject_name as name  -- Only using subject_name, no code
        FROM subjects 
        ORDER BY subject_name ASC
      `);
      subjects = subjectRows;
      console.log(`✓ Subjects found: ${subjects.length}`);
    } catch (sqlErr) {
      console.error('SQL Error fetching subjects:', sqlErr.message);
      // Use empty array if query fails
      subjects = [];
    }
    
    const { payment_ref } = req.query;
    let preData = {};

    if (payment_ref) {
      console.log(`Looking for payment reference: ${payment_ref}`);
      try {
        const [rows] = await db.query(
          `SELECT * FROM pre_reg_payments WHERE payment_reference = ? AND payment_status = 'Paid' LIMIT 1`,
          { replacements: [payment_ref] }
        );
        
        console.log(`✓ Pre-reg payment rows found: ${rows.length}`);
        if (rows.length > 0) {
          preData = rows[0];
          console.log('✓ Pre-data loaded for:', preData.email || preData.name);
        }
      } catch (err) {
        console.error('Error loading pre-registration data:', err);
      }
    }

    console.log('✓ Rendering registration page...');
    
    return res.render('auth/student-registration', {
      title: 'Student Registration',
      states,
      preData,
      subjects,
      messages: req.flash()
    });
    
  } catch (err) {
    console.error('=== REGISTRATION ROUTE ERROR ===');
    console.error('Error details:', err.message);
    
    // Fallback: try to render with minimal data
    try {
      return res.render('auth/student-registration', {
        title: 'Student Registration',
        states: [],
        preData: {},
        subjects: [],
        messages: { ...req.flash(), error: ['Temporary issue loading form. Please try again.'] }
      });
    } catch (renderErr) {
      console.error('Failed to render error page:', renderErr);
      req.flash('error', 'Could not load registration form.');
      res.redirect('/');
    }
  }
});


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

router.post('/register', registerStudent);
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