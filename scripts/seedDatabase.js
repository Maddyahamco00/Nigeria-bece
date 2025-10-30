// scripts/seedDatabase.js
import sequelize from '../config/database.js';
import { State, LGA, School, User } from '../models/index.js';
import bcrypt from 'bcryptjs';

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Database synced');

    // Seed States
    const statesData = [
      { name: 'Abia', code: 'ABI' },
      { name: 'Adamawa', code: 'ADA' },
      { name: 'Akwa Ibom', code: 'AKW' },
      { name: 'Anambra', code: 'ANA' },
      { name: 'Bauchi', code: 'BAU' },
      { name: 'Bayelsa', code: 'BAY' },
      { name: 'Benue', code: 'BEN' },
      { name: 'Borno', code: 'BOR' },
      { name: 'Cross River', code: 'CRO' },
      { name: 'Delta', code: 'DEL' },
      { name: 'Ebonyi', code: 'EBO' },
      { name: 'Edo', code: 'EDO' },
      { name: 'Ekiti', code: 'EKI' },
      { name: 'Enugu', code: 'ENU' },
      { name: 'FCT', code: 'FCT' },
      { name: 'Gombe', code: 'GOM' },
      { name: 'Imo', code: 'IMO' },
      { name: 'Jigawa', code: 'JIG' },
      { name: 'Kaduna', code: 'KAD' },
      { name: 'Kano', code: 'KAN' },
      { name: 'Katsina', code: 'KAT' },
      { name: 'Kebbi', code: 'KEB' },
      { name: 'Kogi', code: 'KOG' },
      { name: 'Kwara', code: 'KWA' },
      { name: 'Lagos', code: 'LAG' },
      { name: 'Nasarawa', code: 'NAS' },
      { name: 'Niger', code: 'NIG' },
      { name: 'Ogun', code: 'OGU' },
      { name: 'Ondo', code: 'OND' },
      { name: 'Osun', code: 'OSU' },
      { name: 'Oyo', code: 'OYO' },
      { name: 'Plateau', code: 'PLA' },
      { name: 'Rivers', code: 'RIV' },
      { name: 'Sokoto', code: 'SOK' },
      { name: 'Taraba', code: 'TAR' },
      { name: 'Yobe', code: 'YOB' },
      { name: 'Zamfara', code: 'ZAM' }
    ];

    const states = await State.bulkCreate(statesData, { ignoreDuplicates: true });
    console.log(`✅ ${states.length} states seeded`);

    // Seed LGAs (sample for a few states)
    const lgasData = [
      // Lagos LGAs
      { name: 'Agege', stateId: 25 }, { name: 'Ajeromi-Ifelodun', stateId: 25 },
      { name: 'Alimosho', stateId: 25 }, { name: 'Amuwo-Odofin', stateId: 25 },
      
      // Abuja (FCT) LGAs
      { name: 'Abuja Municipal', stateId: 15 }, { name: 'Bwari', stateId: 15 },
      { name: 'Gwagwalada', stateId: 15 }, { name: 'Kuje', stateId: 15 },
      
      // Kano LGAs
      { name: 'Dala', stateId: 20 }, { name: 'Fagge', stateId: 20 },
      { name: 'Gwale', stateId: 20 }, { name: 'Kano Municipal', stateId: 20 }
    ];

    const lgas = await LGA.bulkCreate(lgasData, { ignoreDuplicates: true });
    console.log(`✅ ${lgas.length} LGAs seeded`);

    // Seed Sample Schools
    const schoolsData = [
      { name: 'Government Secondary School Agege', lgaId: 1, address: 'Agege, Lagos' },
      { name: 'Unity Secondary School Abuja', lgaId: 5, address: 'Central Area, Abuja' },
      { name: 'Science Secondary School Kano', lgaId: 9, address: 'Kano Municipal, Kano' },
      { name: 'Community High School Lagos', lgaId: 3, address: 'Alimosho, Lagos' }
    ];

    const schools = await School.bulkCreate(schoolsData, { ignoreDuplicates: true });
    console.log(`✅ ${schools.length} schools seeded`);

    // Create Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@bece.gov.ng',
      password: hashedPassword,
      role: 'superadmin'
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Email: superadmin@bece.gov.ng');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await sequelize.close();
  }
};

seedData();