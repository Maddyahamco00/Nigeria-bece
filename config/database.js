// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'nigeria_bece_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '1234567890#',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
      logging: false,
      dialectOptions: process.env.DB_SSL && process.env.DB_SSL !== 'false' ? { ssl: { rejectUnauthorized: false } } : {},
  }
);

export default sequelize;
export { sequelize };
