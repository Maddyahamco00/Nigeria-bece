// models/State.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const State = sequelize.define(
  'State',
  {
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING(3), allowNull: false, unique: true }, // e.g. "ABI"
  },
  {
    tableName: 'states',
    timestamps:  false,
  }
);

export default State;
