//This model stores student information, including their state and school affiliations.

// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');
const School = require('./School');

const Student = sequelize.define('Student', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  regNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
});

Student.belongsTo(School);
School.hasMany(Student);

module.exports = Student;
