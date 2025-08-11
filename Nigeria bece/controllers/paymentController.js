// controllers/paymentController.js
const axios = require('axios');
const Payment = require('../models/Payment');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; // Store in .env

// Initialize payment
exports.initializePayment = async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount are required' });
    }

    // Prevent duplicate pending payments for the same email
    const existingPayment = await Payment.findOne({
      where: { email, status: 'pending' }
    });
    if (existingPayment) {
      return res.status(400).json({ error: 'A pending payment already exists for this email' });
    }

    // Call Paystack initialize endpoint
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      { email, amount: amount * 100 },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const { reference, authorization_url } = response.data.data;

    // Save payment in DB
    await Payment.create({
      email,
      amount,
      reference,
      status: 'pending'
    });

    return res.json({ authorization_url, reference });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: 'Payment initialization failed' });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }

    // Check Paystack verify endpoint
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const { status, customer, amount } = response.data.data;

    if (status === 'success') {
      await Payment.update(
        { status: 'success' },
        { where: { reference } }
      );
      return res.json({ message: 'Payment verified successfully', email: customer.email, amount: amount / 100 });
    } else {
      await Payment.update(
        { status: 'failed' },
        { where: { reference } }
      );
      return res.status(400).json({ message: 'Payment failed or incomplete' });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
};
