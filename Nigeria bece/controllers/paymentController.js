const axios = require('axios');
const sendEmail = require('../utils/sendEmail');
const { Payment, Student } = require('../models'); // Adjust if needed
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Render payment page
exports.renderPaymentPage = (req, res) => {
  res.render('payment'); // Make sure you have views/payment.ejs
};

// Validate payment input
exports.validatePayment = (req, res, next) => {
  const { email, amount } = req.body;
  if (!email || !amount) {
    return res.status(400).json({ error: 'Email and amount are required' });
  }
  next();
};

// Initialize payment
exports.initializePayment = async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100 // Convert to kobo
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { authorization_url, reference } = response.data.data;

    // Save payment reference
    await Payment.create({ email, amount, reference, status: 'pending' });

    res.json({ authorization_url });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const { status, customer, amount } = response.data.data;

    if (status === 'success') {
      await Payment.update({ status: 'success' }, { where: { reference } });

      let student = await Student.findOne({ where: { email: customer.email } });
      if (!student) {
        student = await Student.create({
          name: customer.first_name || 'Unknown',
          email: customer.email,
          studentCode: generateStudentCode()
        });
      }

      await sendEmail(
        student.email,
        'Welcome to My School',
        `<h1>Welcome ${student.name}</h1>
        <p>Your student code is: <strong>${student.studentCode}</strong></p>`
      );

      await sendEmail(
        ADMIN_EMAIL,
        'New Student Registration',
        `<h2>New Student Registered</h2>
        <p><strong>Name:</strong> ${student.name}</p>
        <p><strong>Email:</strong> ${student.email}</p>
        <p><strong>Amount Paid:</strong> ₦${amount / 100}</p>`
      );

      return res.json({
        message: 'Payment verified, student registered, and emails sent',
        student
      });
    } else {
      await Payment.update({ status: 'failed' }, { where: { reference } });
      return res.status(400).json({ message: 'Payment failed or incomplete' });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
};

// Render success page
exports.renderSuccessPage = (req, res) => {
  res.render('success'); // Make sure you have views/success.ejs
};

// Utility to generate student code
function generateStudentCode() {
  return 'STU-' + Math.floor(Math.random() * 1000000);
}
