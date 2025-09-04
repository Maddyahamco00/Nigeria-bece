// controllers/studentController.js
import Student from '../models/Student.js';
import School from '../models/School.js';
import db from "../models/index.js";

export const registerStudent = async (req, res) => {
  try {
    const { name, email, stateId, schoolId } = req.body;

    // Save student
    const student = await db.Student.create({
      name,
      email,
      schoolId
    });

    // Build Reg Number (BECE + YEAR + STATEID + SCHOOLID + STUID)
    const year = new Date().getFullYear().toString().slice(-2); // e.g., "25" for 2025
    const regNumber = `BECE${year}${stateId}${schoolId}${student.id}`;

    // Update with reg number
    student.regNumber = regNumber;
    await student.save();

    res.redirect("/students/success");
  } catch (err) {
    console.error("Student Register Error:", err);
    res.status(500).send("Error registering student");
  }
};

// --- API Controllers ---
const createStudent = async (req, res) => {
  try {
    const { name, email, stateId, schoolId } = req.body;

    const student = await Student.create({ name, email, schoolId });

    const year = new Date().getFullYear().toString().slice(-2);
    student.regNumber = `BECE${year}${stateId}${schoolId}${student.id}`;
    await student.save();

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.findAll({ include: School });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: School });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const [updated] = await Student.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const deleted = await Student.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- EJS Form Controllers ---
const showRegisterForm = async (req, res) => {
  const schools = await School.findAll();
  res.render('student/register', {
    title: 'Register Student',
    errors: [],
    data: {},
    schools
  });
};

const registerStudentForm = async (req, res) => {
  try {
    const { name, email, stateId, schoolId } = req.body;
    const student = await Student.create({ name, email, schoolId });

    const year = new Date().getFullYear().toString().slice(-2);
    student.regNumber = `BECE${year}${stateId}${schoolId}${student.id}`;
    await student.save();

    req.flash('success', 'Student registered successfully!');
    res.redirect('/student/register');
  } catch (err) {
    console.error(err);
    res.render('student/register', {
      title: 'Register Student',
      errors: [{ msg: 'Error saving student' }],
      data: req.body,
      schools: []
    });
  }
};

// ✅ Default export as an object
export default {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  showRegisterForm,
  registerStudentForm
};
