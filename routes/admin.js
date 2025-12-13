// routes/admin.js
import express from 'express';
import { Student, School, Payment, Result, User, State, LGA, ExamTimetable, ExamCenter, Certificate, Subject } from '../models/index.js';
import { getGrade } from '../utils/grade.js';
import sendEmail from '../utils/sendEmail.js';
import db from '../config/database.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleMiddleware.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { APP_CONFIG } from '../config/constants.js';
import bcrypt from 'bcryptjs';

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
    const subjects = await Subject.findAll({ order: APP_CONFIG.DB_FIELDS.ORDER_BY_NAME });
    res.render('admin/subjects', {
      title: 'Manage Subjects',
      subjects,
      user: req.user
    });
  } catch (err) {
    console.error('Subjects error:', err);
    req.flash('error', `${APP_CONFIG.MESSAGES.ERROR.FAILED_TO_LOAD} subjects`);
    res.redirect(APP_CONFIG.ROUTES.ADMIN_DASHBOARD);
  }
});

router.post('/subjects', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      req.flash('error', APP_CONFIG.MESSAGES.ERROR.SUBJECT_REQUIRED);
      return res.redirect(APP_CONFIG.ROUTES.ADMIN_SUBJECTS);
    }

    const existingSubject = await Subject.findOne({ where: { name: name.trim() } });
    if (existingSubject) {
      req.flash('error', APP_CONFIG.MESSAGES.ERROR.SUBJECT_EXISTS);
      return res.redirect(APP_CONFIG.ROUTES.ADMIN_SUBJECTS);
    }

    await Subject.create({ name: name.trim() });
    req.flash('success', APP_CONFIG.MESSAGES.SUCCESS.SUBJECT_ADDED);
    res.redirect(APP_CONFIG.ROUTES.ADMIN_SUBJECTS);
  } catch (err) {
    console.error('Add subject error:', err);
    req.flash('error', `${APP_CONFIG.MESSAGES.ERROR.FAILED_TO_ADD} subject`);
    res.redirect(APP_CONFIG.ROUTES.ADMIN_SUBJECTS);
  }
});

router.delete('/subjects/:id', requireAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.json({ success: false, error: APP_CONFIG.MESSAGES.ERROR.SUBJECT_NOT_FOUND });
    }

    await subject.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.json({ success: false, error: `${APP_CONFIG.MESSAGES.ERROR.FAILED_TO_DELETE} subject` });
  }
});

/* ---------------- Students ---------------- */
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const students = await Student.findAll({ 
      include: [{ model: School, attributes: ['name'] }],
      limit: APP_CONFIG.LIMITS.STUDENTS_LIST,
      order: APP_CONFIG.DB_FIELDS.ORDER_BY_CREATED
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
      limit: APP_CONFIG.LIMITS.SCHOOLS_LIST,
      order: APP_CONFIG.DB_FIELDS.ORDER_BY_CREATED
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
      order: APP_CONFIG.DB_FIELDS.ORDER_BY_CREATED,
      limit: APP_CONFIG.LIMITS.DASHBOARD_ITEMS
    });

    res.render('admin/results', {
      title: 'Manage Results',
      results,
      user: req.user,
      getGrade
    });
  } catch (err) {
    console.error('Results error:', err);
    req.flash('error', `${APP_CONFIG.MESSAGES.ERROR.FAILED_TO_LOAD} results`);
    res.redirect(APP_CONFIG.ROUTES.ADMIN_DASHBOARD);
  }
});

/* ---------------- Payments ---------------- */
router.get('/payments', requireAdmin, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [Student, School],
      order: APP_CONFIG.DB_FIELDS.ORDER_BY_CREATED,
      limit: APP_CONFIG.LIMITS.DASHBOARD_ITEMS
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
      attributes: { exclude: APP_CONFIG.DB_FIELDS.EXCLUDE_PASSWORD },
      include: [{ model: State, required: false }, { model: School, required: false }],
      order: APP_CONFIG.DB_FIELDS.ORDER_BY_CREATED
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

/* ---------------- Initialize Super Admins ---------------- */
export const initializeSuperAdmins = async () => {
  try {
    const superAdminEmails = ['maddyahamco00@gmail.com', 'superadmin@bece.gov.ng'];
    
    for (const email of superAdminEmails) {
      const existingUser = await User.findOne({ where: { email } });
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      if (!existingUser) {
        await User.create({
          name: email === 'maddyahamco00@gmail.com' ? 'Muhammad Kabir Ahmad' : 'Super Admin',
          email,
          password: hashedPassword,
          role: APP_CONFIG.ROLES.SUPER_ADMIN,
          isActive: true,
          permissions: {}
        });
        console.log(`✅ Super admin created: ${email}`);
      } else {
        await existingUser.update({ password: hashedPassword, role: APP_CONFIG.ROLES.SUPER_ADMIN });
        console.log(`🔄 Super admin password updated: ${email}`);
      }
    }
  } catch (err) {
    console.error('Failed to initialize super admins:', err);
  }
};

export default router;