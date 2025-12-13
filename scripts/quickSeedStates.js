// Quick seed for testing
import { sequelize } from '../config/index.js';

async function quickSeed() {
  try {
    await sequelize.query(`
      INSERT IGNORE INTO States (name, code, createdAt, updatedAt) VALUES 
      ('Lagos', 'LAG', NOW(), NOW()),
      ('Abuja', 'FCT', NOW(), NOW()),
      ('Kano', 'KAN', NOW(), NOW()),
      ('Rivers', 'RIV', NOW(), NOW()),
      ('Oyo', 'OYO', NOW(), NOW())
    `);
    
    await sequelize.query(`
      INSERT IGNORE INTO LGAs (name, stateId, createdAt, updatedAt) VALUES 
      ('Ikeja', 1, NOW(), NOW()),
      ('Lagos Island', 1, NOW(), NOW()),
      ('Gwagwalada', 2, NOW(), NOW()),
      ('Municipal', 2, NOW(), NOW()),
      ('Kano Municipal', 3, NOW(), NOW())
    `);
    
    console.log('✅ Quick seed completed');
  } catch (error) {
    console.error('❌ Quick seed failed:', error);
  }
}

quickSeed();