/* // controllers/paymentController.js
import axios from 'axios';
import sendEmail from '../utils/sendEmail.js';
import { Payment } from '../models/index.js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const paymentController = {
  // Render payment page
  renderPaymentPage: (req, res) => {
    res.render('payment');
  },

  // Validate payment input
  validatePayment: (req, res, next) => {
    const { email, amount } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount are required' });
    }
    next();
  },

  // Initialize payment
  initializePayment: async (req, res) => {
    try {
      const { email, amount } = req.body;

      // ===== REAL PAYSTACK (disabled for now) =====
      
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        { email, amount: amount * 100 }, // Paystack requires kobo
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const { authorization_url, reference } = response.data.data;
      await Payment.create({ email, amount, reference, status: 'pending' });
      return res.json({ authorization_url, reference });
    

      // ===== LOCAL SIMULATION =====
      const reference = "LOCAL_REF_" + Date.now();
      const beceCode = "BECE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const authorization_url = `/payment/success?code=${beceCode}`;

      // Save as immediately successful (since no Paystack)
      await Payment.create({ email, amount, reference, status: 'success', code: beceCode });

      // Respond like Paystack would
      return res.json({ authorization_url, reference });

    } catch (error) {
      console.error("Payment Init Error (local mode):", error.message);
      res.status(500).json({ error: "Payment initialization failed" });
    }
  },

  // Verify payment
  verifyPayment: async (req, res) => {
    try {
      const { reference } = req.body;

      // ===== REAL PAYSTACK VERIFY (disabled) =====
      
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      const { status, customer, amount } = response.data.data;
      

      // ===== LOCAL SIMULATION =====
      if (!reference) {
        return res.status(400).json({ error: 'Reference is required' });
      }

      const payment = await Payment.findOne({ where: { reference } });
      if (!payment) {
        return res.status(404).json({ error: 'Payment record not found' });
      }

      // If it’s already marked success, just return the code
      if (payment.status === 'success' && payment.code) {
        return res.json({
          status: 'success',
          message: 'Payment already verified',
          code: payment.code
        });
      }

      // Otherwise mark it success (shouldn’t really happen in local mode)
      const beceCode = "BECE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      payment.status = 'success';
      payment.code = beceCode;
      await payment.save();

      // Send emails
      if (payment.email) {
        await sendEmail(
          payment.email,
          'Payment Successful - Your BECE Code',
          `<h1>Payment Confirmed</h1>
           <p>Your BECE Code is: <strong>${beceCode}</strong></p>`
        );
      }

      if (ADMIN_EMAIL) {
        await sendEmail(
          ADMIN_EMAIL,
          'New Local BECE Code Purchase',
          `<h2>New Payment (LOCAL MODE)</h2>
           <p><strong>Email:</strong> ${payment.email}</p>
           <p><strong>Amount Paid:</strong> ₦${payment.amount}</p>
           <p><strong>Code:</strong> ${beceCode}</p>`
        );
      }

      return res.json({
        status: 'success',
        message: 'Payment verified locally',
        code: beceCode
      });
    } catch (error) {
      console.error("Payment Verify Error:", error.message);
      return res.status(500).json({ error: 'Payment verification failed' });
    }
  },

  // Render success page
  renderSuccessPage: (req, res) => {
    const code = req.query.code || null;
    res.render('public/success', { code });
  }
};

export default paymentController;
*/