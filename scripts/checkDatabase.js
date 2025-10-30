// scripts/checkDatabase.js
import sequelize from '../config/database.js';
import { Student } from '../models/index.js';

const checkDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if students table exists and has correct structure
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    console.log('📊 Tables in database:', tableExists);

    if (tableExists.includes('students')) {
      console.log('✅ Students table exists');
      
      // Check table structure
      const tableDescription = await sequelize.getQueryInterface().describeTable('students');
      console.log('📋 Students table structure:');
      console.log(tableDescription);
      
      // Count existing students
      const studentCount = await Student.count();
      console.log(`👥 Number of students in database: ${studentCount}`);
    } else {
      console.log('❌ Students table does not exist');
    }

  } catch (error) {
    console.error('❌ Database check error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

checkDatabase();