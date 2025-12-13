// Test database connection
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Host:', process.env.MYSQL_ADDON_HOST);
  console.log('User:', process.env.MYSQL_ADDON_USER);
  console.log('Database:', process.env.MYSQL_ADDON_DB);
  console.log('Port:', process.env.MYSQL_ADDON_PORT);

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST,
      user: process.env.MYSQL_ADDON_USER,
      password: process.env.MYSQL_ADDON_PASSWORD,
      database: process.env.MYSQL_ADDON_DB,
      port: parseInt(process.env.MYSQL_ADDON_PORT || '3306')
    });

    console.log('✅ Database connection successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();