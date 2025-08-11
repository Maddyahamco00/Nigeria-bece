// services/paymentService.js
const sendEmail = require('../utils/sendEmail');
const { Payment, Student } = require('../models');

async function handleSuccessfulPayment({ reference, amount, email, firstName }) {
  // Update or create payment record
  let payment = await Payment.findOne({ where: { reference } });
  if (!payment) {
    payment = await Payment.create({
      reference,
      amount,
      status: 'success',
      email
    });
  } else {
    await payment.update({ status: 'success' });
  }

  // Create student if not exists
  let student = await Student.findOne({ where: { email } });
  if (!student) {
    student = await Student.create({
      name: firstName || 'Unknown',
      email,
      studentCode: generateStudentCode()
    });
  }

  // Email to student
  await sendEmail(
    student.email,
    'Welcome to My School',
    `<h1>Welcome ${student.name}</h1>
     <p>Your student code is: <strong>${student.studentCode}</strong></p>
     <p>We’re glad to have you onboard 🎉</p>`
  );

  // Email to admin
  await sendEmail(
    process.env.ADMIN_EMAIL,
    'New Student Registration',
    `<h2>New Student Registered</h2>
     <p><strong>Name:</strong> ${student.name}</p>
     <p><strong>Email:</strong> ${student.email}</p>
     <p><strong>Student Code:</strong> ${student.studentCode}</p>
     <p><strong>Amount Paid:</strong> ₦${amount}</p>`
  );
}

function generateStudentCode() {
  return 'STD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = { handleSuccessfulPayment };
