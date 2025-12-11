// routes/admin.js
import express from 'express';
import { Student, School, Payment, Result, User, State, LGA } from '../models/index.js';
import getGrade from '../utils/grade.js';
import sendEmail from '../utils/sendEmail.js';
import db from '../config/database.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleMiddleware.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
//import { getGrade } from '../utils/grade.js';

const router = express.Router();
import { Parser } from 'json2csv';
import { Op } from 'sequelize';

// protect all admin routes
router.use(isAuthenticated, isAdmin);

/* ---------------- Dashboard ---------------- */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Basic counters
    const totalStudents = await Student.count();
    const totalSchools = await School.count();
    const totalPayments = await Payment.count({ where: { status: 'success' } });

    // Monthly revenue (last 30 days sum)
    const [revRows] = await db.query(
      `SELECT IFNULL(SUM(amount),0) as revenue FROM payments WHERE status = 'success' AND \`createdAt\` >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const monthlyRevenue = revRows && revRows[0] ? revRows[0].revenue : 0;

    // Recent students and payments (limit 5)
    const recentStudents = await Student.findAll({ include: [School], order: [['createdAt','DESC']], limit: 5 });
    const recentPayments = await Payment.findAll({ include: [Student], order: [['createdAt','DESC']], limit: 5 });

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
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/admin/dashboard');
  }
});

// Live counters for AJAX refresh
router.get('/dashboard/live/counters', requireAdmin, async (req, res) => {
  try {
    const counters = {
      students: await Student.count(),
      schools: await School.count(),
      paid: await Payment.count({ where: { status: 'success' } })
    };
    res.json({ success: true, counters });
  } catch (err) {
    console.error('Live counters error:', err);
    res.json({ success: false, error: 'Failed to fetch counters' });
  }
});

// Live recent activity
router.get('/dashboard/live/recent', requireAdmin, async (req, res) => {
  try {
    const recentStudents = await Student.findAll({ include: [School], order: [['createdAt','DESC']], limit: 5 });
    const recentPayments = await Payment.findAll({ include: [Student], order: [['createdAt','DESC']], limit: 5 });

    res.json({ success: true, recentStudents, recentPayments });
  } catch (err) {
    console.error('Live recent error:', err);
    res.json({ success: false, error: 'Failed to fetch recent activity' });
  }
});

// Stats for charts (monthly payments over last 6 months)
router.get('/dashboard/stats', requireAdmin, async (req, res) => {
  try {
    // Monthly payments sums for last 6 months
    const sql = `
      SELECT DATE_FORMAT(\`createdAt\`, '%Y-%m') as month, IFNULL(SUM(amount),0) as total
      FROM payments
      WHERE status = 'success' AND \`createdAt\` >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `;

    const [rows] = await db.query(sql);
    const labels = rows.map(r => r.month);
    const data = rows.map(r => Number(r.total));

    // Students per state
    const [stateRows] = await db.query(`
      SELECT st.name as state, COUNT(s.id) as count
      FROM students s
      LEFT JOIN schools sc ON s.schoolId = sc.id
      LEFT JOIN states st ON sc.stateId = st.id
      GROUP BY st.name
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({ success: true, chart: { labels, data }, studentsByState: stateRows });
  } catch (err) {
    console.error('Stats error:', err);
    res.json({ success: false, error: 'Failed to fetch stats' });
  }
});

/* ---------------- Admin Management Sidebar Link ---------------- */
router.get('/admin-management', requireSuperAdmin, (req, res) => {
  res.redirect('/admin/users');
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

// Add new admin form
router.get('/users/new', requireSuperAdmin, async (req, res) => {
  try {
    const states = await State.findAll();
    const schools = await School.findAll({ include: [State] });

    res.render('admin/add-user', {
      title: 'Add New Admin',
      states,
      schools,
      user: req.user
    });
  } catch (err) {
    console.error('Add user form error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/admin/users');
  }
});

// Create new admin
router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role, stateId, schoolId, permissions } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already exists');
      return res.redirect('/admin/users/new');
    }

    const userData = {
      name,
      email,
      password,
      role,
      createdBy: req.user.id,
      isActive: true
    };

    if (role === 'state_admin' && stateId) {
      userData.stateId = stateId;
    }
    if (role === 'school_admin' && schoolId) {
      userData.schoolId = schoolId;
    }
    if (permissions) {
      userData.permissions = JSON.parse(permissions || '{}');
    }

    await User.create(userData);
    req.flash('success', 'Admin user created successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Create user error:', err);
    req.flash('error', 'Failed to create user');
    res.redirect('/admin/users/new');
  }
});

// Toggle user active status
router.post('/users/:id/toggle', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.json({ success: false, error: 'Failed to update user' });
  }
});

/* ---------------- Export ---------------- */
router.get('/export/results', requireAdmin, async (req,res)=>{
  try {
    const [results] = await db.query("SELECT r.id, r.student_name, r.subject, r.score FROM results r ORDER BY r.createdAt DESC");
    const csvFields = ['id','student_name','subject','score','grade'];
    const data = results.map(r => ({
        id: r.id,
        student_name: r.student_name,
        subject: r.subject,
        score: r.score,
        grade: getGrade(r.score)
    }));

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(data);

    res.header('Content-Type','text/csv');
    res.attachment('bece_results.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export results error:', err);
    req.flash('error', 'Failed to export results');
    res.redirect('/admin/results');
  }
});

// Export only the current results page as CSV using pagination params
router.get('/export/results-page', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { rows } = await Result.findAndCountAll({
      include: [Student, School],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const csvFields = ['id','student_name','subject','score','grade'];
    const data = rows.map(r => ({
      id: r.id,
      student_name: r.student ? r.student.name : (r.Student ? r.Student.name : ''),
      subject: r.subject,
      score: r.score,
      grade: getGrade(r.score)
    }));

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(data);

    res.header('Content-Type','text/csv');
    res.attachment(`bece_results_page_${page}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export results page error:', err);
    req.flash('error', 'Failed to export results page');
    res.redirect('/admin/results');
  }
});

