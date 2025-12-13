// scripts/createSuperAdmin.js
import sequelize from '../config/database.js';
import User from '../models/User.js';

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'superadmin@bece.gov.ng' } 
    });

    if (existingAdmin) {
      console.log('✅ Super Admin already exists');
      await sequelize.close();
      return;
    }

    // Create super admin
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@bece.gov.ng',
      password: 'admin123', // Let User model hooks handle hashing
      role: 'superadmin'
    });

    console.log('🎉 Super Admin created successfully!');
    console.log('📧 Email: superadmin@bece.gov.ng');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: superadmin');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

createSuperAdmin();