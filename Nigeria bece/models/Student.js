// models/Student.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Student = sequelize.define(
  'Student',
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    regNumber: { type: DataTypes.STRING, unique: true, allowNull: true }, // e.g. BECE2505136711
    studentCode: { type: DataTypes.STRING, unique: true, allowNull: true }, // alternate
    password: { type: DataTypes.STRING, allowNull: true }, // optional if you allow password logins
    gender: { type: DataTypes.ENUM('Male', 'Female'), allowNull:  false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
    guardianPhone: { type: DataTypes.STRING, allowNull:  false },
    paymentStatus: {
  type: DataTypes.ENUM('Pending', 'Paid'),
  allowNull: false,
  defaultValue: 'Pending',
},

    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'schools', key: 'id' },
    },
    stateId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'states', key: 'id' } },
    lgaId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'lgas', key: 'id' } },
    //code: { type: DataTypes.STRING, allowNull: true }, // short PIN if used
  },
  {
    tableName: 'students',
    timestamps: true,
  }
);

export default Student;
