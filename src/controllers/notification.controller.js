/**
 * Notification Controller
 * Unified notification endpoints for both doctors and patients
 */

import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notification/notification.service.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response.util.js';
import { RecipientType, Pagination } from '../config/constants.js';
import Patient from '../models/user/patient.model.js';
import Doctor from '../models/user/doctor.model.js';

/**
 * Get notifications for doctor
 */
export const getDoctorNotifications = async (req, res) => {
  try {
    const { page = Pagination.DEFAULT_PAGE, limit = Pagination.DEFAULT_LIMIT, unreadOnly = false } = req.query;

    const result = await getNotifications(
      req.params.id,
      RecipientType.DOCTOR,
      { page: parseInt(page), limit: parseInt(limit), unreadOnly: unreadOnly === 'true' }
    );

    return successResponse(res, result);
  } catch (error) {
    console.error('Get doctor notifications error:', error);
    return errorResponse(res, 'Failed to fetch notifications');
  }
};

/**
 * Get notifications for patient
 */
export const getPatientNotifications = async (req, res) => {
  try {
    const { page = Pagination.DEFAULT_PAGE, limit = Pagination.DEFAULT_LIMIT, unreadOnly = false } = req.query;

    const result = await getNotifications(
      req.params.id,
      RecipientType.PATIENT,
      { page: parseInt(page), limit: parseInt(limit), unreadOnly: unreadOnly === 'true' }
    );

    return successResponse(res, result);
  } catch (error) {
    console.error('Get patient notifications error:', error);
    return errorResponse(res, 'Failed to fetch notifications');
  }
};

/**
 * Mark notification as read (doctor)
 */
export const markDoctorNotificationRead = async (req, res) => {
  try {
    const { notificationId, doctorId } = req.body;
    const notification = await markAsRead(notificationId, doctorId);

    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }

    return successResponse(res, { notification }, 'Notification marked as read');
  } catch (error) {
    console.error('Mark doctor notification read error:', error);
    return errorResponse(res, 'Failed to update notification');
  }
};

/**
 * Mark notification as read (patient)
 */
export const markPatientNotificationRead = async (req, res) => {
  try {
    const { notificationId, patientId } = req.body;
    const notification = await markAsRead(notificationId, patientId);

    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }

    return successResponse(res, { notification }, 'Notification marked as read');
  } catch (error) {
    console.error('Mark patient notification read error:', error);
    return errorResponse(res, 'Failed to update notification');
  }
};

/**
 * Mark all notifications as read (doctor)
 */
export const markAllDoctorNotificationsRead = async (req, res) => {
  try {
    const { doctorId } = req.body;
    await markAllAsRead(doctorId, RecipientType.DOCTOR);

    return successResponse(res, {}, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all doctor notifications read error:', error);
    return errorResponse(res, 'Failed to update notifications');
  }
};

/**
 * Mark all notifications as read (patient)
 */
export const markAllPatientNotificationsRead = async (req, res) => {
  try {
    const { patientId } = req.body;
    await markAllAsRead(patientId, RecipientType.PATIENT);

    return successResponse(res, {}, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all patient notifications read error:', error);
    return errorResponse(res, 'Failed to update notifications');
  }
};

/**
 * Remove notification (doctor)
 */
export const removeDoctorNotification = async (req, res) => {
  try {
    const { doctorId, notificationId } = req.body;
    const notification = await deleteNotification(notificationId, doctorId);

    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }

    return successResponse(res, {}, 'Notification removed successfully');
  } catch (error) {
    console.error('Remove doctor notification error:', error);
    return errorResponse(res, 'Failed to remove notification');
  }
};

/**
 * Remove notification (patient)
 */
export const removePatientNotification = async (req, res) => {
  try {
    const { patientId, notificationId } = req.body;
    const notification = await deleteNotification(notificationId, patientId);

    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }

    return successResponse(res, {}, 'Notification removed successfully');
  } catch (error) {
    console.error('Remove patient notification error:', error);
    return errorResponse(res, 'Failed to remove notification');
  }
};

/**
 * Save push subscription for patient
 */
export const savePatientPushSubscription = async (req, res) => {
  try {
    const { patientId, subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return errorResponse(res, 'Invalid subscription data');
    }

    await Patient.findByIdAndUpdate(patientId, {
      pushSubscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      }
    });

    return successResponse(res, {}, 'Push subscription saved successfully');
  } catch (error) {
    console.error('Save patient push subscription error:', error);
    return errorResponse(res, 'Failed to save push subscription');
  }
};

/**
 * Save push subscription for doctor
 */
export const saveDoctorPushSubscription = async (req, res) => {
  try {
    const { doctorId, subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return errorResponse(res, 'Invalid subscription data');
    }

    await Doctor.findByIdAndUpdate(doctorId, {
      pushSubscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      }
    });

    return successResponse(res, {}, 'Push subscription saved successfully');
  } catch (error) {
    console.error('Save doctor push subscription error:', error);
    return errorResponse(res, 'Failed to save push subscription');
  }
};

/**
 * Get VAPID public key
 */
export const getVapidPublicKey = async (req, res) => {
  try {
    return successResponse(res, {
      publicKey: process.env.VAPID_PUBLIC_KEY
    });
  } catch (error) {
    console.error('Get VAPID public key error:', error);
    return errorResponse(res, 'Failed to get VAPID public key');
  }
};

export default {
  getDoctorNotifications,
  getPatientNotifications,
  markDoctorNotificationRead,
  markPatientNotificationRead,
  markAllDoctorNotificationsRead,
  markAllPatientNotificationsRead,
  removeDoctorNotification,
  removePatientNotification,
  savePatientPushSubscription,
  saveDoctorPushSubscription,
  getVapidPublicKey
};
