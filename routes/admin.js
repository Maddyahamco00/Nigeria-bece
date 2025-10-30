// routes/admin.js
import express from 'express';
import { Student, School, Payment, Result, User, State, LGA } from '../models/index.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleMiddleware.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// protect all admin routes
router.use(isAuthenticated, isAdmin);

/* ---------------- Dashboard ---------------- */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const stats = {
      students: await Student.count(),
      schools: await School.count(),
      payments: await Payment.count({ where: { status: 'success' } }),
      pendingPayments: await Payment.count({ where: { status: 'pending' } })
    };

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      analytics: stats,
      user: req.user
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/admin/dashboard');
  }
});

/* ---------------- User Management ---------------- */
router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/users', {
      title: 'Manage Users',
      users,
      user: req.user
    });
  } catch (err) {
    console.error('Users error:', err);
    req.flash('error', 'Failed to load users');
    res.redirect('/admin/dashboard');
  }
});

/* ---------------- Export ---------------- */
router.get('/export/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    if (!['students', 'payments', 'schools'].includes(type)) {
      req.flash('error', 'Invalid export type');
      return res.redirect('/admin/dashboard');
    }

    // TODO: Add export logic
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Export error:', err);
    req.flash('error', 'Export failed');
    res.redirect('/admin/dashboard');
  }
});

/* ---------------- Schools ---------------- */
router.get('/schools', requireAdmin, async (req, res) => {
  try {
    const schools = await School.findAll({ include: [LGA, State, Student] });
    const lgas = await LGA.findAll();

    res.render('admin/schools', {
      title: 'Manage Schools',
      schools,
      lgas,
      user: req.user
    });
  } catch (err) {
    console.error('Schools error:', err);
    req.flash('error', 'Failed to load schools');
    res.redirect('/admin/dashboard');
  }
});

router.post('/schools', requireAdmin, async (req, res) => {
  try {
    const { name, stateCode, lgaId, schoolSerial, address } = req.body;
    const userId = req.user?.id || 1;

    // Resolve stateCode to stateId (database expects stateId)
    const state = await State.findOne({ where: { code: stateCode } });
    if (!state) {
      req.flash('error', 'Invalid state selected');
      return res.redirect('/admin/schools');
    }

    await School.create({
      name,
      lgaId,
      address,
      stateCode,
      stateId: state.id,
      schoolSerial,
      userId
    });

    req.flash('success', 'School added successfully');
    res.redirect('/admin/schools');
  } catch (err) {
    console.error('School Registration Error:', err);
    req.flash('error', 'Failed to add school');
    res.redirect('/admin/schools');
  }
});

router.get('/schools/new', requireAdmin, async (req, res) => {
  try {
    const states = await State.findAll();
    const lgas = await LGA.findAll();

    // Render the add form located at views/admin/schools/add.ejs
    res.render('admin/schools/add', {
      title: 'Add School',
      states,
      lgas,
      user: req.user
    });
  } catch (err) {
    console.error('Add school error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/admin/schools');
  }
});

// Support the legacy /admin/schools/add route (some templates/link point here)
router.get('/schools/add', requireAdmin, async (req, res) => {
  try {
    const states = await State.findAll();
    const lgas = await LGA.findAll();
    res.render('admin/schools/add', {
      title: 'Add School',
      states,
      lgas,
      user: req.user
    });
  } catch (err) {
    console.error('Add school error (legacy):', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/admin/schools');
  }
});

// Support form posts to /admin/schools/add (matches views/admin/schools/add.ejs form action)
router.post('/schools/add', requireAdmin, async (req, res) => {
  try {
    const { name, stateCode, lgaId, schoolSerial, address } = req.body;
    const userId = req.user?.id || 1;

    // Resolve stateCode to stateId (database expects stateId)
    const state = await State.findOne({ where: { code: stateCode } });
    if (!state) {
      req.flash('error', 'Invalid state selected');
      return res.redirect('/admin/schools/add');
    }

    await School.create({
      name,
      lgaId,
      address,
      stateCode,
      stateId: state.id,
      schoolSerial,
      userId
    });

    req.flash('success', 'School added successfully');
    res.redirect('/admin/schools');
  } catch (err) {
    console.error('Create school error (legacy):', err);
    req.flash('error', 'Failed to add school');
    res.redirect('/admin/schools/add');
  }
});

/* ---------------- Students ---------------- */
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const students = await Student.findAll({ include: School });
    const schools = await School.findAll();

    res.render('admin/students', {
      title: 'Manage Students',
      students,
      schools,
      user: req.user
    });
  } catch (err) {
    console.error('Admin Students Error:', err);
    req.flash('error', 'Failed to load students');
    res.redirect('/admin/dashboard');
  }
});

