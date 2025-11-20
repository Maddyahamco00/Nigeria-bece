# Testing Paystack & Webhooks Locally (ngrok)

Follow these steps to test the full payment → registration flow (including webhooks) on your local machine.

1. Start the app locally:

```powershell
$env:PAYSTACK_PUBLIC_KEY = 'pk_test_xxx'
$env:PAYSTACK_SECRET_KEY = 'sk_test_xxx'
npm run dev
```

2. Install and run ngrok (if not installed, download from https://ngrok.com):

```powershell
# expose local port 3000
ngrok http 3000
```

3. Note the HTTPS forwarding URL from ngrok (e.g. `https://abcd1234.ngrok.io`).

4. In your Paystack Dashboard (Test mode): set the **Webhook URL** to: `https://<your-ngrok-id>.ngrok.io/webhook/paystack`

5. Use the app payment page at `https://<your-ngrok-id>.ngrok.io/payment/pay` to run a test payment — the inline modal will open if `PAYSTACK_PUBLIC_KEY` is set.

6. After completing the card flow, Paystack will call your webhook and your server will verify the transaction and persist `pre_reg_payments`. The registration page will then be accessible with `?payment_ref=<reference>` and prefilled fields.

## Paystack Test Card (common)

- Card: `5060 0000 0000 0008`  Exp: any future date  CVV: any 3 digits

## Troubleshooting

- If the inline modal doesn't open, check `window.PAYSTACK_PUBLIC_KEY` in the browser console.
- If you see the hosted checkout URL and get stuck, open the console to see the init response; the app will show a safe link instead of forcing navigation.
- If webhooks don't arrive, confirm the ngrok URL is the same one set in Paystack and your local server is reachable.
