import express from 'express';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

router.get('/', paymentController.renderPaymentPage);

// Initialize
router.post(
  '/initialize',
  paymentController.validatePayment,
  paymentController.initializePayment
);

// ✅ Change to POST (frontend sends POST body)
router.post('/verify', paymentController.verifyPayment);

router.get('/success', paymentController.renderSuccessPage);

export default router;
