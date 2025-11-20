// utils/sendEmail.js
import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
};

const templatesDir = path.join(process.cwd(), 'views', 'emails');

// Main email sending function
export default async function sendEmail(to, subject, html, options = {}) {
  // If no email configured, log to console
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log('📧 Email would be sent to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 HTML:', (html || '').substring(0, 200) + '...');
    return true;
  }

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.MAIL_FROM || `"Nigeria BECE Portal" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
      ...options
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
    return false;
  }
}

// Template-based email sending using EJS templates in views/emails
export const sendTemplateEmail = async (to, templateName, data = {}, opts = {}) => {
  try {
    const templatePath = path.join(templatesDir, `${templateName}.ejs`);
    // Render HTML from template
    const html = await ejs.renderFile(templatePath, data, { async: true });

    // Subject mapping (fallbacks)
    const subjects = {
      welcome: 'Welcome to Nigeria BECE Portal',
      paymentSuccess: 'Payment Successful - Nigeria BECE Portal',
      adminNotification: 'New Payment Received - Nigeria BECE Portal',
      profileUpdated: 'Your Profile Was Updated',
      passwordReset: 'Password Reset - Nigeria BECE Portal',
      passwordChanged: 'Password Changed - Nigeria BECE Portal',
      resultPublished: 'New Result Published - Nigeria BECE Portal'
    };

    const subject = opts.subject || subjects[templateName] || 'Nigeria BECE Notification';

    return await sendEmail(to, subject, html, opts.mailOptions || {});
  } catch (err) {
    console.error('Error rendering/sending template email:', err);
    return false;
  }
};