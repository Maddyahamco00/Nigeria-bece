// models/index.js
import sequelize from '../config/database.js';
import User from './User.js';
import Payment from './Payment.js';
import State from "./State.js";
import School from "./School.js";
import Student from "./Student.js";

// Associations
State.hasMany(School, { foreignKey: "stateId", onDelete: "CASCADE" });
School.belongsTo(State, { foreignKey: "stateId" });

School.hasMany(Student, { foreignKey: "schoolId", onDelete: "CASCADE" });
Student.belongsTo(School, { foreignKey: "schoolId" });
School.hasMany(Payment, {
  foreignKey: { name: 'schoolId', allowNull: true },
  onDelete: 'CASCADE',
});
Payment.belongsTo(School, { foreignKey: { name: 'schoolId', allowNull: true } });

export { sequelize, User, Student, School, Payment };
