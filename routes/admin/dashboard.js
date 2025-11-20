// routes/admin/dashboard.js
import express from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Student, School, Payment, User } from '../../models/index.js';
import { requireAdmin } from '../../middleware/roleMiddleware.js';
import { sequelize } from '../../config/database.js';

const router = express.Router();

// -----------------------------
// Admin Dashboard
// -----------------------------
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Parallel DB queries
    const [
      totalStudents,
      totalSchools,
      totalPayments,
      pendingPayments,
      monthlyRevenue,
      recentStudents,
      recentPayments,
      schoolStats
    ] = await Promise.all([

      Student.count(),
      School.count(),

      // total successful payments
      Payment.count({ where: { status: 'success' } }),

      // pending payments
      Payment.count({ where: { status: 'pending' } }),

      // monthly revenue total
      Payment.sum('amount', {
        where: {
          status: 'success',
          createdAt: { [Op.gte]: startOfMonth }
        }
      }),

      // Latest students with their schools
      Student.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [
          { model: School, attributes: ['name'] }
        ]
      }),

      // latest successful payments
      Payment.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        where: { status: 'success' },
        include: [
          { model: Student, attributes: ['name'] },
          { model: School, attributes: ['name'] }
        ]
      }),

      // Students count per school
      School.findAll({
        attributes: [
          'id',
          'name',
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM students WHERE students.schoolId = School.id)'
            ),
            'studentCount'
          ]
        ],
        order: [[literal('studentCount'), 'DESC']],
        limit: 5
      })
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      admin: req.user,
      analytics: {
        totalStudents,
        totalSchools,
        totalPayments,
        pendingPayments,
        monthlyRevenue: monthlyRevenue || 0,
        recentStudents,
        recentPayments,
        schoolStats
      }
    });

  } catch (err) {
    console.error('❌ Dashboard error:', err);
    res.status(500).render('error', { message: 'Server Error' });
  }
});

export default router;
