// routes/students/auth.js
import express from 'express';
import { Student } from '../../models/index.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Student registration page
router.get('/register', async (req, res) => {
  try {
    // If student already logged in, redirect to dashboard
    if (req.session.student) {
      return res.redirect('/students/dashboard');
    }

    const states = await State.findAll();
    res.render('students/register', { 
      title: 'Student Registration',
      states,
      messages: req.flash() 
    });
  } catch (err) {
    console.error("Registration page error:", err);
    res.status(500).render('students/error', { message: 'Server error' });
  }
});

// Student registration handler
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, stateId, lgaId, schoolId, gender, dob, guardianPhone } = req.body;

    // Validation
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/students/register');
    }

    // Create student (simplified for demo)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const student = await Student.create({
      name,
      email,
      password: hashedPassword,
      gender,
      dateOfBirth: dob,
      guardianPhone,
      stateId,
      lgaId,
      schoolId,
      paymentStatus: 'Pending'
    });

    // Generate reg number
    const regNumber = `BECE2024${student.id.toString().padStart(6, '0')}`;
    student.regNumber = regNumber;
    await student.save();

    req.flash('success', `Registration successful! Your Registration Number: ${regNumber}`);
    res.redirect('/students/auth/login');

  } catch (err) {
    console.error("Registration error:", err);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/students/auth/register');
  }
});

// Student login page
router.get('/login', (req, res) => {
  // If student already logged in, redirect to dashboard
  if (req.session.student) {
    return res.redirect('/students/dashboard');
  }

  res.render('students/auth/login', { 
    title: 'Student Login',
    messages: req.flash() 
  });
});

// Student login handler
router.post('/login', async (req, res) => {
  try {
    const { regNumber, password } = req.body;
    const student = await Student.findOne({ where: { regNumber } });

    if (!student) {
      req.flash('error', 'Invalid registration number');
      return res.redirect('/students/auth/login');
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      req.flash('error', 'Invalid password');
      return res.redirect('/students/auth/login');
    }

    // Store student in session
    req.session.student = {
      id: student.id,
      name: student.name,
      regNumber: student.regNumber,
      paymentStatus: student.paymentStatus
    };

    res.redirect('/students/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Login failed');
    res.redirect('/students/auth/login');
  }
});

// Student logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/students/auth/login');
  });
});

export default router;