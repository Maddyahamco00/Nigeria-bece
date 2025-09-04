// routes/admin.js
import express from 'express';
import { Student, School } from '../models/index.js';

const router = express.Router();

// Admin Students Page
router.get('/students', async (req, res) => {
  try {
    const students = await Student.findAll({ include: School });
    const schools = await School.findAll();

    res.render('admin/students', { 
      title: 'Manage Students', 
      students, 
      schools 
    });
  } catch (err) {
    console.error("Admin Students Error:", err);
    req.flash('error', 'Failed to load students');
    res.redirect('/admin/dashboard');
  }
});

// Handle Student Registration from Admin
router.post('/students', async (req, res) => {
  try {
    const { name, email, schoolId } = req.body;
    const regNumber = "REG" + Date.now();

    await Student.create({ name, email, regNumber, schoolId });
    req.flash('success', 'Student registered successfully');
    res.redirect('/admin/students');
  } catch (err) {
    console.error("Student Registration Error:", err);
    req.flash('error', 'Failed to register student');
    res.redirect('/admin/students');
  }
});

export default router;
