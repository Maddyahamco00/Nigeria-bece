// scripts/initDb.js
import sequelize from '../config/database.js';
import '../models/index.js';

async function initializeDatabase() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synced successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

initializeDatabase();