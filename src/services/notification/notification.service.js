/**
 * Notification Service
 *
 * Business logic for notification operations.
 * Uses the NotificationDispatcher to send notifications through multiple channels.
 *
 * SOLID Principles Applied:
 * - SRP: This service handles notification business logic only
 * - OCP: New channels can be added without modifying this service
 * - DIP: Depends on dispatcher abstraction, not concrete channels
 */

import { notificationRepository } from '../../repositories/index.js';
import { NotificationType, RecipientType } from '../../config/constants.js';
import { notificationDispatcher } from './dispatcher.service.js';

/**
 * Create and dispatch a notification through all enabled channels
 *
 * @param {Object} notificationData - The notification data
 * @param {Object} options - Dispatch options
 * @param {string[]} options.channels - Specific channels to use (optional)
 * @returns {Promise<Object>} Dispatch results from all channels
 */
export const createNotification = async (notificationData, options = {}) => {
  const {
    recipientId,
    recipientType,
    senderId = null,
    senderType = null,
    appointmentId = null,
    type,
    title,
    message,
    metadata = {}
  } = notificationData;

  const notification = {
    recipientId,
    recipientType,
    senderId,
    senderType,
    appointmentId,
    type,
    title,
    message,
    metadata
  };

  // If specific channels are requested, use only those
  if (options.channels && options.channels.length > 0) {
    return await notificationDispatcher.dispatchTo(notification, options.channels);
  }

  // Otherwise, dispatch to all enabled channels
  return await notificationDispatcher.dispatch(notification);
};

/**
 * Create notification through in-app channel only (database storage)
 * Use this when you want to skip other channels
 *
 * @param {Object} notificationData - The notification data
 * @returns {Promise<Object>}
 */
export const createInAppNotification = async (notificationData) => {
  return await createNotification(notificationData, { channels: ['inapp'] });
};

/**
 * Get notifications for a user (from database)
 */
export const getNotifications = async (recipientId, recipientType, options = {}) => {
  return await notificationRepository.getByRecipient(recipientId, recipientType, options);
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, recipientId) => {
  return await notificationRepository.markAsRead(notificationId, recipientId);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (recipientId, recipientType) => {
  return await notificationRepository.markAllAsRead(recipientId, recipientType);
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId, recipientId) => {
  return await notificationRepository.deleteByIdAndRecipient(notificationId, recipientId);
};

/**
 * Get unread count
 */
export const getUnreadCount = async (recipientId, recipientType) => {
  return await notificationRepository.getUnreadCount(recipientId, recipientType);
};

// ============================================
// Pre-built notification creators
// These provide a clean API for common notification scenarios
// All notifications are dispatched through the dispatcher
// ============================================

/**
 * Notify doctor of new appointment request
 */
export const notifyDoctorOfAppointmentRequest = async (doctorId, patientId, appointmentId, patientName, metadata = {}) => {
  return await createNotification({
    recipientId: doctorId,
    recipientType: RecipientType.DOCTOR,
    senderId: patientId,
    senderType: RecipientType.PATIENT,
    appointmentId,
    type: NotificationType.APPOINTMENT_REQUEST,
    title: 'New Appointment Request',
    message: `${patientName} has requested an appointment.`,
    metadata: {
      patientName,
      ...metadata
    }
  });
};

/**
 * Notify patient of appointment approval
 */
export const notifyPatientOfAppointmentApproval = async (patientId, doctorId, appointmentId, doctorName, metadata = {}) => {
  return await createNotification({
    recipientId: patientId,
    recipientType: RecipientType.PATIENT,
    senderId: doctorId,
    senderType: RecipientType.DOCTOR,
    appointmentId,
    type: NotificationType.APPOINTMENT_APPROVED,
    title: 'Appointment Approved',
    message: `Dr. ${doctorName} has approved your appointment.`,
    metadata: {
      doctorName,
      ...metadata
    }
  });
};

/**
 * Notify patient of appointment completion
 */
export const notifyPatientOfAppointmentCompletion = async (patientId, doctorId, appointmentId, doctorName, metadata = {}) => {
  return await createNotification({
    recipientId: patientId,
    recipientType: RecipientType.PATIENT,
    senderId: doctorId,
    senderType: RecipientType.DOCTOR,
    appointmentId,
    type: NotificationType.APPOINTMENT_COMPLETED,
    title: 'Appointment Completed',
    message: `Your appointment with Dr. ${doctorName} has been marked as completed.`,
    metadata: {
      doctorName,
      ...metadata
    }
  });
};

/**
 * Notify about appointment cancellation
 */
export const notifyOfAppointmentCancellation = async (recipientId, recipientType, senderId, senderType, appointmentId, cancellerName, metadata = {}) => {
  const isRecipientDoctor = recipientType === RecipientType.DOCTOR;
  return await createNotification({
    recipientId,
    recipientType,
    senderId,
    senderType,
    appointmentId,
    type: NotificationType.APPOINTMENT_CANCELLED,
    title: 'Appointment Cancelled',
    message: `${isRecipientDoctor ? '' : 'Dr. '}${cancellerName} has cancelled the appointment.`,
    metadata: {
      cancellerName,
      ...metadata
    }
  });
};

/**
 * Notify doctor of patient review
 */
export const notifyDoctorOfReview = async (doctorId, patientId, appointmentId, patientName) => {
  return await createNotification({
    recipientId: doctorId,
    recipientType: RecipientType.DOCTOR,
    senderId: patientId,
    senderType: RecipientType.PATIENT,
    appointmentId,
    type: NotificationType.REVIEW_ADDED,
    title: 'New Review',
    message: `${patientName} has left a review for your appointment.`
  });
};

/**
 * Send reminder notification
 */
export const sendReminder = async (recipientId, recipientType, title, message, metadata = {}) => {
  return await createNotification({
    recipientId,
    recipientType,
    type: NotificationType.REMINDER,
    title,
    message,
    metadata
  });
};

// ============================================
// Dispatcher management functions
// ============================================

/**
 * Enable a notification channel
 */
export const enableChannel = (channelName) => {
  notificationDispatcher.enableChannel(channelName);
};

/**
 * Disable a notification channel
 */
export const disableChannel = (channelName) => {
  notificationDispatcher.disableChannel(channelName);
};

/**
 * Get status of all notification channels
 */
export const getChannelStatus = () => {
  return notificationDispatcher.getStatus();
};

/**
 * Get the dispatcher instance (for advanced use cases)
 */
export const getDispatcher = () => {
  return notificationDispatcher;
};

// Export constants for external use
export { NotificationType, RecipientType };

export default {
  createNotification,
  createInAppNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  notifyDoctorOfAppointmentRequest,
  notifyPatientOfAppointmentApproval,
  notifyPatientOfAppointmentCompletion,
  notifyOfAppointmentCancellation,
  notifyDoctorOfReview,
  sendReminder,
  enableChannel,
  disableChannel,
  getChannelStatus,
  getDispatcher
};
