// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Clever Cloud MySQL configuration using URI
const sequelize = new Sequelize(process.env.MYSQL_ADDON_URI || 'mysql://root:1234567890#@localhost:3306/nigeria_bece_db', {
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
export { sequelize };
