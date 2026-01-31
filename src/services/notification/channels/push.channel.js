/**
 * Push Notification Channel
 *
 * Sends Web Push notifications to browsers using the Web Push API.
 * Uses the web-push library with VAPID authentication.
 */

import webpush from 'web-push';
import { BaseChannel } from './base.channel.js';

// Lazy load models to avoid circular dependency issues at startup
let Patient = null;
let Doctor = null;

const loadModels = async () => {
  if (!Patient || !Doctor) {
    const patientModule = await import('../../../models/user/patient.model.js');
    const doctorModule = await import('../../../models/user/doctor.model.js');
    Patient = patientModule.default;
    Doctor = doctorModule.default;
  }
  return { Patient, Doctor };
};

export class PushChannel extends BaseChannel {
  constructor(config = {}) {
    super('push');

    // Push service configuration
    this.config = {
      ...config
    };

    // Initialize web-push with VAPID keys
    this.initializeWebPush();

    // Enabled if VAPID keys are configured
    this.enabled = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  }

  /**
   * Initialize web-push with VAPID details
   */
  initializeWebPush() {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@hospital.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      console.log('[Push Channel] Web Push initialized with VAPID keys');
    } else {
      console.warn('[Push Channel] VAPID keys not configured - push notifications disabled');
    }
  }

  /**
   * Send push notification
   *
   * @param {Object} notification - The notification data
   * @returns {Promise<Object>} Result of push send operation
   */
  async send(notification) {
    try {
      const { recipientId, recipientType, title, message, type, data } = notification;

      // Get recipient's push subscription from database
      const subscription = await this.getPushSubscription(recipientId, recipientType);

      if (!subscription || !subscription.endpoint) {
        return {
          success: false,
          channel: this.name,
          error: 'No push subscription found for recipient'
        };
      }

      // Prepare the push payload
      const payload = JSON.stringify({
        title: title || 'HealOrbit Notification',
        body: message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        type: type,
        data: data || {},
        timestamp: Date.now()
      });

      // Send the push notification
      await webpush.sendNotification(subscription, payload);

      console.log(`[${this.name}] Push notification sent successfully to ${recipientType}`);

      return {
        success: true,
        channel: this.name,
        message: 'Push notification sent successfully'
      };
    } catch (error) {
      console.error(`[${this.name}] Failed to send push notification:`, error);

      // Handle expired subscriptions (user unsubscribed)
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Remove invalid subscription from database
        await this.removeInvalidSubscription(
          notification.recipientId,
          notification.recipientType
        );
        return {
          success: false,
          channel: this.name,
          error: 'Subscription expired or invalid - removed from database'
        };
      }

      return {
        success: false,
        channel: this.name,
        error: error.message
      };
    }
  }

  /**
   * Get recipient's push subscription from database
   *
   * @param {string} recipientId - The recipient's ID
   * @param {string} recipientType - The recipient type (Doctors/Patients)
   * @returns {Promise<Object|null>} Push subscription object
   */
  async getPushSubscription(recipientId, recipientType) {
    try {
      const { Patient, Doctor } = await loadModels();
      let user;

      if (recipientType === 'Patients' || recipientType === 'patient') {
        user = await Patient.findById(recipientId).select('pushSubscription');
      } else if (recipientType === 'Doctors' || recipientType === 'doctor') {
        user = await Doctor.findById(recipientId).select('pushSubscription');
      }

      if (user && user.pushSubscription && user.pushSubscription.endpoint) {
        return {
          endpoint: user.pushSubscription.endpoint,
          keys: {
            p256dh: user.pushSubscription.keys.p256dh,
            auth: user.pushSubscription.keys.auth
          }
        };
      }

      return null;
    } catch (error) {
      console.error(`[${this.name}] Error fetching push subscription:`, error);
      return null;
    }
  }

  /**
   * Remove invalid subscription from database
   *
   * @param {string} recipientId - The recipient's ID
   * @param {string} recipientType - The recipient type
   */
  async removeInvalidSubscription(recipientId, recipientType) {
    try {
      const { Patient, Doctor } = await loadModels();
      if (recipientType === 'Patients' || recipientType === 'patient') {
        await Patient.findByIdAndUpdate(recipientId, {
          $unset: { pushSubscription: 1 }
        });
      } else if (recipientType === 'Doctors' || recipientType === 'doctor') {
        await Doctor.findByIdAndUpdate(recipientId, {
          $unset: { pushSubscription: 1 }
        });
      }
      console.log(`[${this.name}] Removed invalid subscription for ${recipientType} ${recipientId}`);
    } catch (error) {
      console.error(`[${this.name}] Error removing invalid subscription:`, error);
    }
  }

  /**
   * Check if push notification should be sent
   *
   * @param {Object} notification - The notification to check
   * @returns {Promise<boolean>}
   */
  async canHandle(notification) {
    if (!this.enabled) {
      return false;
    }

    // Push notifications for important notification types
    const pushEnabledTypes = [
      'appointment_request',
      'appointment_approved',
      'appointment_completed',
      'appointment_cancelled',
      'video_call_started',
      'reminder',
      'new_message'
    ];

    return pushEnabledTypes.includes(notification.type);
  }
}

// Export singleton instance
export const pushChannel = new PushChannel();
export default pushChannel;
