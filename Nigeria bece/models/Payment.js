// models/Payment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');

const Payment = sequelize.define('Payment', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 }
  },
  reference: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;
