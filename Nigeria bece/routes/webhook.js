// routes/webhook.js
const express = require('express');
const crypto = require('crypto');
const { handleSuccessfulPayment } = require('../services/paymentService');

const router = express.Router();

// routes/webhook.js
router.post('/paystack', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const data = event.data;

      // Example: you should attach schoolId when starting payment (metadata)
      const schoolId = data.metadata.schoolId; 

      await handleSuccessfulPayment({
        reference: data.reference,
        amount: data.amount / 100,
        email: data.customer.email,
        firstName: data.customer.first_name,
        schoolId
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(500);
  }
});


module.exports = router;
