// controllers/adminController.js
import { User, Student, School, Payment, Result } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';

// Enhanced Dashboard with Analytics
export const getDashboard = async (req, res) => {
  try {
    // Get current date ranges for analytics
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // Analytics data
    const [
      totalStudents,
      totalSchools,
      totalPayments,
      monthlyPayments,
      yearlyPayments,
      pendingPayments,
      recentStudents,
      recentPayments,
      schoolStats,
      paymentStats
    ] = await Promise.all([
      Student.count(),
      School.count(),
      Payment.count({ where: { status: 'success' } }),
      Payment.sum('amount', { 
        where: { 
          status: 'success',
          createdAt: { [Op.gte]: firstDayOfMonth }
        }
      }),
      Payment.sum('amount', { 
        where: { 
          status: 'success',
          createdAt: { [Op.gte]: firstDayOfYear }
        }
      }),
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
      School.findAll({
        include: [{
          model: Student,
          attributes: []
        }],
        attributes: [
          'name',
          [sequelize.fn('COUNT', sequelize.col('Students.id')), 'studentCount']
        ],
        group: ['School.id'],
        order: [[sequelize.literal('studentCount'), 'DESC']],
        limit: 5
      }),
      Payment.findAll({
        where: { status: 'success' },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'dailyAmount']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'DESC']],
        limit: 7
      })
    ]);

    res.render('admin/dashboard', {
      user: req.user,
      analytics: {
        totalStudents: totalStudents || 0,
        totalSchools: totalSchools || 0,
        totalPayments: totalPayments || 0,
        monthlyRevenue: monthlyPayments || 0,
        yearlyRevenue: yearlyPayments || 0,
        pendingPayments: pendingPayments || 0,
        recentStudents,
        recentPayments,
        schoolStats,
        paymentStats: paymentStats.reverse() // Reverse to show chronological order
      }
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).render('error', { message: 'Server Error' });
  }
};

// User Management (SuperAdmin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    res.render('admin/users', {
      users,
      currentUser: req.user
    });
  } catch (err) {
    console.error('Users Error:', err);
    req.flash('error', 'Failed to load users');
    res.redirect('/admin/dashboard');
  }
};

export const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg).join(', '));
      return res.redirect('/admin/users');
    }

    const { name, email, password, role } = req.body;
    
    await User.create({
      name,
      email,
      password,
      role: req.user.role === 'superadmin' ? role : 'user'
    });

    req.flash('success', 'User created successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Create User Error:', err);
    req.flash('error', 'Failed to create user');
    res.redirect('/admin/users');
  }
};

// CSV Export functionality
export const exportData = async (req, res) => {
  try {
    const { type } = req.params;
    let data, filename, headers;

    switch (type) {
      case 'students':
        data = await Student.findAll({ include: [School, Payment] });
        filename = `students-${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Name', 'Email', 'Reg Number', 'School', 'Payment Status', 'Created At'];
        break;
      
      case 'payments':
        data = await Payment.findAll({ 
          where: { status: 'success' },
          include: [Student, School]
        });
        filename = `payments-${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Email', 'Amount', 'Reference', 'Code', 'School', 'Date'];
        break;
      
      case 'schools':
        data = await School.findAll({ include: [Student] });
        filename = `schools-${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Name', 'LGA', 'Student Count', 'Address', 'Created At'];
        break;
      
      default:
        req.flash('error', 'Invalid export type');
        return res.redirect('/admin/dashboard');
    }

    // Convert to CSV
    let csv = headers.join(',') + '\n';
    
    data.forEach(item => {
      const row = [];
      switch (type) {
        case 'students':
          row.push(
            item.id,
            `"${item.name}"`,
            item.email,
            item.regNumber,
            item.School?.name || 'N/A',
            item.paymentStatus,
            item.createdAt.toISOString().split('T')[0]
          );
          break;
        case 'payments':
          row.push(
            item.id,
            item.email,
            item.amount,
            item.reference,
            item.code,
            item.School?.name || 'N/A',
            item.createdAt.toISOString().split('T')[0]
          );
          break;
        case 'schools':
          row.push(
            item.id,
            `"${item.name}"`,
            item.lgaId,
            item.Students?.length || 0,
            `"${item.address || 'N/A'}"`,
            item.createdAt?.toISOString().split('T')[0] || 'N/A'
          );
          break;
      }
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);

  } catch (err) {
    console.error('Export Error:', err);
    req.flash('error', 'Export failed');
    res.redirect('/admin/dashboard');
  }
};