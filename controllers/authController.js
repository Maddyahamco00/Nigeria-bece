// controllers/authController.js
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendTemplateEmail } from '../utils/sendEmail.js'; // Add this import
import { Op } from 'sequelize'; // Add this import

const authController = {
  showRegister: (req, res) => {
    res.render('auth/register', { messages: req.flash() });
  },

  register: async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    
    try {
      // Validation
      if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/auth/register');
      }

      if (password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters');
        return res.redirect('/auth/register');
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        req.flash('error', 'Email already registered');
        return res.redirect('/auth/register');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({ name, email, password: hashedPassword });
      
      req.flash('success', 'Registration successful. You can now log in.');
      res.redirect('/auth/login');
    } catch (err) {
      console.error('Registration Error:', err);
      req.flash('error', 'Registration failed. Please try again.');
      res.redirect('/auth/register');
    }
  },

  showLogin: (req, res) => {
    res.render('auth/login', { messages: req.flash() });
  },

  showForgotPassword: (req, res) => {
    res.render('auth/forgot-password', { messages: req.flash() });
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        req.flash('error', 'If an account exists with this email, a reset link will be sent.');
        return res.redirect('/auth/forgot-password');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour
      
      user.resetToken = resetToken;
      user.resetTokenExpiration = resetTokenExpiration;
      await user.save();

      // Send reset email
      const resetUrl = `${process.env.BASE_URL}/auth/reset-password/${resetToken}`;
      
      await sendEmail(
        user.email,
        'Password Reset Request - Nigeria BECE Portal',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>You requested a password reset for your Nigeria BECE Portal account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
          <p style="margin-top: 20px; color: #666;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
        `
      );

      req.flash('success', 'Password reset link sent to your email.');
      res.redirect('/auth/login');
    } catch (err) {
      console.error('Forgot Password Error:', err);
      req.flash('error', 'Error sending reset email. Please try again.');
      res.redirect('/auth/forgot-password');
    }
  },

  showResetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const user = await User.findOne({
        where: {
          resetToken: token,
          resetTokenExpiration: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        req.flash('error', 'Invalid or expired reset token.');
        return res.redirect('/auth/forgot-password');
      }

      res.render('auth/reset-password', { 
        token,
        messages: req.flash() 
      });
    } catch (err) {
      console.error('Reset Password Error:', err);
      req.flash('error', 'Error processing reset request.');
      res.redirect('/auth/forgot-password');
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;
      
      if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect(`/auth/reset-password/${token}`);
      }

      if (password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters');
        return res.redirect(`/auth/reset-password/${token}`);
      }

      const user = await User.findOne({
        where: {
          resetToken: token,
          resetTokenExpiration: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        req.flash('error', 'Invalid or expired reset token.');
        return res.redirect('/auth/forgot-password');
      }

      // Update password and clear reset token
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpiration = null;
      await user.save();

      // Send confirmation email
      await sendEmail(
        user.email,
        'Password Reset Successful - Nigeria BECE Portal',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;">Account: ${user.email}</p>
            <p style="margin: 0;">Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
        `
      );

      req.flash('success', 'Password reset successful. You can now login with your new password.');
      res.redirect('/auth/login');
    } catch (err) {
      console.error('Reset Password Error:', err);
      req.flash('error', 'Error resetting password. Please try again.');
      res.redirect(`/auth/reset-password/${token}`);
    }
  },

  logout: (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      req.flash('success', 'You have been logged out successfully.');
      res.redirect('/auth/login');
    });
  },
};

export default authController;