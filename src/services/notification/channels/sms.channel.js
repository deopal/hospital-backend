/**
 * SMS Notification Channel
 *
 * Sends notifications via SMS.
 * Currently a placeholder - implement with your preferred SMS service:
 * - Twilio
 * - AWS SNS
 * - Nexmo/Vonage
 * - MSG91
 * - etc.
 */

import { BaseChannel } from './base.channel.js';

export class SMSChannel extends BaseChannel {
  constructor(config = {}) {
    super('sms');

    // SMS service configuration
    this.config = {
      ...config
    };

    // Disabled by default until configured
    this.enabled = false;
  }

  /**
   * Send notification via SMS
   *
   * @param {Object} notification - The notification data
   * @returns {Promise<Object>} Result of SMS send operation
   */
  async send(notification) {
    try {
      const { recipientId, recipientType, title, message } = notification;

      // Get recipient phone number
      const phoneNumber = await this.getRecipientPhone(recipientId, recipientType);

      if (!phoneNumber) {
        return {
          success: false,
          channel: this.name,
          error: 'Recipient phone number not found'
        };
      }

      // TODO: Implement actual SMS sending
      // Example with Twilio:
      //
      // const client = require('twilio')(accountSid, authToken);
      // await client.messages.create({
      //   body: `${title}: ${message}`,
      //   from: this.config.fromNumber,
      //   to: phoneNumber
      // });

      console.log(`[${this.name}] SMS would be sent to: ${phoneNumber}`);
      console.log(`[${this.name}] Message: ${title} - ${message}`);

      return {
        success: true,
        channel: this.name,
        recipient: phoneNumber,
        message: 'SMS notification logged (not actually sent - implement SMS service)'
      };
    } catch (error) {
      console.error(`[${this.name}] Failed to send SMS:`, error);
      return {
        success: false,
        channel: this.name,
        error: error.message
      };
    }
  }

  /**
   * Get recipient's phone number
   *
   * @param {string} recipientId - The recipient's ID
   * @param {string} recipientType - The recipient type (Doctors/Patients)
   * @returns {Promise<string|null>} The phone number or null
   */
  async getRecipientPhone(recipientId, recipientType) {
    // TODO: Implement phone lookup from database
    return null;
  }

  /**
   * Check if SMS should be sent for this notification
   *
   * @param {Object} notification - The notification to check
   * @returns {Promise<boolean>}
   */
  async canHandle(notification) {
    if (!this.enabled) {
      return false;
    }

    // Only send SMS for critical notifications
    const smsEnabledTypes = [
      'appointment_approved',
      'appointment_cancelled',
      'reminder'
    ];

    return smsEnabledTypes.includes(notification.type);
  }
}

// Export singleton instance (disabled by default)
export const smsChannel = new SMSChannel();
export default smsChannel;
