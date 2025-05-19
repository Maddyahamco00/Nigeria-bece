const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/Payment');
const { generateCode } = require('../utils/codeGenerator');
const { check, validationResult } = require('express-validator');
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

// Initialize payment
router.post(
  '/initialize',
  [
    check('email').isEmail().withMessage('Please enter a valid email'),
    check('amount').isNumeric().withMessage('Amount is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg));
      return res.redirect('/payment');
    }

    try {
      const { email, amount } = req.body;

      // Initialize payment with Paystack
      const response = await axios.post(
        `${PAYSTACK_API_URL}/transaction/initialize`,
        {
          email,
          amount: amount * 100, // Convert to kobo
          callback_url: `${req.protocol}://${req.get('host')}/payment/verify`,
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { authorization_url, reference } = response.data.data;

      // Save payment details to database
      await Payment.create({
        email,
        amount,
        reference,
        status: 'pending',
      });

      // Redirect to Paystack payment page
      res.redirect(authorization_url);
    } catch (err) {
      req.flash('error', 'Error initializing payment');
      res.redirect('/payment');
    }
  }
);

// Verify payment
router.get('/verify', async (req, res) => {
  const { reference } = req.query;

  try {
    // Verify payment with Paystack
    const response = await axios.get(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { status, amount, customer } = response.data.data;

    if (status === 'success') {
      // Generate unique code
      const code = await generateCode();

      // Update payment record
      await Payment.update(reference, {
        status: 'success',
        code,
      });

      req.flash('success', `Payment successful! Your code is ${code}`);
      res.redirect(`/success?reference=${reference}`);
    } else {
      await Payment.update(reference, { status: 'failed' });
      req.flash('error', 'Payment failed. Please try again.');
      res.redirect('/payment');
    }
  } catch (err) {
    req.flash('error', 'Error verifying payment');
    res.redirect('/payment');
  }
});

module.exports = router;