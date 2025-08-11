//This model represents schools registered in the system.

// models/School.js
const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');

const School = sequelize.define('School', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = School;
