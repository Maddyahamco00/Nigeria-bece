 // controllers/paymentController.js
import axios from 'axios';
import { Payment, Student, School } from '../models/index.js';
import { generateStudentCode } from '../utils/codeGenerator.js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const renderPaymentPage = (req, res) => {
  res.render('public/payment', {
    title: 'Purchase BECE Code',
    messages: req.flash()
  });
};

export const validatePayment = (req, res, next) => {
  const { email, amount } = req.body;
  if (!email || !amount) {
    req.flash('error', 'Email and amount are required');
    return res.redirect('/payment');
  }
  next();
};

export const initializePayment = async (req, res) => {
  try {
    const { email, amount, schoolId } = req.body;
    
    // For demo purposes - use local simulation if no Paystack keys
    if (!PAYSTACK_SECRET_KEY) {
      const reference = "LOCAL_REF_" + Date.now();
      const beceCode = "BECE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await Payment.create({
        email, 
        amount: parseFloat(amount),
        reference,
        status: 'success',
        code: beceCode,
        schoolId: schoolId || null
      });
      
      return res.json({
        authorization_url: `/payment/success?code=${beceCode}&reference=${reference}`,
        reference
      });
    }

    // Real Paystack integration
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100,
        callback_url: `${process.env.BASE_URL}/payment/success`,
        metadata: {
          schoolId: schoolId || null
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const { authorization_url, reference } = response.data.data;
    await Payment.create({
      email,
      amount: parseFloat(amount),
      reference,
      status: 'pending',
      schoolId: schoolId || null
    });
    
    res.json({ authorization_url, reference });
    
  } catch (error) {
    console.error("Payment Init Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!PAYSTACK_SECRET_KEY) {
      // Local simulation
      const payment = await Payment.findOne({ where: { reference } });
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      if (payment.status === 'success') {
        return res.json({
          status: 'success',
          message: 'Payment verified',
          code: payment.code
        });
      }
      
      // Mark as success for demo
      const beceCode = "BECE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      payment.status = 'success';
      payment.code = beceCode;
      await payment.save();
      
      return res.json({
        status: 'success',
        message: 'Payment verified locally',
        code: beceCode
      });
    }

    // Real Paystack verification
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      }
    );
    
    const { status, customer, amount, metadata } = response.data.data;
    const payment = await Payment.findOne({ where: { reference } });
    
    if (status === 'success' && payment) {
      payment.status = 'success';
      const beceCode = generateStudentCode();
      payment.code = beceCode;
      await payment.save();
      
      // Create student record if payment successful
      if (customer.email) {
        await Student.findOrCreate({
          where: { email: customer.email },
          defaults: {
            name: customer.first_name || 'Student',
            email: customer.email,
            paymentStatus: 'Paid',
            schoolId: metadata?.schoolId || null
          }
        });
      }
      
      return res.json({
        status: 'success',
        message: 'Payment verified',
        code: beceCode
      });
    }
    
    res.status(400).json({ error: 'Payment verification failed' });
    
  } catch (error) {
    console.error("Payment Verify Error:", error.response?.data || error.message);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

export const renderSuccessPage = async (req, res) => {
  const { code, reference } = req.query;
  let payment = null;
  
  if (reference) {
    payment = await Payment.findOne({ 
      where: { reference },
      include: [School]
    });
  }
  
  res.render('public/success', {
    title: 'Payment Successful',
    code: code || payment?.code,
    payment
  });
};