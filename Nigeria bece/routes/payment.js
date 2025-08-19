//routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Render payment page
router.get('/', paymentController.renderPaymentPage);

// Initialize payment
router.post('/initialize', 
  paymentController.validatePayment, 
  async (req, res, next) => {
    try {
      await paymentController.initializePayment(req, res, next);

      // ✅ after successful initialization, redirect to success page
      res.redirect('/payment/success');
    } catch (error) {
      console.error('Payment error:', error);
      res.status(500).render('payment/error', { error: 'Payment failed, please try again' });
    }
  }
);

// Verify payment using route param
router.get('/verify/:reference', paymentController.verifyPayment);

// Success page
router.get('/success', paymentController.renderSuccessPage);

module.exports = router;
