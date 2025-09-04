// controllers/adminController.js
import { User, Student, School, Payment } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';

// ===================== ADMIN DASHBOARD =====================
export const getDashboard = async (req, res) => {
  try {
    const schools = await School.findAll({
      include: [
        { model: Student },
        { model: Payment }
      ]
    });

    const totalPayments = await Payment.sum('amount', { where: { status: 'success' } });
    const pendingPayments = await Payment.count({ where: { status: 'pending' } });

    res.render('admin/dashboard', {
      user: req.user,
      schools,
      totalPayments: totalPayments || 0,
      pendingPayments
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// ===================== REGISTER SCHOOL =====================
export const postAddSchool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg).join(', '));
      return res.redirect('/admin/add-school');
    }

    await School.create({
      name: req.body.name,
      state: req.body.state
    });

    req.flash('success', 'School registered successfully.');
    res.redirect('/admin/schools');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/admin/add-school');
  }
};

// ===================== LIST SCHOOLS =====================
export const getSchools = async (req, res) => {
  try {
    const schools = await School.findAll({ include: Student });
    res.render('admin/schools', { schools });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// ===================== REGISTER STUDENT =====================
export const postAddStudent = async (req, res) => {
  try {
    await Student.create({
      name: req.body.name,
      regNumber: req.body.regNumber,
      schoolId: req.body.schoolId
    });

    req.flash('success', 'Student registered successfully.');
    res.redirect(`/admin/school/${req.body.schoolId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not register student.');
    res.redirect('/admin/add-student');
  }
};

// ===================== PAYMENTS =====================
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: School,
      order: [['createdAt', 'DESC']]
    });
    res.render('admin/payments', { payments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// ===================== UPDATE PAYMENT STATUS =====================
export const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      req.flash('error', 'Payment not found.');
      return res.redirect('/admin/payments');
    }

    payment.status = req.body.status;
    await payment.save();

    req.flash('success', 'Payment status updated.');
    res.redirect('/admin/payments');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating payment status.');
    res.redirect('/admin/payments');
  }
};
