import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { sequelize } from '../config/index.js';

async function fixAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const [user, created] = await User.findOrCreate({
      where: { email: 'maddyahamco00@gmail.com' },
      defaults: {
        name: 'Muhammad Kabir Ahmad',
        email: 'maddyahamco00@gmail.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        permissions: {}
      }
    });
    
    if (!created) {
      await user.update({ password: hashedPassword, role: 'super_admin' });
      console.log('🔄 Admin password updated');
    } else {
      console.log('✅ Admin created');
    }
    
    // Test password
    const testMatch = await bcrypt.compare('123456', hashedPassword);
    console.log(`🔍 Password test: ${testMatch}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixAdmin();