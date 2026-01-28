/**
 * SSE Notification Channel
 *
 * Sends real-time notifications via Server-Sent Events.
 * This channel pushes notifications instantly to connected clients.
 */

import { BaseChannel } from './base.channel.js';
import { sendToUser } from '../../sse/sse.service.js';

export class SSEChannel extends BaseChannel {
  constructor() {
    super('sse');
  }

  /**
   * Send notification via SSE
   *
   * @param {Object} notification - The notification data
   * @returns {Promise<Object>}
   */
  async send(notification) {
    try {
      const { recipientId, recipientType, title, message, type, data, metadata, _id, createdAt } = notification;

      // Convert recipientType to lowercase for SSE client lookup
      // (stored as 'Patients'/'Doctors' but SSE uses 'patient'/'doctor')
      const userType = recipientType.toLowerCase().replace(/s$/, '');

      const sent = sendToUser(recipientId.toString(), 'notification', {
        _id: _id || notification.notificationId,
        title,
        message,
        type,
        data: data || metadata || {},
        isRead: false,
        createdAt: createdAt || new Date().toISOString()
      });

      if (sent) {
        console.log(`[SSE Channel] Notification sent to ${userType} ${recipientId}`);
        return {
          success: true,
          channel: this.name
        };
      } else {
        // User not connected - this is not an error, just means they're offline
        return {
          success: true,
          channel: this.name,
          skipped: true,
          reason: 'User not connected to SSE'
        };
      }
    } catch (error) {
      console.error('[SSE Channel] Error sending notification:', error);
      return {
        success: false,
        channel: this.name,
        error: error.message
      };
    }
  }

  /**
   * SSE channel can always handle notifications
   * (if user is offline, we just skip gracefully)
   */
  async canHandle(notification) {
    return this.enabled;
  }
}

// Export singleton instance
export const sseChannel = new SSEChannel();
export default sseChannel;
