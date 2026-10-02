/**
 * SMS Provider Interface (TextBee Gateway, NOT-FR-03, Step 3.4.4)
 * Provider-agnostic SMS & 2FA dispatch interface using TextBee.
 */

class SmsProvider {
  constructor() {
    this.apiKey = process.env.TEXTBEE_API_KEY;
    this.deviceId = process.env.TEXTBEE_DEVICE_ID;
    this.isConfigured = Boolean(
      this.apiKey &&
      !this.apiKey.startsWith('mock_') &&
      !this.apiKey.includes('placeholder')
    );
  }

  /**
   * Send an SMS message to a phone number via TextBee API gateway.
   * In development or without credentials, logs to console in sandbox mode.
   *
   * @param {Object} options
   * @param {string} options.to - Recipient phone number (E.164 format, e.g. +1234567890)
   * @param {string} options.message - Text body
   * @returns {Promise<{ success: boolean, messageId: string, sandbox: boolean, provider: string }>}
   */
  async sendSms({ to, message }) {
    if (!to || !message) {
      throw new Error('Both "to" phone number and "message" body are required for SMS dispatch');
    }

    if (!this.isConfigured) {
      console.log(`[TEXTBEE SMS SANDBOX] To: ${to} | Body: "${message}"`);
      return {
        success: true,
        messageId: `mock-textbee-${Date.now()}`,
        sandbox: true,
        provider: 'textbee_sandbox'
      };
    }

    try {
      const payload = {
        recipients: [to],
        message
      };

      if (this.deviceId && this.deviceId !== 'default_device') {
        payload.deviceId = this.deviceId;
      }

      const response = await fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('[TEXTBEE ERROR] Failed to send SMS:', data);
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
          sandbox: false,
          provider: 'textbee'
        };
      }

      return {
        success: true,
        messageId: data.id || data.messageId || `textbee-${Date.now()}`,
        sandbox: false,
        provider: 'textbee'
      };
    } catch (error) {
      console.error('[TEXTBEE NETWORK ERROR] Failed to reach SMS gateway:', error.message);
      return {
        success: false,
        error: error.message,
        sandbox: false,
        provider: 'textbee'
      };
    }
  }

  /**
   * Helper to dispatch 2FA Security Code via TextBee SMS
   *
   * @param {string} to - Recipient phone number in E.164 format
   * @param {string} code - 6-digit one-time 2FA security code
   */
  async send2FACode(to, code) {
    const message = `ShopSphere Security: Your 2FA verification code is ${code}. It expires in 10 minutes. Do not share this code with anyone.`;
    return this.sendSms({ to, message });
  }

  /**
   * Helper to dispatch generic OTP via TextBee SMS
   */
  async sendOtp(to, otp) {
    const message = `ShopSphere: Your OTP is ${otp}. Valid for 10 minutes.`;
    return this.sendSms({ to, message });
  }
}

module.exports = new SmsProvider();
