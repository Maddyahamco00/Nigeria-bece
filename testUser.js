// scripts/testUser.js
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import sequelize from './config/database.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected');

    // Sync just the User model (or all models by using sequelize.sync())
    await User.sync(); // ensure table exists

    const hashedPassword = await bcrypt.hash('1234567890#', 10);

    const user = await User.create({
      name: 'Muhammad Kabir Ahmad',
      email: 'maddyahamco00@gmail.com',
      password: '1234567890#',
      role: 'admin',
    });

    console.log('🎉 New user created:', user.toJSON());
  } catch (err) {
    console.error('❌ Creation error:', err);
  } finally {
    await sequelize.close();
  }
})();
