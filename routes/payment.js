// routes/payment.js
import express from 'express';
const router = express.Router();
import db from '../config/database.js'; // your MySQL connection
import nodemailer from 'nodemailer';
import { Payment } from '../models/index.js';
import { sendTemplateEmail, default as sendEmail } from '../utils/sendEmail.js';
import { handleSuccessfulPayment } from '../services/paymentService.js';

// Demo Payment Page
router.get('/pay', (req, res) => {
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
    res.render('pay', { error: null, publicKey });
});

// Handle Payment Submission
router.post('/pay', async (req, res) => {
    const { name, email, guardian_number } = req.body;

    if(!name || !email || !guardian_number){
        return res.render('pay', { error: "All fields are required!" });
    }

    const payment_ref = 'PAY' + Date.now(); // demo reference

    try {
        // Save pre-registration payment
        await db.query(
            `INSERT INTO pre_reg_payments (name, email, guardian_number, amount, payment_reference, payment_status, created_at)
             VALUES (?, ?, ?, ?, ?, 'Paid', NOW())`,
            [name, email, guardian_number, 1000, payment_ref]
        );

        // Demo Email using your existing setup
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: "your_ethereal_user",
                pass: "your_ethereal_pass"
            }
        });

        await transporter.sendMail({
            from: '"BECE System" <no-reply@bece.com>',
            to: email,
            subject: "Payment Successful",
            text: `Hello ${name},\n\nPayment successful! Ref: ${payment_ref}\nProceed to registration: http://localhost:3000/register?payment_ref=${payment_ref}`
        });

        res.redirect(`/register?payment_ref=${payment_ref}`);

    } catch(err) {
        console.log(err);
        res.render('pay', { error: "Payment failed. Try again." });
    }
});

// ------------------------------
// Paystack Test Integration
// ------------------------------

