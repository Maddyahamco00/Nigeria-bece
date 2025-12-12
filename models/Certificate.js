// models/Certificate.js
import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const Certificate = db.define('Certificate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  certificateNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  examYear: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  issueDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('pending', 'issued', 'collected'),
    defaultValue: 'pending'
  },
  digitalHash: {
    type: DataTypes.STRING
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastDownloaded: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'certificates',
  timestamps: true
});

export default Certificate;