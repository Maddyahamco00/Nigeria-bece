// services/paymentService.js
import sendEmail from '../utils/sendEmail.js';
import { Payment, Student, School } from '../models/index.js';
import generateStudentCode from '../utils/generateStudentCode.js';

export async function handleSuccessfulPayment({ reference, amount, email, firstName, schoolId }) {
  // Ensure we have school object early (used later for emails)
  const school = await School.findByPk(schoolId);
  if (!school) throw new Error('❌ School not found for this payment');

  // 1. Save Payment
  let payment = await Payment.findOne({ where: { reference } });
  if (!payment) {
    payment = await Payment.create({ reference, amount, status: 'success', email, schoolId });
  } else {
    await payment.update({ status: 'success' });
  }

  // 2. Create Student if not exists
  let student = await Student.findOne({ where: { email } });
  if (!student) {
    const year = new Date().getFullYear();
    const stateCode = school.stateCode || 'XXX';
    const lgaSerial = school.lgaSerial || 0;
    const schoolSerial = school.schoolSerial || 0;
    const studentSerial = (await Student.count({ where: { schoolId } })) + 1;

    const code = await generateStudentCode(school.stateId || 1, school.lgaId || 1, schoolId);

    student = await Student.create({
      name: firstName || 'Unknown',
      email,
      studentCode: code,
      schoolId,
      // set defaults for required fields if needed
      paymentStatus: 'paid'
    });
  } else {
    // Ensure paymentStatus/set to paid
    if (student.paymentStatus !== 'paid') {
      student.paymentStatus = 'paid';
      await student.save();
    }
  }

  // 3. Send Emails
  await sendEmail(
    student.email,
    'Welcome to My School',
    `<h1>Welcome ${student.name}</h1>
     <p>Your student code is: <strong>${student.studentCode}</strong></p>`
  );

  await sendEmail(
    process.env.ADMIN_EMAIL,
    'New Student Registration',
    `<h2>New Student Registered</h2>
     <p><strong>Name:</strong> ${student.name}</p>
     <p><strong>Email:</strong> ${student.email}</p>
     <p><strong>Student Code:</strong> ${student.studentCode}</p>
     <p><strong>School:</strong> ${school.name}</p>
     <p><strong>Amount Paid:</strong> ₦${amount}</p>`
  );
}
