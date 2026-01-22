// routes/admin.js
import express from 'express';
import { Student, School, Payment, Result, User, State, LGA, ExamTimetable, ExamCenter, Certificate, Subject } from '../models/index.js';
import { getGrade } from '../utils/grade.js';
import sendEmail from '../utils/sendEmail.js';
import SMSService from '../services/smsService.js';
import db from '../config/database.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleMiddleware.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { APP_CONFIG } from '../config/constants.js';
import { validateStudentUpdate } from '../middleware/validationMiddleware.js';


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
    // Fetch real analytics data
    const totalStudents = await Student.count();
    const totalSchools = await School.count();
    const totalPayments = await Payment.count({ where: { status: 'success' } });
    const monthlyRevenue = await Payment.sum('amount', { where: { status: 'success' } }) || 0;

    // Recent students
    const recentStudents = await Student.findAll({
      include: [School],
      order: [['createdAt', 'DESC']],
      limit: APP_CONFIG.LIMITS.RECENT_ITEMS
    });

    // Recent payments
    const recentPayments = await Payment.findAll({
      include: [Student, School],
      where: { status: 'success' },
      order: [['createdAt', 'DESC']],
      limit: APP_CONFIG.LIMITS.RECENT_ITEMS
    });

    const analytics = {
      totalStudents,
      totalSchools,
      totalPayments,
      monthlyRevenue,
      recentStudents,
      recentPayments
    };

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

router.get('/dashboard/live/counters', requireAdmin, async (req, res) => {
  try {
    const counters = {
      students: await Student.count(),
      schools: await School.count(),
      paid: await Payment.count({ where: { status: 'success' } })
    };
    res.json({ success: true, counters });
  } catch (err) {
    res.json({ success: false, error: 'Failed to fetch counters' });
  }
});

router.get('/dashboard/live/recent', requireAdmin, async (req, res) => {
  try {
    const recentStudents = await Student.findAll({
      include: [School],
      order: [['createdAt', 'DESC']],
      limit: APP_CONFIG.LIMITS.RECENT_ITEMS,
      attributes: ['id', 'name', 'email', 'createdAt']
    });

    const recentPayments = await Payment.findAll({
      include: [Student, School],
      where: { status: 'success' },
      order: [['createdAt', 'DESC']],
      limit: APP_CONFIG.LIMITS.RECENT_ITEMS,
      attributes: ['id', 'amount', 'reference', 'createdAt']
    });

    res.json({ success: true, recentStudents, recentPayments });
  } catch (err) {
    console.error('Recent data error:', err);
    res.json({ success: false, error: 'Failed to fetch recent data' });
  }
});

router.get('/dashboard/stats', requireAdmin, async (req, res) => {
  try {
    // Get monthly student registrations for the last 6 months
    const labels = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      labels.push(month);
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = await Student.count({
        where: {
          createdAt: {
            [Op.gte]: startOfMonth,
            [Op.lte]: endOfMonth
          }
        }
      });
      
      data.push(count);
    }

    // Students by state
    const studentsByState = await Student.findAll({
      include: [State],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Student.id')), 'count'],
        [sequelize.col('State.name'), 'stateName']
      ],
      group: ['State.id', 'State.name'],
      order: [[sequelize.fn('COUNT', sequelize.col('Student.id')), 'DESC']],
      limit: 10
    });

    res.json({ success: true, chart: { labels, data }, studentsByState });
  } catch (err) {
    console.error('Stats error:', err);
    res.json({ success: false, error: 'Failed to fetch stats' });
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

router.get('/students/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id, {
      include: [School, State, LGA, Result, Payment]
    });

    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/admin/students');
    }

    res.render('admin/view-student', {
      title: 'View Student',
      student,
      user: req.user,
      getGrade
    });
  } catch (err) {
    console.error('View student error:', err);
    req.flash('error', 'Failed to load student');
    res.redirect('/admin/students');
  }
});

