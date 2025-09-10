// routes/auth.js
import express from 'express';
import passport from 'passport';
import authController from '../controllers/authController.js';

const router = express.Router();

// Register routes
router.get('/register', authController.showRegister);
router.post('/register', authController.register);

// Login routes
router.get('/login', authController.showLogin);
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true,
  })
);

// Logout
router.get('/logout', authController.logout);

export default router;

