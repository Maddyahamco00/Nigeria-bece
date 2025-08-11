//Handles payment processing with Paystack and code generation.
// controllers/paymentController.js

const axios = require('axios');
const pool = require('../config/database');
const { generateCode } = require('../utils/codeGenerator');
require('dotenv').config();

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

exports.getPaymentPage = (req, res) => {
  res.render('public/payment', { title: 'Purchase Code', user: req.user || null, paystackKey: process.env.PAYSTACK_PUBLIC_KEY });
};

exports.initiatePayment = async (req, res) => {
  const { email, amount } = req.body;
  try {
    const response = await paystack.post('/transaction/initialize', {
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      callback_url: `${process.env.APP_URL}/payment/verify`
    });
    res.json({ authorization_url: response.data.data.authorization_url });
  } catch (err) {
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

exports.verifyPayment = async (req, res) => {
  const { reference } = req.query;
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    const paymentData = response.data.data;
    if (paymentData.status === 'success') {
      const code = generateCode();
      await pool.query('INSERT INTO payments (reference, email, amount, code, status) VALUES (?, ?, ?, ?, ?)', [
        paymentData.reference,
        paymentData.customer.email,
        paymentData.amount / 100,
        code,
        'success'
      ]);
      res.render('public/success', { title: 'Payment Successful', code, user: req.user || null });
    } else {
      res.status(400).send('Payment verification failed');
    }
  } catch (err) {
    res.status(500).send('Server error');
  }
};