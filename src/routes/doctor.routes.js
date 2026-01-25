/**
 * Doctor Routes
 * Doctor-related endpoints
 */

import express from 'express';
import {
  getSettings,
  updateSettings,
  uploadImage,
  getPatientList,
  approveAppointments,
  completeAppointmentHandler,
  cancelAppointmentHandler,
  addReviews,
  getReviews,
  getAllDoctors,
  getDoctorByIdHandler
} from '../controllers/doctor.controller.js';
import {
  getDoctorNotifications,
  markDoctorNotificationRead,
  markAllDoctorNotificationsRead,
  removeDoctorNotification,
  saveDoctorPushSubscription,
  getVapidPublicKey
} from '../controllers/notification.controller.js';
import { contact } from '../controllers/contact.controller.js';

const router = express.Router();

// Public routes
router.get('/patient/doctorPresent', getAllDoctors);
router.get('/patient/doctorByid/:id', getDoctorByIdHandler);

// Doctor profile & settings
router.get('/doctor/doctorSetting/:id', getSettings);
router.post('/doctor/updateDoctorSettings/:id', updateSettings);
router.post('/doctor/image/:id', uploadImage);

// Patient/Appointment management
router.get('/doctor/getPatientList/:id', getPatientList);
router.post('/doctor/approveAppointments/:id', approveAppointments);
router.post('/doctor/completeAppointment/:id', completeAppointmentHandler);
router.post('/doctor/cancelAppointment/:id', cancelAppointmentHandler);
router.post('/doctor/addReviews/:id', addReviews);

// Reviews
router.get('/doctor/getReviews/:id', getReviews);

// Notifications
router.get('/doctor/getNotification/:id', getDoctorNotifications);
router.post('/doctor/markNotificationRead', markDoctorNotificationRead);
router.post('/doctor/markAllNotificationsRead', markAllDoctorNotificationsRead);
router.post('/doctor/removeNotification', removeDoctorNotification);

// Push notifications
router.get('/doctor/vapidPublicKey', getVapidPublicKey);
router.post('/doctor/savePushSubscription', saveDoctorPushSubscription);

// Contact
router.post('/doctor/contact', contact);

export default router;
