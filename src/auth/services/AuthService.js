// src/auth/services/AuthService.js
// Pure business logic — no req/res, no flash, no redirects.
// Throws AppError subclasses; controllers/routes handle the response.

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger.js';
import {
  ConflictError,
  NotFoundError,
  AuthenticationError,
  TokenInvalidError,
  AuthorizationError,
} from '../../errors/AppError.js';

import * as AuthRepository from '../repositories/AuthRepository.js';
import sendEmail from '../../utils/sendEmail.js';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Lazy-read BASE_URL so tests can set process.env before importing
const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:3000';

// ── Admin Auth ───────────────────────────────────────────────────────────────

/**
 * Register a new admin user.
 * Hashing is handled by the User model beforeCreate hook,
 * so we pass the plain password and let the hook do the work.
 */
export const registerAdmin = async ({ name, email, password, role, stateId, schoolId }) => {
  const existing = await AuthRepository.findUserByEmail(email);
  if (existing) throw new ConflictError('An account with this email already exists');

  const userData = { name, email, password, role: role || 'admin', isActive: true };
  if (role === 'state_admin' && stateId) userData.stateId = stateId;
  if (role === 'school_admin' && schoolId) userData.schoolId = schoolId;

  const user = await AuthRepository.createUser(userData);
  logger.info('Admin registered', { userId: user.id, role: user.role, email: user.email });
  return user;
};

/**
 * Validate admin credentials — used by Passport local-admin strategy.
 * Returns the user on success, throws AuthenticationError on failure.
 */
export const validateAdminCredentials = async (email, password) => {
  const user = await AuthRepository.findUserByEmail(email);
  if (!user) throw new AuthenticationError('Invalid email or password');

  const ADMIN_ROLES = ['super_admin', 'admin', 'state_admin', 'school_admin', 'exam_admin', 'feedback_admin'];
  if (!ADMIN_ROLES.includes(user.role)) {
    throw new AuthenticationError('Access denied — admin role required');
  }

  if (!user.isActive) throw new AuthenticationError('Account is deactivated');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AuthenticationError('Invalid email or password');

  logger.info('Admin login success', { userId: user.id, email: user.email, role: user.role });
  return user;
};

// ── Student Auth ─────────────────────────────────────────────────────────────

/**
 * Validate student credentials — used by Passport local-student strategy.
 */
export const validateStudentCredentials = async (identifier, password) => {
  const student = await AuthRepository.findStudentByRegNumberOrEmail(identifier);
  if (!student) {
    throw new AuthenticationError('Registration number or email not found');
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) throw new AuthenticationError('Incorrect password');

  logger.info('Student login success', { studentId: student.id, regNumber: student.regNumber });
  return student;
};

// ── Password Reset ───────────────────────────────────────────────────────────

/**
 * Initiate password reset for admin or student.
 * Always succeeds from the caller's perspective (no user enumeration).
 */
export const initiatePasswordReset = async (email, userType = 'student') => {
  let account;
  if (userType === 'admin') {
    account = await AuthRepository.findUserByEmail(email);
  } else {
    account = await AuthRepository.findStudentByEmail(email);
  }

  // Silently return if account not found — prevents user enumeration
  if (!account) {
    logger.warn('Password reset requested for unknown email', { email, userType });
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiration = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  if (userType === 'admin') {
    await AuthRepository.saveUserResetToken(account.id, rawToken, expiration);
  } else {
    await AuthRepository.saveStudentResetToken(account.id, rawToken, expiration);
  }

  const resetUrl = `${getBaseUrl()}/auth/reset-password/${rawToken}?type=${userType}`;
  logger.info('Password reset token generated', { accountId: account.id, userType });

  // Fire-and-forget — never block the response on email delivery
  sendEmail(
    account.email,
    'Password Reset — Nigeria BECE Portal',
    `<p>Click the link below to reset your password (valid for 1 hour):</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>If you did not request this, ignore this email.</p>`
  ).catch((err) => logger.error('Failed to send reset email', { error: err.message }));
};

/**
 * Validate a reset token and return the account it belongs to.
 */
export const validateResetToken = async (token, userType = 'student') => {
  let account;
  if (userType === 'admin') {
    account = await AuthRepository.findUserByResetToken(token);
  } else {
    account = await AuthRepository.findStudentByResetToken(token);
  }

  if (!account) throw new TokenInvalidError('Invalid or expired reset token');
  return account;
};

/**
 * Complete the password reset — hash new password, clear token.
 */
export const completePasswordReset = async (token, newPassword, userType = 'student') => {
  const account = await validateResetToken(token, userType);

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  if (userType === 'admin') {
    await AuthRepository.setUserPassword(account.id, hashed);
  } else {
    await AuthRepository.setStudentPassword(account.id, hashed);
  }

  logger.info('Password reset completed', { accountId: account.id, userType });

  // Fire-and-forget confirmation email
  if (account.email) {
    sendEmail(
      account.email,
      'Password Changed — Nigeria BECE Portal',
      `<p>Your password was successfully changed. If you did not do this, contact support immediately.</p>`
    ).catch((err) => logger.error('Failed to send password changed email', { error: err.message }));
  }

  return userType === 'admin' ? '/auth/admin' : '/auth/student/login';
};

// ── User Management (admin-facing) ──────────────────────────────────────────

export const getAllUsers = async () => {
  return AuthRepository.findAllUsers();
};

export const toggleUserStatus = async (id) => {
  const user = await AuthRepository.toggleUserActive(id);
  logger.info('User status toggled', { userId: id, isActive: user.isActive });
  return user;
};

export const removeUser = async (id, requestingUser) => {
  const target = await AuthRepository.findUserById(id);
  if (!target) throw new NotFoundError('User');
  if (target.role === 'super_admin') {
    throw new AuthorizationError('Cannot delete a super admin account');
  }
  await AuthRepository.deleteUser(id);
  logger.info('User deleted', { deletedId: id, deletedBy: requestingUser.id });
};
