
// controllers/studentController.js
import bcrypt from 'bcryptjs';
import { Student, State, LGA, School } from '../models/index.js';

// Render Student Registration Page
export const renderRegister = async (req, res) => {
  try {
    const states = await State.findAll();
    res.render('public/students/register', { states, messages: req.flash() });
  } catch (err) {
    console.error("❌ Error loading states:", err);
    res.status(500).send("Server error");
  }
};

// Handle Student Registration
export const registerStudent = async (req, res) => {
  try {
    console.log("📥 Incoming form data:", req.body);

    const { name, email, password, confirmPassword, stateId, lgaId, schoolId, gender, dob, guardianPhone, payment } = req.body;

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/students/register');
    }

    // Validate foreign keys
    const school = await School.findByPk(schoolId);
    const state = await State.findByPk(stateId);
    const lga = await LGA.findByPk(lgaId);

    if (!school || !state || !lga) {
      req.flash('error', 'Invalid state, LGA, or school selected');
      return res.redirect('/students/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create student in DB
let student;
try {
  student = await Student.create({
    name,
    email,
    password: hashedPassword,
    gender,
    dateOfBirth: dob, // <-- check if your model expects `dateOfBirth` as DATEONLY
    guardianPhone,
    stateId,
    lgaId,
    schoolId,
    paymentStatus: payment && payment !== '' ? 'Paid' : 'Pending'
  });
  console.log("✅ Student saved in DB:", student.toJSON());
} catch (createErr) {
  console.error("❌ Sequelize create error:", createErr.errors || createErr);
  throw createErr; // rethrow so it gets caught by outer catch too
}


    // ✅ Generate Reg Number (safe format, only using IDs that exist)
    const regNumber = `BECE${new Date().getFullYear()}-${stateId}-${lgaId}-${schoolId}-${student.id}`;
    student.regNumber = regNumber;
    // After await student.save();
await student.save();
console.log("📦 Saved student in DB with ID:", student.id);

// Extra check: fetch back from DB
const checkStudent = await Student.findByPk(student.id);
console.log("🔎 DB check:", checkStudent ? checkStudent.toJSON() : "❌ Not found in DB");

    // Success flash
    req.flash('success', `Registration successful! Your Reg Number: ${regNumber}`);
    res.redirect('/students/login');
  } catch (err) {
    console.error("❌ Registration error:", err);
    req.flash('error', 'Registration failed. Try again.');
    res.redirect('/students/register');
  }
};

// Render Student Login Page
export const renderLogin = async (req, res) => {
  try {
    res.render('public/students/login', { messages: req.flash() });
  } catch (err) {
    console.error("❌ Error rendering login:", err);
    res.status(500).send("Server error");
  }
};

// Handle Student Login
export const handleLogin = async (req, res) => {
  try {
    const { regNumber, password } = req.body;
    const student = await Student.findOne({ where: { regNumber } });

    if (!student) {
      req.flash('error', 'Invalid registration number or password');
      return res.redirect('/students/login');
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      req.flash('error', 'Invalid registration number or password');
      return res.redirect('/students/login');
    }

    // Save student info in session
    req.session.student = {
      id: student.id,
      name: student.name,
      regNumber: student.regNumber,
      paymentStatus: student.paymentStatus
    };

    res.redirect('/students/dashboard');
  } catch (err) {
    console.error('❌ Student login error:', err);
    req.flash('error', 'Login failed. Try again.');
    res.redirect('/students/login');
  }
};

// Render Student Dashboard
export const renderDashboard = (req, res) => {
  const student = req.session.student;
  if (!student) {
    req.flash('error', 'Please login first');
    return res.redirect('/students/login');
  }
  res.render('public/students/dashboard', { student, messages: req.flash() });
};
