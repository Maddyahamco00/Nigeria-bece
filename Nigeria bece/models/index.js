// models/index.js
const sequelize = require('./db');
const User = require('./User');
const Student = require('./Student');
const School = require('./School');
const Payment = require('./Payment');

// Associations
School.hasMany(Student, { foreignKey: { name: 'schoolId', allowNull: false }, onDelete: 'CASCADE' });
Student.belongsTo(School, { foreignKey: { name: 'schoolId', allowNull: false } });

School.hasMany(Payment, { foreignKey: { name: 'schoolId', allowNull: false }, onDelete: 'CASCADE' });
Payment.belongsTo(School, { foreignKey: { name: 'schoolId', allowNull: false } });

module.exports = { sequelize, User, Student, School, Payment };
