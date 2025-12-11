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
    try {
      const payload = {
        to: phone,
        from: this.sender,
        sms: message,
        type: 'plain',
        api_key: this.apiKey,
        channel: 'generic'
      };

      const response = await axios.post(this.baseUrl, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendRegistrationSMS(phone, studentCode) {
    const message = `Welcome to Nigeria BECE! Your registration code is: ${studentCode}. Complete your payment to finalize registration.`;
    return this.sendSMS(phone, message);
  }

  async sendPaymentConfirmationSMS(phone, amount, reference) {
    const message = `Payment confirmed! Amount: ₦${amount}. Reference: ${reference}. Your BECE registration is complete.`;
    return this.sendSMS(phone, message);
  }

  async sendResultNotificationSMS(phone, studentName) {
    const message = `Hello ${studentName}, your BECE results are now available. Login to view your results.`;
    return this.sendSMS(phone, message);
  }
}

export default new SMSService();