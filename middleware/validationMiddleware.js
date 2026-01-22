// middleware/validationMiddleware.js
import { body, validationResult } from 'express-validator';

export const validatePayment = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  body('email')
    .isEmail()
    .withMessage('Invalid email address'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error_msg', errors.array()[0].msg);
      return res.redirect('/payment');
    }
    next();
  }
];

export const validateStudentRegistration = [
  body('name')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('guardianPhone')
    .matches(/^(\+234|0)[789]\d{9}$/)
    .withMessage('Guardian phone must be a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/student/register');
    }
    next();
  }
];

export const validateStudentUpdate = [
  body('name')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .withMessage('Invalid email address'),
  body('guardianPhone')
    .matches(/^(\+234|0)[789]\d{9}$/)
    .withMessage('Guardian phone must be a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/admin/students');
    }
    next();
  }
];
