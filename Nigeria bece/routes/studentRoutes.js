// routes/studentRoutes.js
import express from 'express';
import { renderRegister, registerStudent } from '../controllers/studentController.js';
import { renderLogin, handleLogin, renderDashboard } from '../controllers/studentController.js';

const router = express.Router();

router.get('/register', renderRegister);
router.post('/register', registerStudent);
router.get('/login', renderLogin);
router.post('/login', handleLogin);
router.get('/dashboard', renderDashboard);
// Mark payment locally
router.post('/dashboard/pay', async (req, res) => {
  try {
    const studentId = req.session.student.id;
    const student = await Student.findByPk(studentId);
    if (student) {
      student.paymentStatus = 'Paid';
      await student.save();
      req.session.student.paymentStatus = 'Paid'; // update session
      req.flash('success', 'Payment marked as Paid.');
    }
    res.redirect('/students/dashboard');
  } catch (err) {
    console.error('❌ Payment simulation error:', err);
    req.flash('error', 'Failed to update payment.');
    res.redirect('/students/dashboard');
  }
});

export default router;
