// models/Result.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Result = sequelize.define(
  'Result',
  {
    subject: { type: DataTypes.STRING, allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 100 } },
    studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'students', key: 'id' } },
    schoolId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'schools', key: 'id' } },
  },
  {
    tableName: 'results',
    timestamps: true,
  }
);

export default Result;
