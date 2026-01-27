// scripts/addTestPayment.js
import { Student, Payment } from '../models/index.js';

async function addTestPayment() {
  try {
    console.log('🔄 Adding test payment...');
    
    // Find first student
    const student = await Student.findOne();
    if (!student) {
      console.log('❌ No students found');
      return;
    }
    
    // Create test payment
    const payment = await Payment.create({
      email: student.email,
      amount: 5000,
      reference: 'TEST_REF_' + Date.now(),
      status: 'success',
      code: 'BECE-TEST123'
    });
    
    // Update student payment status
    await student.update({ paymentStatus: 'Paid' });
    
    console.log(`✅ Created test payment for ${student.name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Amount: ₦${payment.amount}`);
    console.log(`   Reference: ${payment.reference}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test payment:', error);
    process.exit(1);
  }
}

addTestPayment();