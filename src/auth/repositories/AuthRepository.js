// src/auth/repositories/AuthRepository.js
// Owns ALL database access for the auth domain.
// Services call this — never touch models directly.

import { Op } from 'sequelize';
import { User, Student } from '../../../models/index.js';
import { NotFoundError } from '../../errors/AppError.js';

// ── User (admin) queries ────────────────────────────────────────────────────

export const findUserByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

export const findUserById = async (id) => {
  return User.findByPk(id);
};

export const findUserByResetToken = async (token) => {
  return User.findOne({
    where: {
      resetToken: token,
      resetTokenExpiration: { [Op.gt]: new Date() },
    },
  });
};

export const createUser = async (data) => {
  return User.create(data);
};

export const updateUser = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User');
  return user.update(data);
};

export const saveUserResetToken = async (userId, token, expiration) => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');
  user.resetToken = token;
  user.resetTokenExpiration = expiration;
  return user.save();
};

export const clearUserResetToken = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');
  user.resetToken = null;
  user.resetTokenExpiration = null;
  return user.save();
};

export const setUserPassword = async (userId, hashedPassword) => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');
  user.password = hashedPassword;
  user.resetToken = null;
  user.resetTokenExpiration = null;
  return user.save();
};

export const toggleUserActive = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User');
  return user.update({ isActive: !user.isActive });
};

export const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User');
  return user.destroy();
};

export const findAllUsers = async () => {
  return User.findAll({
    attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiration'] },
    order: [['createdAt', 'DESC']],
  });
};

// ── Student queries ─────────────────────────────────────────────────────────

export const findStudentByEmail = async (email) => {
  return Student.findOne({ where: { email } });
};

export const findStudentById = async (id) => {
  return Student.findByPk(id);
};

export const findStudentByRegNumberOrEmail = async (identifier) => {
  return Student.findOne({
    where: {
      [Op.or]: [{ regNumber: identifier }, { email: identifier }],
    },
  });
};

export const findStudentByResetToken = async (token) => {
  return Student.findOne({
    where: {
      resetToken: token,
      resetTokenExpiration: { [Op.gt]: new Date() },
    },
  });
};

export const saveStudentResetToken = async (studentId, token, expiration) => {
  const student = await Student.findByPk(studentId);
  if (!student) throw new NotFoundError('Student');
  student.resetToken = token;
  student.resetTokenExpiration = expiration;
  return student.save();
};

export const setStudentPassword = async (studentId, hashedPassword) => {
  const student = await Student.findByPk(studentId);
  if (!student) throw new NotFoundError('Student');
  student.password = hashedPassword;
  student.resetToken = null;
  student.resetTokenExpiration = null;
  return student.save();
};
