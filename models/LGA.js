// models/LGA.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import State from './State.js';

const LGA = sequelize.define('LGA', {
  name: { type: DataTypes.STRING, allowNull: false },
  stateId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  field: 'state_id', // or whatever your column name is
  references: { model: 'states', key: 'id' },
}
,
}, {
  tableName: 'lgas',
  timestamps:  false,
});

export default LGA;
