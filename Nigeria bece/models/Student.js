// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');

const Student = sequelize.define('Student', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  regNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { notEmpty: true }
  }
}, {
  tableName: 'students',
  timestamps: true
});

module.exports = Student;
