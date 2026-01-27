// scripts/fixPaymentStatus.js
import { Student, Payment } from '../models/index.js';

async function fixPaymentStatus() {
  try {
    console.log('🔄 Fixing student payment statuses...');
    
    // Get all students
    const students = await Student.findAll();
    
    for (const student of students) {
      // Check if student has successful payment
      const payment = await Payment.findOne({
        where: { 
          email: student.email,
          status: 'success'
        }
      });
      
      if (payment && student.paymentStatus !== 'Paid') {
        await student.update({ paymentStatus: 'Paid' });
        console.log(`✅ Updated ${student.name} to Paid status`);
      } else if (!payment && student.paymentStatus !== 'Pending') {
        await student.update({ paymentStatus: 'Pending' });
        console.log(`⏳ Updated ${student.name} to Pending status`);
      }
    }
    
    console.log('✅ Payment status fix completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing payment status:', error);
    process.exit(1);
  }
}

fixPaymentStatus();