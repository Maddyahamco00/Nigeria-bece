// routes/admin/dashboard.js
import express from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Student, School, Payment, User } from '../../models/index.js';
import { requireAdmin } from '../../middleware/roleMiddleware.js';
import { sequelize } from '../../config/database.js'; // Make sure you import your sequelize instance

const router = express.Router();

// -----------------------------
// Admin Dashboard
// -----------------------------
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Fetch dashboard analytics in parallel
    const [
      totalStudents,
      totalSchools,
      totalPayments,
      pendingPayments,
      recentStudents,
      recentPayments,
      schoolStats
    ] = await Promise.all([
      Student.count(),
      School.count(),
      Payment.count({ where: { status: 'success' } }),
      Payment.count({ where: { status: 'pending' } }),
      Student.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [School]
      }),
      Payment.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [Student, School],
        where: { status: 'success' }
      }),
      // Use a subquery literal to get student counts per school. This avoids Sequelize
      // generating a subquery that references the Students alias inside the inner
      // SELECT (which caused "Unknown column 'Students.id'" errors).
      School.findAll({
        attributes: [
          'id',
          'name',
          [sequelize.literal('(SELECT COUNT(*) FROM students WHERE students.schoolId = School.id)'), 'studentCount']
        ],
        order: [[literal('studentCount'), 'DESC']],
        limit: 5
      })
    ]);

    // Render dashboard page
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      admin: req.user,
      messages: req.flash(),
      analytics: {
        totalStudents: totalStudents || 0,
        totalSchools: totalSchools || 0,
        totalPayments: totalPayments || 0,
        pendingPayments: pendingPayments || 0,
        recentStudents,
        recentPayments,
        schoolStats
      }
    });

  } catch (err) {
    console.error('❌ Dashboard error:', err);
    // Render the generic error view (views/error.ejs) because views/admin/error
    // does not exist in the project and would cause a secondary crash.
    res.status(500).render('error', { message: 'Server Error' });
  }
});

export default router;