// Export payments CSV with optional filters: schoolId, stateId, from, to
router.get('/export/payments', requireAdmin, async (req, res) => {
  try {
    const { schoolId, stateId, from, to } = req.query;
    let sql = `SELECT p.id, p.email, p.amount, p.status, p.reference, p.transactionReference, p.createdAt as created_at, s.name as school_name, st.name as state_name
               FROM payments p
               LEFT JOIN schools s ON p.schoolId = s.id
               LEFT JOIN states st ON s.stateId = st.id
               WHERE 1=1`;
    const replacements = [];

    if (schoolId) {
      sql += ' AND p.schoolId = ?';
      replacements.push(schoolId);
    }
    if (stateId) {
      sql += ' AND st.id = ?';
      replacements.push(stateId);
    }
    if (from) {
      sql += ' AND p.`createdAt` >= ?';
      replacements.push(from);
    }
    if (to) {
      sql += ' AND p.`createdAt` <= ?';
      replacements.push(to);
    }

    sql += ' ORDER BY p.`createdAt` DESC';

    const [rows] = await db.query(sql, { replacements });

    const csvFields = ['id','email','amount','status','reference','transactionReference','created_at','school_name','state_name'];
    const data = rows.map(r => ({
      id: r.id,
      email: r.email,
      amount: r.amount,
      status: r.status,
      reference: r.reference,
      transactionReference: r.transactionReference || '',
      created_at: r.created_at,
      school_name: r.school_name || '',
      state_name: r.state_name || ''
    }));

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(data);

    res.header('Content-Type','text/csv');
    res.attachment('bece_payments.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export payments error:', err);
    req.flash('error', 'Failed to export payments');
    res.redirect('/admin/payments');
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

// View individual school
router.get('/schools/:id', requireAdmin, async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id, {
      include: [State, LGA, Student, Payment]
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

// Edit school form
router.get('/schools/:id/edit', requireAdmin, async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id, {
      include: [State, LGA]
    });
    
    if (!school) {
      req.flash('error', 'School not found');
      return res.redirect('/admin/schools');
    }

    const states = await State.findAll();
    const lgas = await LGA.findAll();

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

// View individual student
router.get('/students/:id', requireAdmin, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [School, State, LGA, Payment, Result]
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

// Edit student form
router.get('/students/:id/edit', requireAdmin, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [School, State, LGA]
    });
    
    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/admin/students');
    }

    const schools = await School.findAll();
    const states = await State.findAll();
    const lgas = await LGA.findAll();

    res.render('admin/edit-student', {
      title: 'Edit Student',
      student,
      schools,
      states,
      lgas,
      user: req.user
    });
  } catch (err) {
    console.error('Edit student error:', err);
    req.flash('error', 'Failed to load student');
    res.redirect('/admin/students');
  }
});

/* ---------------- Results ---------------- */
router.get('/results', requireAdmin, async (req, res) => {
  try {
    // Pagination params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await Result.findAndCountAll({
      include: [Student, School],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Add grade to each result
    const gradedResults = rows.map(result => ({
      ...result.get({ plain: true }),
      grade: getGrade(result.score)
    }));

    const totalPages = Math.ceil(count / limit) || 1;

    res.render('admin/results', {
      title: 'Manage Results',
      results: gradedResults,
      user: req.user,
      pagination: { page, limit, total: count, totalPages }
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
    const newResult = await Result.create({
      subject: subject.trim(),
      score: parseInt(score, 10) || 0,
      studentId: student.id,
      schoolId: student.schoolId || null
    });

    // Notify student by email (non-blocking)
    try {
      if (student.email) {
        const grade = getGrade(newResult.score);
        const html = `
          <p>Hello ${student.name || 'Student'},</p>
          <p>A new result has been published on your account:</p>
          <ul>
            <li><strong>Subject:</strong> ${newResult.subject}</li>
            <li><strong>Score:</strong> ${newResult.score}</li>
            <li><strong>Grade:</strong> ${grade}</li>
          </ul>
          <p>Login to your dashboard to view all results.</p>
        `;
        sendEmail(student.email, 'New Result Published - Nigeria BECE Portal', html);
      }
    } catch (err) {
      console.error('Failed to send result email:', err);
    }

    req.flash('success', 'Result saved successfully');
    res.redirect('/admin/results');
  } catch (err) {
    console.error('Create result error:', err);
    req.flash('error', 'Failed to save result');
    res.redirect('/admin/results/new');
  }
});

// View individual result
router.get('/results/:id', requireAdmin, async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id, {
      include: [Student, School]
    });
    
    if (!result) {
      req.flash('error', 'Result not found');
      return res.redirect('/admin/results');
    }

    // Add grade to result
    const resultWithGrade = {
      ...result.get({ plain: true }),
      grade: getGrade(result.score)
    };

    res.render('admin/view-result', {
      title: 'View Result',
      result: resultWithGrade,
      user: req.user,
      getGrade
    });
  } catch (err) {
    console.error('View result error:', err);
    req.flash('error', 'Failed to load result');
    res.redirect('/admin/results');
  }
});

