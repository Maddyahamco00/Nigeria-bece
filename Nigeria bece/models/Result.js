//This model stores academic results for students, including subjects and scores.
// It establishes a relationship with the Student model, allowing each result to be associated with a specific student.
// model/Result.js

const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');
const Student = require('./Student');

const Result = sequelize.define('Result', {
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 100 }
  }
});

Result.belongsTo(Student);
Student.hasMany(Result);

module.exports = Result;
