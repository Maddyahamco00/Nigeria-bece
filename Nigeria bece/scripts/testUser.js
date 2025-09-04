// scripts/testUser.js
import User from '../models/User.js';
import sequelize from '../config/db.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected');

    await User.sync(); // Ensure table exists

    const user = await User.create({
      username: 'muhammad kabir ahmad',
      email: 'maddyahamco00@gmail.com',
      password: '1234567890#'
    });

    console.log('🎉 New user created:', user.toJSON());
  } catch (err) {
    console.error('❌ Creation error:', err);
  } finally {
    await sequelize.close();
  }
})();
