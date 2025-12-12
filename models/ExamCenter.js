// models/ExamCenter.js
import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const ExamCenter = db.define('ExamCenter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  stateId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lgaId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  facilities: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  contactPerson: {
    type: DataTypes.STRING
  },
  contactPhone: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'exam_centers',
  timestamps: true
});

export default ExamCenter;