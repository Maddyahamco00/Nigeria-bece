// routes/payment.js
import express from 'express';
const router = express.Router();

// Example: Payment dashboard (placeholder)
router.get('/', (req, res) => {
  res.render('payments/dashboard', { title: 'Payment Dashboard' });
});

export default router;
