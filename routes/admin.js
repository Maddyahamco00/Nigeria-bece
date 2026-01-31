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
import { Parser } from 'json2csv';
import { Op, QueryTypes } from 'sequelize';

const router = express.Router();

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
    
    // Calculate monthly revenue for current month
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthlyRevenue = await Payment.sum('amount', { 
      where: { 
        status: 'success',
        createdAt: {
          [Op.gte]: startOfMonth,
          [Op.lte]: endOfMonth
        }
      } 
    }) || 0;

    // Recent students
    const recentStudents = await Student.findAll({
      include: [School],
      order: [['createdAt', 'DESC']],
      limit: APP_CONFIG.LIMITS.RECENT_ITEMS
    });

    // Recent payments with student data
    const recentPayments = await Payment.findAll({
      include: [Student, School],
      where: { status: 'success' },
      order: [['createdAt', 'DESC']],
      limit: APP_CONFIG.LIMITS.RECENT_ITEMS
    });

    // Add payment status to recent students
    const studentsWithPaymentStatus = await Promise.all(
      recentStudents.map(async (student) => {
        const payment = await Payment.findOne({
          where: { 
            email: student.email,
            status: 'success'
          }
        });
        return {
          ...student.toJSON(),
          paymentStatus: payment ? 'Paid' : 'Pending'
        };
      })
    );

    const analytics = {
      totalStudents,
      totalSchools,
      totalPayments,
      monthlyRevenue,
      recentStudents: studentsWithPaymentStatus,
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
      paid: await Payment.count({ where: { status: 'success' } }),
      totalPayments: await Payment.count(),
      pendingPayments: await Payment.count({ where: { status: 'pending' } })
    };
    res.json({ success: true, counters });
  } catch (err) {
    console.error('Counters error:', err);
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

    // Add payment status to recent students - simplified approach
    const studentsWithPaymentStatus = await Promise.all(
      recentStudents.map(async (student) => {
        const payment = await Payment.findOne({
          where: { 
            email: student.email,
            status: 'success'
          }
        });
        return {
          ...student.toJSON(),
          paymentStatus: payment ? 'Paid' : 'Pending'
        };
      })
    );

    const recentPayments = await Payment.findAll({
      include: [Student, School],
      where: { status: 'success' },
      order: [['createdAt', 'DESC']],
      limit: APP_CONFIG.LIMITS.RECENT_ITEMS,
      attributes: ['id', 'amount', 'reference', 'createdAt', 'email']
    });

    res.json({ success: true, recentStudents: studentsWithPaymentStatus, recentPayments });
  } catch (err) {
    console.error('Recent data error:', err);
    res.json({ success: false, error: 'Failed to fetch recent data' });
  }
});

