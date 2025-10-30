// models/Student.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Student = sequelize.define(
  'Student',
  {
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING, 
      allowNull: true, // Changed to match database
      unique: true 
    },
    regNumber: { 
      type: DataTypes.STRING, 
      unique: true, 
      allowNull: true 
    },
    studentCode: { 
      type: DataTypes.STRING, 
      unique: true, 
      allowNull: true 
    },
    password: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    gender: { 
      type: DataTypes.ENUM('Male', 'Female'), 
      allowNull: true // Changed to match database
    },
    dateOfBirth: { 
      type: DataTypes.DATEONLY, 
      allowNull: true // Changed to match database
    },
    guardianPhone: { 
      type: DataTypes.STRING, 
      allowNull: true // Changed to match database
    },
   paymentStatus: {
  type: DataTypes.ENUM('pending', 'paid'),
  allowNull: false,
  defaultValue: 'pending',
},
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'schools', key: 'id' },
    },
    stateId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, // This matches database
      references: { model: 'states', key: 'id' } 
    },
    lgaId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, // This matches database
      references: { model: 'lgas', key: 'id' } 
    },
  },
  {
    tableName: 'students',
    timestamps: true,
  }
);

export default Student;