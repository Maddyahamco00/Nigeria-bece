//This model stores payment details, including Paystack transaction references and generated codes.

// models/Payment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      transactionReference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
      },
      accessCode: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'payments',
      timestamps: true,
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Student, { foreignKey: 'studentId' });
  };

  return Payment;
};