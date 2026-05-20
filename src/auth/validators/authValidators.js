// src/auth/validators/authValidators.js
// Joi schemas for every auth input.
// Used by controllers before calling services.

import Joi from 'joi';

const NIGERIAN_PHONE = /^(\+234|0)[789]\d{9}$/;
const PASSWORD_MIN = 6;

// ── Admin schemas ────────────────────────────────────────────────────────────

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(PASSWORD_MIN).required().messages({
    'string.min': `Password must be at least ${PASSWORD_MIN} characters`,
    'any.required': 'Password is required',
  }),
});

export const adminRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(PASSWORD_MIN).required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
  role: Joi.string()
    .valid('admin', 'state_admin', 'school_admin', 'exam_admin', 'feedback_admin')
    .default('admin'),
  stateId: Joi.number().integer().positive().optional().allow(null, ''),
  schoolId: Joi.number().integer().positive().optional().allow(null, ''),
});

// ── Student schemas ──────────────────────────────────────────────────────────

export const studentLoginSchema = Joi.object({
  regNumber: Joi.string().required().messages({
    'any.required': 'Registration number or email is required',
  }),
  password: Joi.string().min(PASSWORD_MIN).required().messages({
    'string.min': `Password must be at least ${PASSWORD_MIN} characters`,
    'any.required': 'Password is required',
  }),
});

export const studentRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional().allow('', null),
  password: Joi.string().min(PASSWORD_MIN).required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
  gender: Joi.string().valid('Male', 'Female').optional().allow('', null),
  dob: Joi.date().optional().allow('', null),
  guardianPhone: Joi.string()
    .pattern(NIGERIAN_PHONE)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base':
        'Guardian phone must be a valid Nigerian number (e.g. 08012345678)',
    }),
  stateId: Joi.number().integer().positive().required(),
  lgaId: Joi.number().integer().positive().required(),
  schoolId: Joi.number().integer().positive().required(),
});

// ── Password reset schemas ───────────────────────────────────────────────────

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  userType: Joi.string().valid('admin', 'student').default('student'),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().min(PASSWORD_MIN).required().messages({
    'string.min': `Password must be at least ${PASSWORD_MIN} characters`,
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
  userType: Joi.string().valid('admin', 'student').default('student'),
});

// ── Validator helper ─────────────────────────────────────────────────────────

/**
 * Validates req.body against a Joi schema.
 * On failure: flashes the first error and redirects.
 * On success: calls next().
 *
 * @param {Joi.ObjectSchema} schema
 * @param {string} redirectPath  - where to redirect on failure
 */
export const validateBody = (schema, redirectPath) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details[0].message;
    req.flash('error', message);
    return res.redirect(redirectPath);
  }

  // Replace req.body with the validated + stripped value
  req.body = value;
  next();
};
