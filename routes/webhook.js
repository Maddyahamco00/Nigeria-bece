// routes/webhook.js
import express from 'express';
import crypto from 'crypto';
import { handleSuccessfulPayment } from '../services/paymentService.js';

const router = express.Router();

// Use raw body so HMAC matches exact payload
router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = req.body; // Buffer
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(payload.toString('utf8'));

    if (event.event === 'charge.success') {
      const data = event.data;
      const schoolId = data.metadata?.schoolId;
      await handleSuccessfulPayment({
        reference: data.reference,
        amount: data.amount / 100,
        email: data.customer?.email,
        firstName: data.customer?.first_name,
        schoolId,
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(500);
  }
});

export default router;
