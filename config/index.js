import dotenv from 'dotenv';
import sequelize from './database.js';
dotenv.config();

export const PAYSTACK_CONFIG = {
  PAYSTACK_SECRET: process.env.PAYSTACK_SECRET,
  PAYSTACK_PUBLIC: process.env.PAYSTACK_PUBLIC,
  AMOUNT: 5000,
  MODE: process.env.MODE || 'test',
};

export { sequelize };
