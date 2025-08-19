// models/School.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const School = sequelize.define('School', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stateCode: {
    type: DataTypes.STRING(3), // e.g. "ABI"
    allowNull: false
  },
  lgaSerial: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  schoolSerial: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = School;
