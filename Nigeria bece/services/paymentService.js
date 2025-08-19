const sendEmail = require('../utils/sendEmail');
const { Payment, Student, School } = require('../models');
const { generateStudentCode } = require('../utils/codeGenerator');

async function handleSuccessfulPayment({ reference, amount, email, firstName, schoolId }) {
  // 1. Save Payment
  let payment = await Payment.findOne({ where: { reference } });
  if (!payment) {
    payment = await Payment.create({
      reference,
      amount,
      status: 'success',
      email,
      schoolId
    });
  } else {
    await payment.update({ status: 'success' });
  }

  // 2. Create Student if not exists
  let student = await Student.findOne({ where: { email } });

  if (!student) {
    // Get the school info
    const school = await School.findByPk(schoolId);
    if (!school) throw new Error('❌ School not found for this payment');

    // Generate serial numbers
    const stateCode = school.stateCode;     // e.g., "ABI"
    const year = new Date().getFullYear();
    const lgaSerial = school.lgaSerial;     // stored in school
    const schoolSerial = school.schoolSerial; 
    const studentSerial = await Student.count({ where: { schoolId } }) + 1;

    const code = generateStudentCode(stateCode, year, lgaSerial, schoolSerial, studentSerial);

    student = await Student.create({
      name: firstName || 'Unknown',
      email,
      studentCode: code,
      schoolId: school.id
    });
  }

  // 3. Send Emails
  await sendEmail(
    student.email,
    'Welcome to My School',
    `<h1>Welcome ${student.name}</h1>
     <p>Your student code is: <strong>${student.studentCode}</strong></p>
     <p>We’re glad to have you onboard 🎉</p>`
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

module.exports = { handleSuccessfulPayment };
