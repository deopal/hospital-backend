/**
 * In-App Notification Channel
 *
 * Stores notifications in the database for in-app display.
 * This is the primary notification channel that saves to MongoDB.
 */

import { BaseChannel } from './base.channel.js';
import { notificationRepository } from '../../../repositories/index.js';

export class InAppChannel extends BaseChannel {
  constructor() {
    super('inapp');
  }

  /**
   * Send notification by storing it in the database
   *
   * @param {Object} notification - The notification data
   * @returns {Promise<Object>} The saved notification document
   */
  async send(notification) {
    try {
      const {
        recipientId,
        recipientType,
        senderId,
        senderType,
        appointmentId,
        type,
        title,
        message,
        metadata
      } = notification;

      const savedNotification = await notificationRepository.create({
        recipientId,
        recipientType,
        senderId,
        senderType,
        appointmentId,
        type,
        title,
        message,
        metadata: metadata || {}
      });

      return {
        success: true,
        channel: this.name,
        notificationId: savedNotification._id,
        notification: savedNotification
      };
    } catch (error) {
      console.error(`[${this.name}] Failed to send notification:`, error);
      return {
        success: false,
        channel: this.name,
        error: error.message
      };
    }
  }

  /**
   * Check if in-app notification should be sent
   * In-app notifications are always sent unless explicitly disabled
   *
   * @param {Object} notification - The notification to check
   * @returns {Promise<boolean>}
   */
  async canHandle(notification) {
    // In-app is the default channel, always enabled unless explicitly disabled
    if (!this.enabled) {
      return false;
    }

    // Could add user preference checks here in the future
    // e.g., check if user has disabled in-app notifications for this type

    return true;
  }
}

// Export singleton instance
export const inAppChannel = new InAppChannel();
export default inAppChannel;
