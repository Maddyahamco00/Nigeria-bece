// services/smsService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class SMSService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.sender = process.env.SMS_SENDER || 'BECE-NG';
    this.baseUrl = process.env.SMS_BASE_URL || 'https://api.ng.termii.com/api/sms/send';
  }

  async sendSMS(phone, message) {
    // If no SMS API key configured, log to console
    if (!this.apiKey || this.apiKey === 'TL123456789') {
      console.log('📱 SMS would be sent to:', phone);
      console.log('📱 Message:', message);
      return { success: true, simulated: true };
    }

    try {
      // Format phone number (remove +234 and add 234)
      let formattedPhone = phone.replace(/^\+?234/, '234');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '234' + formattedPhone.substring(1);
      }

      const payload = {
        to: formattedPhone,
        from: this.sender,
        sms: message,
        type: 'plain',
        api_key: this.apiKey,
        channel: 'generic'
      };

      const response = await axios.post(this.baseUrl, payload);
      console.log('✅ SMS sent to:', formattedPhone);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Error:', error.message);
      console.log('📱 SMS fallback - would send to:', phone, 'Message:', message);
      return { success: true, simulated: true }; // Don't fail the process
    }
  }

  async sendRegistrationSMS(phone, studentCode) {
    const message = `Welcome to Nigeria BECE! Your student code is: ${studentCode}. Complete your payment to finalize registration. Portal: bece.gov.ng`;
    return this.sendSMS(phone, message);
  }

  async sendPaymentConfirmationSMS(phone, amount, reference) {
    const message = `Payment confirmed! Amount: ₦${amount}. Ref: ${reference}. Your BECE registration is complete. Login at bece.gov.ng`;
    return this.sendSMS(phone, message);
  }

  async sendResultNotificationSMS(phone, studentName) {
    const message = `Hello ${studentName}, your BECE results are now available. Login at bece.gov.ng to view your results.`;
    return this.sendSMS(phone, message);
  }
}

export default new SMSService();