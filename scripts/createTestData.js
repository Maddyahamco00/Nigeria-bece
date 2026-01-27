// scripts/createTestData.js
import { Student, Payment, School, State, LGA } from '../models/index.js';

async function createTestData() {
  try {
    console.log('🔄 Creating test data...');
    
    // Create test state and LGA
    const [state] = await State.findOrCreate({
      where: { name: 'Lagos' },
      defaults: { name: 'Lagos' }
    });
    
    const [lga] = await LGA.findOrCreate({
      where: { name: 'Lagos Island', stateId: state.id },
      defaults: { name: 'Lagos Island', stateId: state.id }
    });
    
    // Create test school
    const [school] = await School.findOrCreate({
      where: { name: 'Test Secondary School' },
      defaults: {
        name: 'Test Secondary School',
        address: 'Lagos Island',
        stateId: state.id,
        lgaId: lga.id,
        serial: '001'
      }
    });
    
    // Create test students
    const students = [
      { name: 'Khalid Ahmed', email: 'khalid@test.com' },
      { name: 'Sadiq Kabir', email: 'sadiq@test.com' },
      { name: 'Kabir Muhammad', email: 'kabir@test.com' },
      { name: 'Aisha Bello', email: 'aisha@test.com' },
      { name: 'Fatima Usman', email: 'fatima@test.com' }
    ];
    
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      
      // Create student
      const [student] = await Student.findOrCreate({
        where: { email: studentData.email },
        defaults: {
          name: studentData.name,
          email: studentData.email,
          password: 'password123',
          regNumber: `BECE2024${String(i + 1).padStart(6, '0')}`,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          dateOfBirth: '2008-01-01',
          guardianPhone: `080${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          paymentStatus: i < 3 ? 'Paid' : 'Pending',
          schoolId: school.id,
          stateId: state.id,
          lgaId: lga.id
        }
      });
      
      // Create payment for paid students
      if (i < 3) {
        await Payment.findOrCreate({
          where: { email: studentData.email },
          defaults: {
            email: studentData.email,
            amount: 5000,
            reference: `TEST_REF_${Date.now()}_${i}`,
            status: 'success',
            code: `BECE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            studentId: student.id,
            schoolId: school.id
          }
        });
      }
      
      console.log(`✅ Created student: ${studentData.name} (${i < 3 ? 'Paid' : 'Pending'})`);
    }
    
    // Create additional payments for revenue chart
    const months = [-5, -4, -3, -2, -1, 0];
    for (const monthOffset of months) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthOffset);
      
      const payment = await Payment.create({
        email: `revenue${monthOffset}@test.com`,
        amount: Math.floor(Math.random() * 50000) + 10000,
        reference: `REVENUE_${Date.now()}_${monthOffset}`,
        status: 'success',
        code: `BECE-REV${Math.abs(monthOffset)}`,
        createdAt: date,
        updatedAt: date
      });
      
      console.log(`💰 Created revenue payment for ${date.toLocaleDateString()}: ₦${payment.amount}`);
    }
    
    console.log('✅ Test data creation completed');
    
    // Show summary
    const totalStudents = await Student.count();
    const totalPayments = await Payment.count({ where: { status: 'success' } });
    const totalRevenue = await Payment.sum('amount', { where: { status: 'success' } });
    
    console.log('\n📊 Summary:');
    console.log(`   Students: ${totalStudents}`);
    console.log(`   Successful Payments: ${totalPayments}`);
    console.log(`   Total Revenue: ₦${totalRevenue?.toLocaleString() || 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();