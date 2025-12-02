// models/Subject.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Subject = sequelize.define('Subject', {
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'subject_name' // maps to subject_name column
  }
}  ,{
  tableName: 'subjects',
  timestamps: false,
});

export default Subject;