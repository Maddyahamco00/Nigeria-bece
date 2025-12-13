// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Clever Cloud MySQL configuration
const sequelize = new Sequelize(
  process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'nigeria_bece_db',
  process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
  process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '1234567890#',
  {
    host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;
export { sequelize };
