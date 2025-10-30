// routes/admin/users.js
import express from 'express';
import { User } from '../../models/index.js';
import { requireSuperAdmin } from '../../middleware/roleMiddleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// List users
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/users/list', {
      title: 'Manage Users',
      users,
      currentUser: req.user
    });
  } catch (err) {
    console.error('Users error:', err);
    req.flash('error', 'Failed to load users');
    res.redirect('/admin/dashboard');
  }
});

// Add admin user
router.post('/add', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'admin'
    });

    req.flash('success', 'User created successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Add user error:', err);
    req.flash('error', 'Failed to create user');
    res.redirect('/admin/users');
  }
});

export default router;