router.get('/students/new', requireAdmin, (req, res) => {
  res.redirect('/students/register');
});

/* ---------------- Results ---------------- */
router.get('/results', requireAdmin, async (req, res) => {
  try {
    const results = await Result.findAll({
      include: [Student, School],
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/results', {
      title: 'Manage Results',
      results,
      user: req.user
    });
  } catch (err) {
    console.error('Results error:', err);
    req.flash('error', 'Failed to load results');
    res.redirect('/admin/dashboard');
  }
});

router.get('/results/new', requireAdmin, async (req, res) => {
  try {
    const students = await Student.findAll({ include: School });

    res.render('admin/newResult', {
      title: 'Add New Result',
      students,
      user: req.user
    });
  } catch (err) {
    console.error('New result error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/admin/results');
  }
});

// Create new result (handle form POST from views/admin/newResult.ejs)
router.post('/results', requireAdmin, async (req, res) => {
  try {
    const { studentId: studentRegOrId, subject, score } = req.body;

    // Support either entering regNumber (string) or numeric student id
    let student = null;
    if (!studentRegOrId) {
      req.flash('error', 'Student registration number or ID is required');
      return res.redirect('/admin/results/new');
    }

    if (/^\d+$/.test(String(studentRegOrId).trim())) {
      // numeric -> try by PK first
      student = await Student.findByPk(parseInt(studentRegOrId, 10));
    }

    if (!student) {
      // fallback: lookup by regNumber
      student = await Student.findOne({ where: { regNumber: studentRegOrId } });
    }

    if (!student) {
      req.flash('error', 'Student not found for the provided registration number/ID');
      return res.redirect('/admin/results/new');
    }

    // Create result record; use student's schoolId to satisfy NOT NULL constraint
    await Result.create({
      subject: subject.trim(),
      score: parseInt(score, 10) || 0,
      studentId: student.id,
      schoolId: student.schoolId || null
    });

    req.flash('success', 'Result saved successfully');
    res.redirect('/admin/results');
  } catch (err) {
    console.error('Create result error:', err);
    req.flash('error', 'Failed to save result');
    res.redirect('/admin/results/new');
  }
});

/* ---------------- Payments ---------------- */
router.get('/payments', requireAdmin, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [Student, School],
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/payments', {
      title: 'Manage Payments',
      payments,
      user: req.user
    });
  } catch (err) {
    console.error('Payments error:', err);
    req.flash('error', 'Failed to load payments');
    res.redirect('/admin/dashboard');
  }
});

/* ---------------- Settings ---------------- */
router.get('/settings', requireAdmin, async (req, res) => {
  res.render('admin/settings', {
    title: 'System Settings',
    user: req.user
  });
});

router.post('/settings', requireAdmin, async (req, res) => {
  try {
    req.flash('success', 'Settings updated successfully');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error('Settings Save Error:', err);
    req.flash('error', 'Failed to save settings');
    res.redirect('/admin/settings');
  }
});

/* ---------------- Profile ---------------- */
router.get('/profile', requireAdmin, async (req, res) => {
  res.render('admin/profile', {
    title: 'Admin Profile',
    user: req.user
  });
});

export default router;