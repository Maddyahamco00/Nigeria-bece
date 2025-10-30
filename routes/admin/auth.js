// routes/admin/auth.js
import express from 'express';
import passport from 'passport';
import { requireAdmin, requireSuperAdmin } from '../../middleware/roleMiddleware.js';

const router = express.Router();

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin/auth/login', { 
    title: 'Admin Login',
    messages: req.flash() 
  });
});

// Admin login handler
router.post('/login', 
  passport.authenticate('local-admin', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/admin/auth/login',
    failureFlash: true
  })
);

// Admin logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('Logout error:', err);
    req.flash('success', 'Logged out successfully');
    res.redirect('/admin/auth/login');
  });
});

export default router;