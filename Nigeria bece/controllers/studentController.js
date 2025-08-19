// controllers/studentController.js
const Student = require('../models/Student');
const School = require('../models/School');

// --- API Controllers ---
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.findAll({ include: School });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: School });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const [updated] = await Student.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const deleted = await Student.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- EJS Form Controllers ---
exports.showRegisterForm = async (req, res) => {
  const schools = await School.findAll();
  res.render('student/register', { title: 'Register Student', errors: [], data: {}, schools });
};

exports.registerStudentForm = async (req, res) => {
  try {
    await Student.create(req.body);
    req.flash('success', 'Student registered successfully!');
    res.redirect('/student/register');
  } catch (err) {
    console.error(err);
    res.render('student/register', { title: 'Register Student', errors: [{ msg: 'Error saving student' }], data: req.body, schools: [] });
  }
};
const schools = await School.findAll();
res.render('admin/student', {
  title: 'Manage Students',
  students: students.map(s => ({
    id: s.id,
    name: s.name,
    regNumber: s.regNumber,
    schoolName: s.School ? s.School.name : 'N/A'
  })),
  schools
});
