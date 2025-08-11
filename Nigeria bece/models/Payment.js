//This model stores payment details, including Paystack transaction references and generated codes.

// models/Payment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');

const Payment = sequelize.define('Payment', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
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
});

module.exports = Payment;
