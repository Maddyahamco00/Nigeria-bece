// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const School = require('./School');

const Student = sequelize.define('Student', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  studentCode: { type: DataTypes.STRING, unique: true },
  gender: { type: DataTypes.ENUM('Male', 'Female'), allowNull: true },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
  guardianPhone: { type: DataTypes.STRING, allowNull: true }
});

// associations
Student.belongsTo(School, { foreignKey: 'schoolId' });
School.hasMany(Student, { foreignKey: 'schoolId' });

module.exports = Student;
