// routes/admin.js
import express from 'express';
import { Student, School, Payment, Result, User, State, LGA, ExamTimetable, ExamCenter, Certificate, Subject } from '../models/index.js';
import { getGrade } from '../utils/grade.js';
import sendEmail from '../utils/sendEmail.js';
import db from '../config/database.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleMiddleware.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { APP_CONFIG } from '../config/constants.js';

const router = express.Router();
import { Parser } from 'json2csv';
import { Op } from 'sequelize';

// Middleware to ensure user object is available in all views
router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.currentPath = req.path;
  next();
});

/* ---------------- Dashboard ---------------- */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const analytics = { ...APP_CONFIG.DEFAULT_ANALYTICS };
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      analytics,
      user: req.user
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      analytics: { ...APP_CONFIG.DEFAULT_ANALYTICS },
      user: req.user
    });
  }
});

/* ---------------- Subject Management ---------------- */
router.get('/subjects', requireAdmin, async (req, res) => {
  try {
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });
    res.render('admin/subjects', {
      title: 'Manage Subjects',
      subjects,
      user: req.user
    });
  } catch (err) {
    console.error('Subjects error:', err);
    req.flash('error', 'Failed to load subjects');
    res.redirect('/admin/dashboard');
  }
});

router.post('/subjects', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      req.flash('error', 'Subject name is required');
      return res.redirect('/admin/subjects');
    }

    const existingSubject = await Subject.findOne({ where: { name: name.trim() } });
    if (existingSubject) {
      req.flash('error', 'Subject already exists');
      return res.redirect('/admin/subjects');
    }

    await Subject.create({ name: name.trim() });
    req.flash('success', 'Subject added successfully');
    res.redirect('/admin/subjects');
  } catch (err) {
    console.error('Add subject error:', err);
    req.flash('error', 'Failed to add subject');
    res.redirect('/admin/subjects');
  }
});

router.delete('/subjects/:id', requireAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.json({ success: false, error: 'Subject not found' });
    }

    await subject.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.json({ success: false, error: 'Failed to delete subject' });
  }
});

/* ---------------- Students ---------------- */
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const students = await Student.findAll({ 
      include: [{ model: School, attributes: ['name'] }],
      limit: 100,
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/students', {
      title: 'Manage Students',
      students,
      user: req.user
    });
  } catch (err) {
    console.error('Admin Students Error:', err);
    req.flash('error', 'Failed to load students');
    res.redirect('/admin/dashboard');
  }
});

/* ---------------- Schools ---------------- */
router.get('/schools', requireAdmin, async (req, res) => {
  try {
    const schools = await School.findAll({ 
      include: [LGA, State],
      limit: 100,
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/schools', {
      title: 'Manage Schools',
      schools,
      user: req.user
    });
  } catch (err) {
    console.error('Schools error:', err);
    req.flash('error', 'Failed to load schools');
    res.redirect('/admin/dashboard');
  }
});

/* ---------------- Results ---------------- */
router.get('/results', requireAdmin, async (req, res) => {
  try {
    const results = await Result.findAll({
      include: [Student, School],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.render('admin/results', {
      title: 'Manage Results',
      results,
      user: req.user,
      getGrade
    });
  } catch (err) {
    console.error('Results error:', err);
    req.flash('error', 'Failed to load results');
    res.redirect('/admin/dashboard');
  }
});

/* ---------------- Payments ---------------- */
router.get('/payments', requireAdmin, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [Student, School],
      order: [['createdAt', 'DESC']],
      limit: 50
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

/* ---------------- User Management ---------------- */
router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: State, required: false }, { model: School, required: false }],
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

/* ---------------- Settings ---------------- */
router.get('/settings', requireAdmin, async (req, res) => {
  res.render('admin/settings', {
    title: 'System Settings',
    user: req.user
  });
});

/* ---------------- Analytics ---------------- */
router.get('/analytics', requireAdmin, async (req, res) => {
  res.render('admin/analytics', {
    title: 'Analytics Dashboard',
    user: req.user
  });
});

/* ---------------- Timetable ---------------- */
router.get('/timetable', requireAdmin, async (req, res) => {
  res.render('admin/timetable', {
    title: 'Exam Timetable',
    user: req.user
  });
});

/* ---------------- Centers ---------------- */
router.get('/centers', requireAdmin, async (req, res) => {
  res.render('admin/centers', {
    title: 'Exam Centers',
    user: req.user
  });
});

/* ---------------- Certificates ---------------- */
router.get('/certificates', requireAdmin, async (req, res) => {
  res.render('admin/certificates', {
    title: 'Digital Certificates',
    user: req.user
  });
});

/* ---------------- Gazette ---------------- */
router.get('/gazette', requireAdmin, async (req, res) => {
  res.render('admin/gazette', {
    title: 'BECE Gazette',
    user: req.user
  });
});

/* ---------------- Publications ---------------- */
router.get('/publish', requireAdmin, async (req, res) => {
  res.render('admin/publish', {
    title: 'Publications Center',
    user: req.user
  });
});

export default router;