router.get('/dashboard/stats', requireAdmin, async (req, res) => {
  try {
    // Get monthly payment data for the last 6 months
    const labels = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      labels.push(month);
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Get total payment amount for successful payments in this month
      const monthlyTotal = await Payment.sum('amount', {
        where: {
          status: 'success',
          createdAt: {
            [Op.gte]: startOfMonth,
            [Op.lte]: endOfMonth
          }
        }
      }) || 0;
      
      data.push(monthlyTotal);
    }

    // Students by state with proper sequelize import
    const studentsByState = await db.query(`
      SELECT s.name as state, COUNT(st.id) as count 
      FROM states s 
      LEFT JOIN students st ON s.id = st.stateId 
      GROUP BY s.id, s.name 
      HAVING COUNT(st.id) > 0
      ORDER BY count DESC 
      LIMIT 10
    `, { type: QueryTypes.SELECT });

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

router.post('/schools', requireAdmin, async (req, res) => {
  try {
    const { name, stateId, lgaId, address, schoolSerial, stateCode } = req.body;
    
    if (!name || !stateId || !lgaId || !address) {
      req.flash('error', 'All fields are required');
      return res.redirect('/admin/schools/add');
    }

    // Check if school already exists
    const existingSchool = await School.findOne({ 
      where: { name, lgaId } 
    });
    
    if (existingSchool) {
      req.flash('error', 'School already exists in this LGA');
      return res.redirect('/admin/schools/add');
    }

    // Create school
    const school = await School.create({
      name,
      stateId,
      lgaId,
      address,
      schoolSerial: schoolSerial || 1,
      stateCode
    });

    req.flash('success', 'School added successfully');
    res.redirect('/admin/schools');
  } catch (err) {
    console.error('Add school error:', err);
    req.flash('error', 'Failed to add school');
    res.redirect('/admin/schools/add');
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

    // Validate required fields
    if (!name || !email || !password || !role) {
      req.flash('error', 'Name, email, password, and role are required');
      return res.redirect('/admin/users/new');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'User with this email already exists');
      return res.redirect('/admin/users/new');
    }

    // Process permissions array
    let permissionsObj = {};
    if (permissions && Array.isArray(permissions)) {
      permissions.forEach(perm => {
        permissionsObj[perm] = true;
      });
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      password, // Will be hashed by model hook
      role,
      stateId: (role === 'state_admin' && stateId) ? stateId : null,
      schoolId: (role === 'school_admin' && schoolId) ? schoolId : null,
      permissions: permissionsObj,
      isActive: true
    });

    req.flash('success', `${role.replace('_', ' ')} created successfully`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Create user error:', err);
    req.flash('error', 'Failed to create user: ' + err.message);
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
  try {
    // Get current date ranges for analytics
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // Fetch real analytics data
    const [
      totalStudents,
      totalResults,
      passRateData,
      gradeDistribution,
      totalPayments,
      monthlyPayments,
      yearlyPayments,
      pendingPayments,
      failedPayments,
      paymentMethods,
      recentPayments,
      subjectPerformance
    ] = await Promise.all([
      Student.count(),
      Result.count(),
      Result.findAll({
        attributes: [
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
          [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN grade IN (\'A\', \'B\', \'C\', \'D\') THEN 1 ELSE 0 END')), 'passed']
        ]
      }),
      Result.findAll({
        attributes: [
          'grade',
          [db.sequelize.fn('COUNT', db.sequelize.col('grade')), 'count']
        ],
        group: ['grade'],
        order: [['grade', 'ASC']]
      }),
      Payment.count({ where: { status: 'success' } }),
      Payment.sum('amount', {
        where: {
          status: 'success',
          createdAt: { [Op.gte]: firstDayOfMonth }
        }
      }) || 0,
      Payment.sum('amount', {
        where: {
          status: 'success',
          createdAt: { [Op.gte]: firstDayOfYear }
        }
      }) || 0,
      Payment.count({ where: { status: 'pending' } }),
      Payment.count({ where: { status: 'failed' } }),
      Payment.findAll({
        where: { status: 'success' },
        attributes: [
          'paymentMethod',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
          [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'totalAmount']
        ],
        group: ['paymentMethod']
      }),
      Payment.findAll({
        where: { status: 'success' },
        include: [Student, School],
        order: [['createdAt', 'DESC']],
        limit: 10
      }),
      Result.findAll({
        include: [{ model: Subject, as: 'subject' }],
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('score')), 'avgScore'],
          [db.sequelize.fn('COUNT', db.sequelize.col('Result.id')), 'totalResults'],
          [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN grade IN (\'A\', \'B\', \'C\', \'D\') THEN 1 ELSE 0 END')), 'passed']
        ],
        include: [{
          model: Subject,
          as: 'subject',
          attributes: ['name']
        }],
        group: ['Subject.id'],
        order: [[db.sequelize.fn('AVG', db.sequelize.col('score')), 'DESC']],
        limit: 5
      })
    ]);

    // Process pass rate data
    const passRate = passRateData[0] ? {
      total: parseInt(passRateData[0].dataValues.total) || 0,
      passed: parseInt(passRateData[0].dataValues.passed) || 0
    } : { total: 0, passed: 0 };

    // Process grade distribution
    const processedGradeDistribution = gradeDistribution.map(g => ({
      grade: g.dataValues.grade,
      count: parseInt(g.dataValues.count) || 0
    }));

    // Process payment methods
    const processedPaymentMethods = paymentMethods.map(p => ({
      method: p.dataValues.paymentMethod,
      count: parseInt(p.dataValues.count) || 0,
      totalAmount: parseFloat(p.dataValues.totalAmount) || 0
    }));

    // Process subject performance
    const processedSubjectPerformance = subjectPerformance.map(s => ({
      name: s.subject ? s.subject.name : 'Unknown',
      avgScore: parseFloat(s.dataValues.avgScore) || 0,
      passRate: s.dataValues.totalResults > 0 ? (parseInt(s.dataValues.passed) / parseInt(s.dataValues.totalResults)) * 100 : 0
    }));

    res.render('admin/analytics', {
      title: 'Analytics Dashboard',
      user: req.user,
      stats: {
        totalStudents,
        totalResults,
        passRate,
        gradeDistribution: processedGradeDistribution,
        totalPayments,
        monthlyPayments,
        yearlyPayments,
        pendingPayments,
        failedPayments,
        paymentMethods: processedPaymentMethods,
        recentPayments,
        subjectPerformance: processedSubjectPerformance
      }
    });
  } catch (err) {
    console.error('Analytics Error:', err);
    res.render('admin/analytics', {
      title: 'Analytics Dashboard',
      user: req.user,
      stats: {
        totalStudents: 0,
        totalResults: 0,
        passRate: { total: 0, passed: 0 },
        gradeDistribution: [],
        totalPayments: 0,
        monthlyPayments: 0,
        yearlyPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        paymentMethods: [],
        recentPayments: [],
        subjectPerformance: []
      }
    });
  }
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