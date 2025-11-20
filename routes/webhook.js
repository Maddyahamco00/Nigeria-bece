// routes/webhook.js
import express from 'express';
import crypto from 'crypto';
import { handleSuccessfulPayment } from '../services/paymentService.js';

const router = express.Router();

// Use raw body so HMAC matches exact payload
router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = req.body; // Buffer
    const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_KEY) {
      console.error('Webhook: PAYSTACK secret key not configured');
      return res.status(500).send('PAYSTACK secret key not configured');
    }

    const hash = crypto
      .createHmac('sha512', PAYSTACK_KEY)
      .update(payload)
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(payload.toString('utf8'));

    if (event.event === 'charge.success') {
      const data = event.data;
      const schoolId = data.metadata?.schoolId;

      const autoCreate = data.metadata?.autoCreate === true || data.metadata?.autoCreate === 'true';
      if (autoCreate) {
        await handleSuccessfulPayment({
          reference: data.reference,
          amount: data.amount / 100,
          email: data.customer?.email,
          firstName: data.customer?.first_name,
          schoolId,
        });
      } else {
        // For payment-first flows where user completes registration later,
        // just record the payment (pre_reg_payments handled in callback) and do not auto-create student.
        console.log('Webhook received charge.success but autoCreate not set; skipping auto-create for', data.reference);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(500);
  }
});

export default router;
