const express = require('express');
const router = express.Router();
const states = require('../config/states');

// Home page
router.get('/', (req, res) => {
  res.render('public/home', {
    title: 'BECE Admin Portal',
    states,
  });
});

// Payment page
router.get('/payment', (req, res) => {
  res.render('public/payment', {
    title: 'Purchase BECE Code',
    states,
    errors: req.flash('error'),
    success: req.flash('success'),
  });
});

// Payment success page
router.get('/success', (req, res) => {
  res.render('public/success', {
    title: 'Payment Successful',
    reference: req.query.reference || '',
  });
});

module.exports = router;