/* ---------------- Student Results Route ---------------- */
router.get('/students/:id/results', requireAdmin, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [School, State, LGA, Result]
    });
    
    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/admin/students');
    }

    res.render('students/results', {
      title: 'Student Results',
      student,
      results: student.Results || [],
      getGrade
    });
  } catch (err) {
    console.error('Student results error:', err);
    req.flash('error', 'Failed to load student results');
    res.redirect('/admin/students');
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

/* ---------------- Gazette Page & Export ---------------- */
router.get('/gazette', requireAdmin, async (req, res) => {
  try {
    const states = await State.findAll();
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 5}, (_, i) => currentYear - i);
    
    res.render('admin/gazette', {
      title: 'BECE Gazette',
      states,
      years,
      user: req.user
    });
  } catch (err) {
    console.error('Gazette page error:', err);
    req.flash('error', 'Failed to load gazette page');
    res.redirect('/admin/dashboard');
  }
});

router.get('/export/gazette', requireAdmin, async (req, res) => {
  try {
    const { year, state, format } = req.query;
    
    let whereClause = {};
    if (year) {
      whereClause.createdAt = {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lt]: new Date(`${parseInt(year) + 1}-01-01`)
      };
    }

    const results = await Result.findAll({
      include: [
        {
          model: Student,
          include: [
            {
              model: School,
              include: [State],
              where: state ? { stateId: state } : {}
            }
          ]
        }
      ],
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    const gazetteData = results.map(result => ({
      studentName: result.Student?.name || 'N/A',
      studentCode: result.Student?.studentCode || 'N/A',
      school: result.Student?.School?.name || 'N/A',
      state: result.Student?.School?.State?.name || 'N/A',
      subject: result.subject,
      score: result.score,
      grade: getGrade(result.score),
      examYear: new Date(result.createdAt).getFullYear()
    }));

    const csvFields = ['studentName', 'studentCode', 'school', 'state', 'subject', 'score', 'grade', 'examYear'];
    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(gazetteData);

    res.header('Content-Type', 'text/csv');
    res.attachment(`bece_gazette_${year || new Date().getFullYear()}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Gazette export error:', err);
    req.flash('error', 'Failed to export gazette');
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

/* ---------------- Subject Management for Students ---------------- */
router.get('/students/:id/subjects', requireAdmin, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [School, { model: Result, include: [{ model: Subject }] }]
    });
    
    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/admin/students');
    }

    const allSubjects = await Subject.findAll();
    const registeredSubjects = student.Results?.map(r => r.Subject) || [];

    res.render('admin/student-subjects', {
      title: 'Student Subjects',
      student,
      allSubjects,
      registeredSubjects,
      user: req.user,
      getGrade
    });
  } catch (err) {
    console.error('Student subjects error:', err);
    req.flash('error', 'Failed to load student subjects');
    res.redirect('/admin/students');
  }
});

// Upload results for student subjects
router.post('/students/:id/results', requireAdmin, async (req, res) => {
  try {
    const { subjects } = req.body; // Array of {subjectId, score}
    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/admin/students');
    }

    for (const subjectData of subjects) {
      if (subjectData.score !== undefined && subjectData.score !== '') {
        const subject = await Subject.findByPk(subjectData.subjectId);
        if (subject) {
          await Result.create({
            studentId: student.id,
            schoolId: student.schoolId,
            subject: subject.name,
            score: parseInt(subjectData.score)
          });
        }
      }
    }

    req.flash('success', 'Results uploaded successfully');
    res.redirect(`/admin/students/${req.params.id}/subjects`);
  } catch (err) {
    console.error('Upload results error:', err);
    req.flash('error', 'Failed to upload results');
    res.redirect(`/admin/students/${req.params.id}/subjects`);
  }
});

/* ---------------- Initialize Super Admins ---------------- */
// This should be called during app startup
export const initializeSuperAdmins = async () => {
  try {
    const superAdminEmails = ['maddyahamco00@gmail.com', 'superadmin@bece.gov.ng'];
    
    for (const email of superAdminEmails) {
      const existingUser = await User.findOne({ where: { email } });
      if (!existingUser) {
        await User.create({
          name: email === 'maddyahamco00@gmail.com' ? 'Muhammad Kabir Ahmad' : 'Super Admin',
          email,
          password: 'SuperAdmin@2024', // Should be changed on first login
          role: 'super_admin',
          isActive: true,
          permissions: {}
        });
        console.log(`✅ Super admin created: ${email}`);
      }
    }
  } catch (err) {
    console.error('Failed to initialize super admins:', err);
  }
};

export default router;