router.get('/students/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id, {
      include: [School, State, LGA]
    });

    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/admin/students');
    }

    const states = await State.findAll({ order: [['name', 'ASC']] });
    const schools = await School.findAll({ 
      include: [State],
      order: [['name', 'ASC']] 
    });

    res.render('admin/edit-student', {
      title: 'Edit Student',
      student,
      states,
      schools,
      user: req.user
    });
  } catch (err) {
    console.error('Edit student error:', err);
    req.flash('error', 'Failed to load student');
    res.redirect('/admin/students');
  }
});

router.post('/students/:id', requireAdmin, validateStudentUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, gender, dateOfBirth, guardianPhone, schoolId } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/admin/students');
    }

    await student.update({
      name,
      email,
      gender,
      dateOfBirth,
      guardianPhone,
      schoolId
    });

    // Send notifications for profile update
    try {
      const smsService = new SMSService();
      const smsMessage = `BECE Profile Updated!\nName: ${student.name}\nReg Number: ${student.regNumber}\nYour profile has been updated by an administrator.`;
      await smsService.sendSMS(student.guardianPhone, smsMessage);

      const emailHtml = `
        <h2>BECE Profile Updated</h2>
        <p>Dear ${student.name},</p>
        <p>Your BECE profile has been updated by an administrator.</p>
        <p><strong>Updated Details:</strong></p>
        <ul>
          <li>Name: ${student.name}</li>
          <li>Email: ${student.email}</li>
          <li>Registration Number: ${student.regNumber}</li>
        </ul>
        <p>If you did not request this change, please contact support immediately.</p>
        <p><a href="${process.env.APP_URL || 'https://bece-ng.onrender.com'}/auth/student/login">Login Here</a></p>
        <p>Best regards,<br>BECE Registration Team</p>
      `;
      await sendEmail(student.email, 'BECE Profile Updated', emailHtml);
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail update if notifications fail
    }

    req.flash('success', 'Student updated successfully');
    res.redirect(`/admin/students/${id}`);
  } catch (err) {
    console.error('Update student error:', err);
    req.flash('error', 'Failed to update student');
    res.redirect(`/admin/students/${id}/edit`);
  }
});

/* ---------------- Schools ---------------- */
router.get('/schools', requireAdmin, async (req, res) => {
  try {
    const schools = await School.findAll({ 
      include: [LGA, State, { model: Student, attributes: ['id'] }],
      limit: APP_CONFIG.LIMITS.SCHOOLS_LIST,
      order: [['id', 'DESC']]
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

router.get('/schools/add', requireAdmin, async (req, res) => {
  try {
    const states = await State.findAll();
    const lgas = await LGA.findAll();
    res.render('admin/newSchool', {
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

/* ---------------- School Management ---------------- */
router.get('/schools/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByPk(id, {
      include: [LGA, State, { model: Student, include: [State, LGA] }]
    });

    if (!school) {
      req.flash('error', 'School not found');
      return res.redirect('/admin/schools');
    }

    res.render('admin/view-school', {
      title: 'View School',
      school,
      user: req.user
    });
  } catch (err) {
    console.error('View school error:', err);
    req.flash('error', 'Failed to load school');
    res.redirect('/admin/schools');
  }
});

router.get('/schools/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByPk(id, {
      include: [LGA, State]
    });

    if (!school) {
      req.flash('error', 'School not found');
      return res.redirect('/admin/schools');
    }

    const states = await State.findAll({ order: [['name', 'ASC']] });
    const lgas = await LGA.findAll({ 
      include: [State],
      order: [['name', 'ASC']] 
    });

    res.render('admin/edit-school', {
      title: 'Edit School',
      school,
      states,
      lgas,
      user: req.user
    });
  } catch (err) {
    console.error('Edit school error:', err);
    req.flash('error', 'Failed to load school');
    res.redirect('/admin/schools');
  }
});

router.post('/schools/edit/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lgaId, stateId, address } = req.body;

    const school = await School.findByPk(id);
    if (!school) {
      req.flash('error', 'School not found');
      return res.redirect('/admin/schools');
    }

    await school.update({
      name,
      lgaId,
      stateId,
      address
    });

    req.flash('success', 'School updated successfully');
    res.redirect(`/admin/schools/${id}`);
  } catch (err) {
    console.error('Update school error:', err);
    req.flash('error', 'Failed to update school');
    res.redirect(`/admin/schools/${id}/edit`);
  }
});

