/**
 * Email Notification Channel
 *
 * Sends notifications via email using Nodemailer.
 * Integrates with the notification dispatcher system.
 */

import { BaseChannel } from './base.channel.js';
import { sendEmail, isEmailConfigured } from '../../email/email.service.js';
import {
  appointmentRequestTemplate,
  appointmentApprovedTemplate,
  appointmentCompletedTemplate,
  appointmentCancelledTemplate,
} from '../../email/email.templates.js';
import { doctorRepository, patientRepository } from '../../../repositories/index.js';
import { NotificationType } from '../../../config/constants.js';

export class EmailChannel extends BaseChannel {
  constructor(config = {}) {
    super('email');

    // Email service configuration
    this.config = {
      from: config.from || process.env.EMAIL_FROM || 'HealOrbit <noreply@healorbit.com>',
      ...config
    };

    // Enable if email is configured
    this.enabled = isEmailConfigured();

    if (this.enabled) {
      console.log('[Email Channel] Email notifications enabled');
    } else {
      console.log('[Email Channel] Email notifications disabled - credentials not configured');
    }
  }

  /**
   * Send notification via email
   *
   * @param {Object} notification - The notification data
   * @returns {Promise<Object>} Result of email send operation
   */
  async send(notification) {
    try {
      const { recipientId, recipientType } = notification;

      // Get recipient details including email
      const recipient = await this.getRecipient(recipientId, recipientType);

      if (!recipient || !recipient.email) {
        return {
          success: false,
          channel: this.name,
          error: 'Recipient email not found'
        };
      }

      // Build email content based on notification type
      const emailContent = await this.buildEmailContent(notification, recipient);

      if (!emailContent) {
        return {
          success: false,
          channel: this.name,
          error: 'Could not generate email content for this notification type'
        };
      }

      // Send the email
      const result = await sendEmail({
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      return {
        success: result.success,
        channel: this.name,
        recipient: recipient.email,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error(`[${this.name}] Failed to send email:`, error);
      return {
        success: false,
        channel: this.name,
        error: error.message
      };
    }
  }

  /**
   * Get recipient details from database
   *
   * @param {string} recipientId - The recipient's ID
   * @param {string} recipientType - The recipient type (Doctors/Patients)
   * @returns {Promise<Object|null>} The recipient data or null
   */
  async getRecipient(recipientId, recipientType) {
    try {
      if (recipientType === 'Doctors') {
        return await doctorRepository.findById(recipientId);
      } else {
        return await patientRepository.findById(recipientId);
      }
    } catch (error) {
      console.error(`[${this.name}] Failed to get recipient:`, error);
      return null;
    }
  }

  /**
   * Get sender details from database
   *
   * @param {string} senderId - The sender's ID
   * @param {string} senderType - The sender type (Doctors/Patients)
   * @returns {Promise<Object|null>} The sender data or null
   */
  async getSender(senderId, senderType) {
    if (!senderId) return null;

    try {
      if (senderType === 'Doctors') {
        return await doctorRepository.findById(senderId);
      } else {
        return await patientRepository.findById(senderId);
      }
    } catch (error) {
      console.error(`[${this.name}] Failed to get sender:`, error);
      return null;
    }
  }

  /**
   * Build email content based on notification type
   *
   * @param {Object} notification - The notification data
   * @param {Object} recipient - The recipient data
   * @returns {Promise<Object|null>} Email content with subject and html
   */
  async buildEmailContent(notification, recipient) {
    const { type, senderId, senderType, metadata } = notification;
    const sender = await this.getSender(senderId, senderType);

    const recipientName = recipient.firstName || recipient.fullName || 'User';
    const senderName = sender ? (sender.firstName || sender.fullName || 'User') : 'User';
    const isRecipientDoctor = notification.recipientType === 'Doctors';

    switch (type) {
      case NotificationType.APPOINTMENT_REQUEST:
        return {
          subject: `New Appointment Request from ${senderName}`,
          html: appointmentRequestTemplate({
            doctorName: recipientName,
            patientName: senderName,
            healthProblems: metadata?.healthProblems,
            appointmentDate: metadata?.appointmentDate,
            appointmentId: notification.appointmentId,
          }),
        };

      case NotificationType.APPOINTMENT_APPROVED:
        return {
          subject: `Appointment Confirmed with Dr. ${senderName}`,
          html: appointmentApprovedTemplate({
            patientName: recipientName,
            doctorName: senderName,
            speciality: sender?.speciality,
            scheduledDate: metadata?.scheduledDate,
            scheduledTime: metadata?.scheduledTime,
            appointmentId: notification.appointmentId,
          }),
        };

      case NotificationType.APPOINTMENT_COMPLETED:
        return {
          subject: `Appointment Completed - Summary from Dr. ${senderName}`,
          html: appointmentCompletedTemplate({
            patientName: recipientName,
            doctorName: senderName,
            diagnosis: metadata?.diagnosis,
            prescription: metadata?.prescription,
            notes: metadata?.notes,
            appointmentId: notification.appointmentId,
          }),
        };

      case NotificationType.APPOINTMENT_CANCELLED:
        return {
          subject: 'Appointment Cancelled - HealOrbit',
          html: appointmentCancelledTemplate({
            recipientName: recipientName,
            otherPartyName: senderName,
            isDoctor: isRecipientDoctor,
            reason: metadata?.reason,
            appointmentDate: metadata?.appointmentDate,
          }),
        };

      default:
        // Generic email for other notification types
        return {
          subject: notification.title,
          html: this.buildGenericTemplate(notification, recipientName),
        };
    }
  }

  /**
   * Build a generic email template for unsupported notification types
   */
  buildGenericTemplate(notification, recipientName) {
    const { title, message } = notification;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">HealOrbit</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #6b7280; font-size: 16px;">Hello ${recipientName},</p>
              <h2 style="color: #1f2937; font-size: 20px;">${title}</h2>
              <p style="color: #1f2937; line-height: 1.6;">${message}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px;">
                This is an automated message from HealOrbit Hospital Management System.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Check if email should be sent for this notification
   *
   * @param {Object} notification - The notification to check
   * @returns {Promise<boolean>}
   */
  async canHandle(notification) {
    if (!this.enabled) {
      return false;
    }

    // Types that should trigger email notifications
    const emailEnabledTypes = [
      NotificationType.APPOINTMENT_REQUEST,
      NotificationType.APPOINTMENT_APPROVED,
      NotificationType.APPOINTMENT_COMPLETED,
      NotificationType.APPOINTMENT_CANCELLED,
    ];

    return emailEnabledTypes.includes(notification.type);
  }
}

// Export singleton instance
export const emailChannel = new EmailChannel();
export default emailChannel;
