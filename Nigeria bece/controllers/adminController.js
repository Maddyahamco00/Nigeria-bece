//Manages admin dashboard, student, school, and profile functionalities.
// controllers/adminController.js

const pool = require('../config/database');

exports.getDashboard = async (req, res) => {
  try {
    const [students] = await pool.query('SELECT COUNT(*) as count FROM students');
    const [schools] = await pool.query('SELECT COUNT(*) as count FROM schools');
    const [payments] = await pool.query('SELECT COUNT(*) as count FROM payments');
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      stats: {
        students: students[0].count,
        schools: schools[0].count,
        payments: payments[0].count
      }
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getStudents = async (req, res) => {
  try {
    const [students] = await pool.query('SELECT * FROM students');
    res.render('admin/students', { title: 'Students', user: req.user, students });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getSchools = async (req, res) => {
  try {
    const [schools] = await pool.query('SELECT * FROM schools');
    res.render('admin/schools', { title: 'Schools', user: req.user, schools });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getProfile = (req, res) => {
  res.render('admin/profile', { title: 'Profile', user: req.user });
};

exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
    await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id]);
    req.flash('success', 'Profile updated successfully.');
    res.redirect('/admin/profile');
  } catch (err) {
    req.flash('error', 'An error occurred.');
    res.redirect('/admin/profile');
  }
};