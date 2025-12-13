// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration - handle both local and production environments
let sequelize;

if (process.env.MYSQL_ADDON_URI) {
  // Production: Use Clever Cloud MySQL URI
  sequelize = new Sequelize(process.env.MYSQL_ADDON_URI, {
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (process.env.MYSQL_ADDON_HOST) {
  // Production: Use individual Clever Cloud MySQL variables
  sequelize = new Sequelize(
    process.env.MYSQL_ADDON_DB,
    process.env.MYSQL_ADDON_USER,
    process.env.MYSQL_ADDON_PASSWORD,
    {
      host: process.env.MYSQL_ADDON_HOST,
      port: process.env.MYSQL_ADDON_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // Local development
  sequelize = new Sequelize(
    process.env.DB_NAME || 'nigeria_bece_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '1234567890#',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

export default sequelize;
export { sequelize };
