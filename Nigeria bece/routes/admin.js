//  routes/admin.js
const express = require('express');
const router = express.Router();
router.post('/profile', async (req, res) => {
  const { name, email } = req.body;
  try {
    await User.update({ name, email }, { where: { id: req.user.id } });
    req.flash('success', 'Profile updated');
    res.redirect('/admin/profile');
  } catch (err) {
    req.flash('error', 'Update failed');
    res.redirect('/admin/profile');
  }
});
router.get('/profile', (req, res) => {
  res.render('admin/profile', { user: req.user });
});
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.render('admin/users', { users });
  } catch (err) {
    req.flash('error', 'Failed to fetch users');
    res.redirect('/admin/dashboard');
  }
});
module.exports = router;

// routes/admin.js