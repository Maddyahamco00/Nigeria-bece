//This file configures the MySQL database connection using environment variables.
// config/database.js

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  port: process.env.DB_PORT || 3306,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234567890#',
  database: process.env.DB_NAME || 'nigeria_bece_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;