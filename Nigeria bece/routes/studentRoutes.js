// routes/studentRoutes.js
import express from 'express';
import { Student } from '../models/index.js';
import State from '../models/State.js';
import LGA from '../models/LGA.js';
import School from '../models/School.js';

const router = express.Router();

// List all students (for admin)
router.get('/', (req, res) => {
  res.render('admin/students', { title: 'Manage Students' });
});
 
// Render self-registration page with states
router.get('/register', async (req, res) => {
  try {
    const states = await State.findAll({ order: [['name', 'ASC']] });
    res.render('students/register', { states }); // ✅ pass states
  } catch (error) {
    console.error("❌ Error loading states:", error.message);
    res.status(500).send("Server error");
  }
});

// Handle self-registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, stateId, lgaId, schoolId } = req.body;

    // Generate a PIN/code (for now simple random)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await Student.create({ name, email, password, code, stateId, lgaId, schoolId });

    req.flash('success', 'Registration successful. Your Code: ' + code);
    res.redirect('/students/login');
  } catch (error) {
    console.error("Student Register Error:", error.message);
    res.status(500).send("Registration failed");
  }
});

// Render login page
router.get('/login', (req, res) => {
  res.render('students/login');
});

// Handle login with PIN/code
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    const student = await Student.findOne({ where: { code } });

    if (!student) {
      return res.status(401).render('students/login', { error: "Invalid PIN/Code" });
    }

    req.session.studentId = student.id;
    res.redirect('/dashboard');
  } catch (error) {
    console.error("Student Login Error:", error.message);
    res.status(500).send("Login failed");
  }
});

export default router;
