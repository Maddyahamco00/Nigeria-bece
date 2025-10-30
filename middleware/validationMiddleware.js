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

export const validateRegistration = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('email')
    .isEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error_msg', errors.array()[0].msg);
      return res.redirect('/auth/register');
    }
    next();
  }
];
