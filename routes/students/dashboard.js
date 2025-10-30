// routes/students/dashboard.js
import express from 'express';
import { Student, School, Result } from '../../models/index.js';

const router = express.Router();

// Student dashboard
router.get('/', async (req, res) => {
  try {
    const student = req.session.student;
    if (!student) {
      req.flash('error', 'Please login first');
      return res.redirect('/students/auth/login');
    }

    const studentData = await Student.findByPk(student.id, {
      include: [School, Result]
    });

    res.render('students/dashboard', {
      title: 'Student Dashboard',
      student: studentData,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/students/auth/login');
  }
});

export default router;