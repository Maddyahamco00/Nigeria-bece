// models/School.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const School = sequelize.define('School', {
  name: { type: DataTypes.STRING, allowNull: false },
  lgaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'lgas', key: 'id' },
  },
  // Optional serial/code fields (if you need them later)
  address: {
  type: DataTypes.STRING,
  allowNull: true,   // <--- allow nulls
},
stateCode: { type: DataTypes.STRING(3), allowNull: true },
  lgaSerial: { type: DataTypes.INTEGER, allowNull: true },
  schoolSerial: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'schools',
  timestamps:  false,
});

export default School;
