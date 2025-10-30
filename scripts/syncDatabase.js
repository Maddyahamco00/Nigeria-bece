// scripts/syncDatabase.js
import sequelize from '../config/database.js';
import './models/index.js';

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync all models (force: false to preserve data)
    await sequelize.sync({ force: false });
    console.log('✅ Database schema synced successfully');

    console.log('🎉 Database is ready!');
  } catch (error) {
    console.error('❌ Database sync error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

syncDatabase();