// Initialize a Paystack transaction
router.post('/init', async (req, res) => {
    try {
        const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SECRET_KEY;
        if (!PAYSTACK_KEY) {
            return res.status(500).json({ error: 'PAYSTACK secret key not configured. Set PAYSTACK_SECRET_KEY or PAYSTACK_SECRET in your environment.' });
        }

        const { email, amount, metadata, name, guardian } = req.body;
        if (!email || !amount) return res.status(400).json({ error: 'email and amount are required' });

        const baseUrl = process.env.BASE_URL || `http://localhost:3000`;
        const body = {
            email,
            amount: Math.round(Number(amount) * 100), // convert Naira to kobo
            callback_url: `${baseUrl}/payment/callback`,
            metadata: Object.assign({}, metadata || {}, { name: name || '', guardian: guardian || '', autoCreate: false })
        };

        const resp = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await resp.json();
        if (!resp.ok || !data.status) {
            console.error('Paystack initialize failed', data);
            return res.status(500).json({ error: 'Failed to initialize payment' });
        }

        // Create a pending Payment record
        await Payment.create({
            email,
            amount: Number(amount),
            reference: data.data.reference,
            transactionReference: data.data.reference,
            status: 'pending'
        });

        res.json({ authorization_url: data.data.authorization_url, reference: data.data.reference, publicKey: process.env.PAYSTACK_PUBLIC_KEY || '' });
    } catch (err) {
        console.error('Init payment error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Paystack callback (redirect after card entry)
router.get('/callback', async (req, res) => {
    try {
        const { reference } = req.query;
        if (!reference) return res.status(400).send('Missing reference');

        const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SECRET_KEY;
        if (!PAYSTACK_KEY) {
            return res.status(500).send('PAYSTACK secret key not configured. Set PAYSTACK_SECRET_KEY or PAYSTACK_SECRET in your environment.');
        }

        console.log('Paystack callback received for reference:', reference);
        const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_KEY}` }
        });
        const data = await resp.json();
        if (!resp.ok || !data.status) {
            console.error('Paystack verify failed', data);
            return res.status(400).render('public/success', { reference, amount: 0, email: null, message: 'Verification failed' });
        }

        const tx = data.data;

        // Update Payment record (include transactionReference)
        await Payment.update({ status: 'success', transactionReference: tx.reference }, { where: { reference: tx.reference } });

        // Persist pre-registration record so user can complete registration
        try {
            const payerName = tx.metadata?.name || '';
            const guardianNumber = tx.metadata?.guardian || '';
            const amountNaira = tx.amount / 100;

            // Insert or update pre_reg_payments table
                await db.query(
                    `INSERT INTO pre_reg_payments (name, email, guardian_number, amount, payment_reference, payment_status, created_at)
                     VALUES (?, ?, ?, ?, ?, 'Paid', NOW())
                     ON DUPLICATE KEY UPDATE payment_status='Paid', amount = VALUES(amount), name=VALUES(name), guardian_number=VALUES(guardian_number)`,
                    { replacements: [payerName, tx.customer?.email || '', guardianNumber, amountNaira, tx.reference] }
                );
        } catch (err) {
            console.error('Error saving pre_reg_payments', err);
        }

        // If metadata indicated autoCreate, call business logic; otherwise redirect to registration with reference
        const autoCreate = tx.metadata?.autoCreate === true || tx.metadata?.autoCreate === 'true';
        if (autoCreate) {
            try {
                await handleSuccessfulPayment({
                    reference: tx.reference,
                    amount: tx.amount / 100,
                    email: tx.customer?.email,
                    firstName: tx.customer?.first_name,
                    schoolId: tx.metadata?.schoolId
                });
                // Redirect user to a friendly completion page
                return res.redirect(`/payment/complete?reference=${encodeURIComponent(tx.reference)}&amount=${tx.amount}&email=${encodeURIComponent(tx.customer?.email || '')}`);
            } catch (err) {
                console.error('handleSuccessfulPayment error', err);
                return res.status(500).send('Server error');
            }
        }

        // Redirect to registration page and include payment_ref so the form can auto-fill
        // Use a short intermediate complete page to avoid weird Paystack redirect behavior
        return res.redirect(`/payment/complete?reference=${encodeURIComponent(tx.reference)}&amount=${tx.amount}&email=${encodeURIComponent(tx.customer?.email || '')}&redirect=/students/register?payment_ref=${encodeURIComponent(tx.reference)}`);
    } catch (err) {
        console.error('Callback error', err);
        res.status(500).send('Server error');
    }
});

// Friendly completion page after payment verification
router.get('/complete', (req, res) => {
    const { reference, amount, email, redirect } = req.query;
    // If a redirect param is provided, include it as `continueUrl` for a CTA button
    const continueUrl = redirect || `/students/register?payment_ref=${encodeURIComponent(reference || '')}`;
    res.render('public/success', { reference, amount, email, continueUrl });
});

// Client-side verification endpoint for inline Paystack callback
router.post('/verify', async (req, res) => {
    try {
        const { reference } = req.body;
        if (!reference) return res.status(400).json({ error: 'Missing reference' });

        const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SECRET_KEY;
        if (!PAYSTACK_KEY) {
            return res.status(500).json({ error: 'PAYSTACK secret key not configured. Set PAYSTACK_SECRET_KEY or PAYSTACK_SECRET in your environment.' });
        }

        const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_KEY}` }
        });
        const data = await resp.json();
        if (!resp.ok || !data.status) {
            console.error('Paystack verify failed', data);
            return res.status(400).json({ error: 'Verification failed' });
        }

        const tx = data.data;

        // Update Payment record
        await Payment.update({ status: 'success', transactionReference: tx.reference }, { where: { reference: tx.reference } });

        // Try to notify payer by email
        try {
            const payerEmail = tx.customer?.email || tx.metadata?.email || null;
            if (payerEmail) {
                // Build a minimal payment object for template
                const paymentObj = {
                    amount: (tx.amount / 100),
                    reference: tx.reference,
                    code: tx.metadata?.beceCode || '' ,
                    createdAt: new Date()
                };
                await sendTemplateEmail(payerEmail, 'paymentSuccess', { payment: paymentObj, student: { name: tx.customer?.first_name || '' } });
            }

            // Notify admin if configured
            if (process.env.ADMIN_EMAIL) {
                await sendTemplateEmail(process.env.ADMIN_EMAIL, 'adminNotification', { payment: { amount: (tx.amount/100), reference: tx.reference, code: '' }, student: { name: tx.customer?.first_name || '' } });
            }
        } catch (err) {
            console.error('Error sending payment emails:', err);
        }

        // Persist pre-registration record so user can complete registration
        try {
            const payerName = tx.metadata?.name || '';
            const guardianNumber = tx.metadata?.guardian || '';
            const amountNaira = tx.amount / 100;

            await db.query(
                `INSERT INTO pre_reg_payments (name, email, guardian_number, amount, payment_reference, payment_status, created_at)
                     VALUES (?, ?, ?, ?, ?, 'Paid', NOW())
                     ON DUPLICATE KEY UPDATE payment_status='Paid', amount = VALUES(amount), name=VALUES(name), guardian_number=VALUES(guardian_number)`,
                { replacements: [payerName, tx.customer?.email || '', guardianNumber, amountNaira, tx.reference] }
            );
        } catch (err) {
            console.error('Error saving pre_reg_payments', err);
        }

        const redirect = `/students/register?payment_ref=${encodeURIComponent(tx.reference)}`;
        return res.json({ ok: true, redirectUrl: redirect });
    } catch (err) {
        console.error('Verify error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
