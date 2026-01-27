// routes/public.js
import express from 'express';
import states from '../config/states.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('public/landing', {
    title: 'BECE Admin Portal',
    states,
  });
});

router.get('/payment', (req, res) => {
  res.render('public/payment', {
    title: 'Purchase BECE Code',
    states,
    errors: req.flash('error'),
    success: req.flash('success'),
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || ''
  });
});

router.get('/success', (req, res) => {
  res.render('public/success', {
    title: 'Payment Successful',
    reference: req.query.reference || '',
  });
});

export default router;
