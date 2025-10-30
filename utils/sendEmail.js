// utils/sendEmail.js
import nodemailer from 'nodemailer';

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

// Email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to Nigeria BECE Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2563eb;">Welcome to Nigeria BECE Portal!</h2>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your account has been successfully created on the Nigeria BECE Portal.</p>
          <p>You can now login and access all features of the portal.</p>
          <div style="margin: 25px 0;">
            <a href="${process.env.BASE_URL}/auth/login" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
        </div>
        <div style="margin-top: 20px; padding: 15px; background-color: #f1f5f9; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `
  }),

  paymentSuccess: (payment, student) => ({
    subject: 'Payment Successful - Nigeria BECE Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #16a34a;">Payment Successful! 🎉</h2>
        </div>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a;">
          <p>Hello <strong>${student?.name || 'Student'}</strong>,</p>
          <p>Your payment has been processed successfully. Here are your payment details:</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>Amount:</strong> ₦${payment.amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${payment.reference}</p>
            <p><strong>BECE Code:</strong> <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${payment.code}</code></p>
            <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>
          </div>
          
          <p>Keep your BECE code safe as you'll need it to check your results.</p>
        </div>
      </div>
    `
  }),

  adminNotification: (payment, student) => ({
    subject: 'New Payment Received - Nigeria BECE Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h3 style="color: #2563eb;">New Payment Notification</h3>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
          <p>A new payment has been received:</p>
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>Student:</strong> ${student?.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${payment.email}</p>
            <p><strong>Amount:</strong> ₦${payment.amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${payment.reference}</p>
            <p><strong>BECE Code:</strong> ${payment.code}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    `
  })
};

// Main email sending function
export default async function sendEmail(to, subject, html, options = {}) {
  // If no email configured, log to console
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log('📧 Email would be sent to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 HTML:', html.substring(0, 200) + '...');
    return true;
  }

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Nigeria BECE Portal" <${process.env.MAIL_USER}>`,
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

// Template-based email sending
export const sendTemplateEmail = async (to, templateName, data) => {
  const template = emailTemplates[templateName];
  if (!template) {
    console.error(`Template ${templateName} not found`);
    return false;
  }

  const emailContent = template(data);
  return await sendEmail(to, emailContent.subject, emailContent.html);
};