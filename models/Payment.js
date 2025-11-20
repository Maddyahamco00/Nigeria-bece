// models/Payment.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define(
  'Payment',
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 },
    },
    reference: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    transactionReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'payments',
    timestamps: true, // prefer createdAt/updatedAt for payments
  }
);

export default Payment;
