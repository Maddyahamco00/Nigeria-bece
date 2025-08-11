const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Render payment page
router.get('/', paymentController.renderPaymentPage);

// Initialize payment
router.post('/initialize', paymentController.validatePayment, paymentController.initializePayment);

// Verify payment using route param
router.get('/verify/:reference', paymentController.verifyPayment);

// Success page
router.get('/success', paymentController.renderSuccessPage);

module.exports = router;
