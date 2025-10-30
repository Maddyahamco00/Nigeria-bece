// scripts/createDemoData.js
import sequelize from '../config/database.js';
import { User, School, State, LGA, Student } from '../models/index.js';
import bcrypt from 'bcryptjs';

const createDemoData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create Super Admin
    const superAdminPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@bece.gov.ng',
      password: superAdminPassword,
      role: 'superadmin'
    });
    console.log('✅ Super Admin created');

    // Create Regular Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'School Administrator',
      email: 'admin@school.edu.ng',
      password: adminPassword,
      role: 'admin'
    });
    console.log('✅ Admin user created');

    // Create sample schools
    const schools = await School.bulkCreate([
      { name: 'Government Secondary School Abuja', lgaId: 1, address: 'Central Area, Abuja' },
      { name: 'Community High School Lagos', lgaId: 2, address: 'Ikeja, Lagos' },
      { name: 'Science Secondary School Kano', lgaId: 3, address: 'Kano Municipal' },
      { name: 'Unity College Port Harcourt', lgaId: 4, address: 'Port Harcourt' },
      { name: 'Model Secondary School Ibadan', lgaId: 5, address: 'Ibadan' }
    ]);
    console.log(`✅ ${schools.length} sample schools created`);

    // Create sample students
    const studentPassword = await bcrypt.hash('student123', 10);
    const students = await Student.bulkCreate([
      { name: 'John Student', email: 'john@student.com', password: studentPassword, schoolId: 1, paymentStatus: 'Paid', regNumber: 'BECE2024000001' },
      { name: 'Mary Student', email: 'mary@student.com', password: studentPassword, schoolId: 2, paymentStatus: 'Pending', regNumber: 'BECE2024000002' },
      { name: 'David Student', email: 'david@student.com', password: studentPassword, schoolId: 3, paymentStatus: 'Paid', regNumber: 'BECE2024000003' }
    ]);
    console.log(`✅ ${students.length} sample students created`);

    
    console.log('\n🎉 DEMO DATA CREATED SUCCESSFULLY!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('👑 Super Admin:');
    console.log('   Email: superadmin@bece.gov.ng');
    console.log('   Password: admin123');
    console.log('   URL: http://localhost:3000/admin/auth/login');
    
    console.log('\n👨‍💼 Admin:');
    console.log('   Email: admin@school.edu.ng');
    console.log('   Password: admin123');
    
    console.log('\n👨‍🎓 Students:');
    console.log('   Reg Number: BECE2024000001');
    console.log('   Password: student123');
    console.log('   URL: http://localhost:3000/students/auth/login');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

createDemoData();