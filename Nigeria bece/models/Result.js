// models/Result.js
import { DataTypes } from 'sequelize';
import sequelize from '../models/db.js';
import Student from './Student.js';

const Result = sequelize.define('Result', {
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 100 },
  },
});

Result.belongsTo(Student);
Student.hasMany(Result);

export default Result;
