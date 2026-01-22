// models/ExamTimetable.js
import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const ExamTimetable = db.define('ExamTimetable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examYear: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subjects',
      key: 'id'
    }
  },
  examDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // minutes
    allowNull: false
  },
  paperType: {
    type: DataTypes.ENUM('objective', 'theory', 'practical'),
    defaultValue: 'objective'
  },
  instructions: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'exam_timetables',
  timestamps: true
});

export default ExamTimetable;