// models/db.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,        // Database name
  process.env.DB_USER,        // Database user
  process.env.DB_PASSWORD,    // Database password
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,           // Set true for SQL debugging
    define: {
      timestamps: false,       // Adds createdAt and updatedAt
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export default sequelize;
// This file sets up the Sequelize connection to the MySQL database.
