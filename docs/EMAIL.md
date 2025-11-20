# SMTP / Email Configuration

To enable real emails (nodemailer) set these environment variables in your `.env` or hosting provider settings:

```plaintext
MAIL_HOST=smtp.yourprovider.com
MAIL_PORT=587
MAIL_USER=your_smtp_user
MAIL_PASS=your_smtp_password
MAIL_FROM="BECE Portal" <no-reply@yourdomain.com>
```

Suggested integration points in the app:

- Payment confirmation: call `sendEmail` when a payment is verified (server-side)
- Profile changes: notify user when profile updated
- Password changes & resets: send reset link and confirmation
- Result publication: optionally email students when new results are published

If you want, I can:

- Wire `utils/sendEmail.js` to use these env vars and fallback to Ethereal in dev
- Add calls to the payment flow (on verification) and profile update handlers
- Add templates for transactional emails (EJS/plain-text)