/* ---------------- Results ---------------- */
router.get('/results', requireAdmin, async (req, res) => {
  try {
    const results = await Result.findAll({
      include: [Student, School],
      order: [['id', 'DESC']],
      limit: APP_CONFIG.LIMITS.DASHBOARD_ITEMS
    });

    res.render('admin/results', {
      title: 'Manage Results',
      results,
      user: req.user,
      getGrade,
      pagination: { page: 1, limit: 20, total: results.length, totalPages: 1 }
    });
  } catch (err) {
    console.error('Results error:', err);
    req.flash('error', `${APP_CONFIG.MESSAGES.ERROR.FAILED_TO_LOAD} results`);
    res.redirect(APP_CONFIG.ROUTES.ADMIN_DASHBOARD);
  }
});

router.get('/results/new', requireAdmin, async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [School],
      order: [['name', 'ASC']],
      limit: 100 // Limit for performance
    });

    res.render('admin/newResult', {
      title: 'Upload Results',
      students,
      user: req.user
    });
  } catch (err) {
    console.error('New result error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/admin/results');
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
      order: [['id', 'DESC']]
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

router.get('/users/new', requireSuperAdmin, async (req, res) => {
  try {
    const states = await State.findAll({ order: [['name', 'ASC']] });
    const schools = await School.findAll({ 
      include: [State],
      order: [['name', 'ASC']] 
    });

    res.render('admin/add-user', {
      title: 'Add Admin User',
      states,
      schools,
      user: req.user
    });
  } catch (err) {
    console.error('Add user error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/admin/users');
  }
});

router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role, stateId, schoolId, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', APP_CONFIG.MESSAGES.ERROR.EMAIL_EXISTS);
      return res.redirect('/admin/users/new');
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      password, // Will be hashed by model hook
      role,
      stateId: stateId || null,
      schoolId: schoolId || null,
      permissions: permissions ? permissions : {},
      isActive: true
    });

    req.flash('success', APP_CONFIG.MESSAGES.SUCCESS.ADMIN_CREATED);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Create user error:', err);
    req.flash('error', 'Failed to create user');
    res.redirect('/admin/users/new');
  }
});

router.post('/users/:id/toggle', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }

    await user.update({ isActive: !user.isActive });
    res.json({ success: true });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.json({ success: false, error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    if (user.role === 'super_admin') {
      req.flash('error', 'Cannot delete super admin');
      return res.redirect('/admin/users');
    }

    await user.destroy();
    req.flash('success', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Delete user error:', err);
    req.flash('error', 'Failed to delete user');
    res.redirect('/admin/users');
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
    user: req.user,
    stats: { totalStudents: 0, totalResults: 0, passRate: [{ total: 0, passed: 0 }], gradeDistribution: [] }
  });
});

/* ---------------- Timetable ---------------- */
router.get('/timetable', requireAdmin, async (req, res) => {
  try {
    const timetables = await ExamTimetable.findAll({
      include: [{ model: Subject, as: 'subject' }],
      order: [['examDate', 'ASC'], ['startTime', 'ASC']]
    });
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });

    res.render('admin/timetable', {
      title: 'Exam Timetable',
      user: req.user,
      timetables,
      subjects
    });
  } catch (err) {
    console.error('Timetable error:', err);
    res.render('admin/timetable', {
      title: 'Exam Timetable',
      user: req.user,
      timetables: [],
      subjects: []
    });
  }
});

router.post('/timetable', requireAdmin, async (req, res) => {
  try {
    const { examYear, subjectId, examDate, startTime, endTime, paperType, instructions } = req.body;

    // Calculate duration in minutes
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const duration = Math.round((end - start) / (1000 * 60)); // Convert to minutes

    if (duration <= 0) {
      req.flash('error', 'End time must be after start time');
      return res.redirect('/admin/timetable');
    }

    await ExamTimetable.create({
      examYear,
      subjectId,
      examDate,
      startTime,
      endTime,
      duration,
      paperType,
      instructions: instructions || null
    });

    req.flash('success', 'Exam added to timetable successfully');
    res.redirect('/admin/timetable');
  } catch (err) {
    console.error('Add timetable error:', err);
    req.flash('error', 'Failed to add exam to timetable');
    res.redirect('/admin/timetable');
  }
});

