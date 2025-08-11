// models/School.js
const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');

const School = sequelize.define('School', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  }
}, {
  tableName: 'schools',
  timestamps: true
});

module.exports = School;
