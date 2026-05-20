// config/env.js
// Centralized environment variable validation and access.
// Import this instead of reading process.env directly throughout the app.

import dotenv from 'dotenv';
dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, defaultValue = '') => process.env[key] || defaultValue;

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3000'), 10),

  // Session — required in production
  SESSION_SECRET: process.env.NODE_ENV === 'production'
    ? required('SESSION_SECRET')
    : optional('SESSION_SECRET', 'dev-session-secret-change-in-production'),

  // Database
  DB_HOST: optional('DB_HOST', 'localhost'),
  DB_PORT: parseInt(optional('DB_PORT', '3306'), 10),
  DB_NAME: optional('DB_NAME', 'nigeria_bece_db'),
  DB_USER: optional('DB_USER', 'root'),
  DB_PASSWORD: optional('DB_PASSWORD', ''),
  MYSQL_ADDON_URI: optional('MYSQL_ADDON_URI'),
  MYSQL_ADDON_HOST: optional('MYSQL_ADDON_HOST'),
  MYSQL_ADDON_DB: optional('MYSQL_ADDON_DB'),
  MYSQL_ADDON_USER: optional('MYSQL_ADDON_USER'),
  MYSQL_ADDON_PASSWORD: optional('MYSQL_ADDON_PASSWORD'),
  MYSQL_ADDON_PORT: parseInt(optional('MYSQL_ADDON_PORT', '3306'), 10),

  // Redis
  REDIS_URL: optional('REDIS_URL'),
  REDISCLOUD_URL: optional('REDISCLOUD_URL'),

  // Paystack
  PAYSTACK_SECRET_KEY: optional('PAYSTACK_SECRET_KEY'),
  PAYSTACK_PUBLIC_KEY: optional('PAYSTACK_PUBLIC_KEY'),

  // Email
  EMAIL_HOST: optional('EMAIL_HOST', 'smtp.gmail.com'),
  EMAIL_PORT: parseInt(optional('EMAIL_PORT', '587'), 10),
  EMAIL_USER: optional('EMAIL_USER'),
  EMAIL_PASS: optional('EMAIL_PASS'),
  EMAIL_FROM: optional('EMAIL_FROM'),
  ADMIN_EMAIL: optional('ADMIN_EMAIL'),

  // SMS
  SMS_API_KEY: optional('SMS_API_KEY'),
  SMS_SENDER: optional('SMS_SENDER', 'BECE-NG'),
  SMS_BASE_URL: optional('SMS_BASE_URL', 'https://api.ng.termii.com/api/sms/send'),

  // App
  BASE_URL: optional('BASE_URL', 'http://localhost:3000'),
  APP_URL: optional('APP_URL', 'http://localhost:3000'),

  // Admin
  SUPER_ADMIN_PASSWORD: optional('SUPER_ADMIN_PASSWORD'),
  SUPER_ADMIN_EMAIL: optional('SUPER_ADMIN_EMAIL', 'superadmin@bece.gov.ng'),

  // Helpers
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

export default env;