router.get('/timetable/export', requireAdmin, async (req, res) => {
  try {
    const timetables = await ExamTimetable.findAll({
      include: [{ model: Subject, as: 'subject' }],
      order: [['examDate', 'ASC'], ['startTime', 'ASC']]
    });

    // Generate CSV content
    let csv = 'Exam Year,Subject,Date,Start Time,End Time,Duration (min),Paper Type,Instructions\n';

    timetables.forEach(timetable => {
      const subjectName = timetable.subject ? timetable.subject.name : 'Unknown';
      const instructions = timetable.instructions ? `"${timetable.instructions.replace(/"/g, '""')}"` : '';
      csv += `${timetable.examYear},${subjectName},${timetable.examDate},${timetable.startTime},${timetable.endTime},${timetable.duration},${timetable.paperType},${instructions}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="exam_timetable.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Export timetable error:', err);
    req.flash('error', 'Failed to export timetable');
    res.redirect('/admin/timetable');
  }
});

/* ---------------- Centers ---------------- */
router.get('/centers', requireAdmin, async (req, res) => {
  try {
    const centers = await ExamCenter.findAll({
      include: [
        { model: State, as: 'state' },
        { model: LGA, as: 'lga' }
      ],
      order: [['name', 'ASC']]
    });
    const states = await State.findAll({ order: [['name', 'ASC']] });
    const lgas = await LGA.findAll({ order: [['name', 'ASC']] });
    const schools = await School.findAll({ order: [['name', 'ASC']] });
    
    res.render('admin/centers', {
      title: 'Exam Centers',
      user: req.user,
      centers,
      states,
      lgas,
      schools
    });
  } catch (err) {
    console.error('Centers error:', err);
    res.render('admin/centers', {
      title: 'Exam Centers',
      user: req.user,
      centers: [],
      states: [],
      lgas: [],
      schools: []
    });
  }
});

router.post('/centers', requireAdmin, async (req, res) => {
  try {
    const { name, code, address, stateId, lgaId, capacity, facilities, contactPerson, contactPhone } = req.body;

    await ExamCenter.create({
      name,
      code,
      address,
      stateId,
      lgaId,
      capacity: parseInt(capacity),
      facilities: facilities || null,
      contactPerson: contactPerson || null,
      contactPhone: contactPhone || null
    });

    req.flash('success', 'Exam center added successfully');
    res.redirect('/admin/centers');
  } catch (err) {
    console.error('Add center error:', err);
    req.flash('error', 'Failed to add exam center');
    res.redirect('/admin/centers');
  }
});

/* ---------------- Certificates ---------------- */
router.get('/certificates', requireAdmin, async (req, res) => {
  res.render('admin/certificates', {
    title: 'Digital Certificates',
    user: req.user,
    certificates: [],
    students: []
  });
});

/* ---------------- Gazette ---------------- */
router.get('/gazette', requireAdmin, async (req, res) => {
  res.render('admin/gazette', {
    title: 'BECE Gazette',
    user: req.user,
    states: [],
    years: [2024, 2023, 2022, 2021, 2020]
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
      if (!existingUser) {
        await User.create({
          name: email === 'maddyahamco00@gmail.com' ? 'Muhammad Kabir Ahmad' : 'Super Admin',
          email,
          password: '123456',
          role: 'super_admin',
          isActive: true,
          permissions: {}
        });
        console.log(`✅ Super admin created: ${email}`);
      } else {
        await existingUser.update({ password: '123456', role: 'super_admin' });
        console.log(`🔄 Super admin password updated: ${email}`);
      }
    }
  } catch (err) {
    console.error('Failed to initialize super admins:', err);
  }
};

export default router;